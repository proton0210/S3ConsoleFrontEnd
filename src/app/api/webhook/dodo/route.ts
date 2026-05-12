/**
 * Dodo Payments webhook handler — single source of truth for license state.
 *
 * Responsibilities:
 *   1. Verify HMAC signature on the raw request body.
 *   2. Idempotency: short-circuit if we've already processed this event.id
 *      (DynamoDB conditional PutItem on a WEBHOOK#<eventId> ledger row).
 *   3. Out-of-order ordering: skip status-affecting updates if an older event
 *      arrives after a newer one (compare event.created_at to lastWebhookTs).
 *   4. Dispatch by event.type. All license state transitions go through here.
 *
 * The browser-redirect /payment-status route is being demoted in Phase 7 to a
 * read-only poller — this webhook is the only writer of paid/tier/validUntil.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import {
  getDodoApiBaseUrl,
  getTierFromProductId,
  verifyWebhookSignature,
} from "@/lib/dodo";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";
const WEBHOOK_LEDGER_TTL_DAYS = 30;
const GRACE_PERIOD_DAYS = 7;

const ddb = new DynamoDBClient(getDdbClientConfig());

// Dodo emits cancellation events with the British spelling ("cancelled") in
// some payloads and the US spelling ("canceled") in others depending on the
// API version. Normalize on read so the dispatcher only needs to handle one.
type DodoEventType =
  | "payment.succeeded"
  | "payment.refunded"
  | "subscription.active"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.plan_changed"
  | "subscription.payment_failed"
  | "subscription.on_hold"
  | "subscription.canceled"
  | "subscription.cancelled"
  | "subscription.expired"
  | "dispute.created"
  | "dispute.lost"
  | "dispute.won";

interface DodoEvent {
  id: string;
  type: DodoEventType;
  created_at: string; // ISO 8601
  data: {
    object: DodoPayloadObject;
  };
}

interface DodoPayloadObject {
  // Common fields across event types
  customer?: { id?: string; email?: string };
  metadata?: Record<string, string>;
  product_id?: string;
  // Subscription-specific
  subscription_id?: string;
  status?: string; // active | canceled | past_due | etc.
  current_period_end?: string; // ISO 8601
  // Payment-specific
  payment_id?: string;
  amount?: number;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const webhookId = req.headers.get("webhook-id");
  const webhookSignature = req.headers.get("webhook-signature");
  const webhookTimestamp = req.headers.get("webhook-timestamp");

  // 1. Resolve webhook secret. Phase 11 will swap this for getSecretJson() reading
  //    from Secrets Manager via DODO_WEBHOOK_SECRET_ARN.
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[dodo-webhook] DODO_WEBHOOK_SECRET not set; refusing all webhooks.");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // 2. Standard Webhooks signature verification (id + timestamp + body)
  if (
    !verifyWebhookSignature(
      rawBody,
      { id: webhookId, signature: webhookSignature, timestamp: webhookTimestamp },
      webhookSecret
    )
  ) {
    console.warn("[dodo-webhook] Signature verification failed", {
      hasId: !!webhookId,
      hasSignature: !!webhookSignature,
      hasTimestamp: !!webhookTimestamp,
      bodyLen: rawBody.length,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse event
  let event: DodoEvent;
  try {
    event = JSON.parse(rawBody) as DodoEvent;
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!event.id || !event.type) {
    return NextResponse.json(
      { error: "Missing required event fields (id, type)" },
      { status: 400 }
    );
  }

  // 4. Idempotency gate — conditional PutItem with attribute_not_exists.
  //    If the put fails, we've already processed this event; return 200 to stop retries.
  const ledgerKey = `WEBHOOK#${event.id}`;
  const expiresAt =
    Math.floor(Date.now() / 1000) + WEBHOOK_LEDGER_TTL_DAYS * 24 * 60 * 60;
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(
          {
            email: ledgerKey, // overload PK as ledger key
            eventType: event.type,
            receivedAt: new Date().toISOString(),
            expiresAt,
          },
          { removeUndefinedValues: true }
        ),
        ConditionExpression: "attribute_not_exists(email)",
      })
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      // Already processed — quietly accept so Dodo stops retrying.
      console.log(`[dodo-webhook] Duplicate event ${event.id}, ignoring.`);
      return NextResponse.json({ status: "duplicate" });
    }
    console.error("[dodo-webhook] Failed to write idempotency ledger", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // 5. Dispatch
  try {
    await dispatch(event);
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("[dodo-webhook] Dispatch error", { eventId: event.id, type: event.type, err });
    // Return 500 so Dodo retries the delivery; the idempotency ledger row above
    // means the retry will short-circuit if we already partially applied it,
    // but the underlying license update is itself idempotent (conditional updates).
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

async function dispatch(event: DodoEvent) {
  const obj = event.data?.object;
  if (!obj) {
    throw new Error("Missing event.data.object");
  }

  // Resolve customer email — the license row's primary key.
  const email = obj.customer?.email || obj.metadata?.email;
  if (!email) {
    throw new Error(`Cannot resolve customer email for event ${event.id}`);
  }

  const eventTs = Date.parse(event.created_at);
  if (isNaN(eventTs)) {
    throw new Error(`Invalid event.created_at: ${event.created_at}`);
  }

  // Fetch existing license row (may not exist yet — webhook may create it).
  const existing = await getLicenseRow(email);

  // Out-of-order guard: if a newer event has already been applied, skip
  // status-affecting fields. We still record the idempotency entry above.
  const isStale =
    existing?.lastWebhookTs &&
    typeof existing.lastWebhookTs === "number" &&
    eventTs < existing.lastWebhookTs;

  // Subscription-id mismatch guard: if the row already has a subscriptionId
  // and this event references a *different* subscription, it's a late event
  // for an old/replaced subscription (e.g., the user upgraded monthly→yearly
  // and the old monthly is still emitting cancel/expired events). Applying
  // those would corrupt the new subscription's state, so we skip.
  //
  // Lifetime tier is also a stale destination for *any* subscription event:
  // when a recurring user upgrades to lifetime we clear subscriptionId from
  // the row, then merchant-cancel the old sub at Dodo. The cancellation event
  // that bounces back must NOT flip the lifetime row's subscriptionStatus.
  const incomingSubId = obj.subscription_id;
  const incomingIsSubscriptionEvent =
    !!incomingSubId &&
    typeof event.type === "string" &&
    event.type.startsWith("subscription.");
  const isStaleSubscription =
    incomingIsSubscriptionEvent &&
    ((existing?.subscriptionId &&
      typeof existing.subscriptionId === "string" &&
      existing.subscriptionId !== incomingSubId) ||
      existing?.tier === "lifetime");

  // Normalize event type so we don't have to maintain US/UK spelling parity
  // through every case statement.
  const normalizedType =
    event.type === "subscription.cancelled"
      ? "subscription.canceled"
      : event.type;

  switch (normalizedType) {
    case "payment.succeeded": {
      // Lifetime one-time purchase.
      if (isStale) return;
      const tier =
        obj.metadata?.tier === "lifetime" ? "lifetime" : obj.metadata?.tier;
      // We trust metadata.tier set at checkout creation time (Phase 1).
      // If this is genuinely a lifetime payment (not a subscription invoice),
      // the metadata will say so.
      if (tier !== "lifetime") {
        // Subscription-driven payment.succeeded — we've already handled the
        // subscription lifecycle via subscription.active/renewed.
        console.log(
          `[dodo-webhook] payment.succeeded with non-lifetime tier=${tier}; skipping (handled by subscription event).`
        );
        return;
      }

      // If the user is upgrading from monthly/yearly to lifetime, the recurring
      // subscription is still active in Dodo and would charge again on its
      // next billing date. Cancel it immediately so they only pay the one-time
      // lifetime fee. Best-effort — we still write the row even if the cancel
      // call fails; ops can clean up via Dodo dashboard.
      const previousSubscriptionId = existing?.subscriptionId;
      if (
        previousSubscriptionId &&
        typeof previousSubscriptionId === "string" &&
        existing?.tier !== "lifetime"
      ) {
        await cancelDodoSubscription(
          previousSubscriptionId,
          "cancelled_by_merchant",
          "Auto-cancelled on upgrade to lifetime."
        ).catch((err) => {
          console.error(
            "[dodo-webhook] Failed to auto-cancel prior subscription on lifetime upgrade",
            { previousSubscriptionId, error: err?.message || err }
          );
        });
      }

      const licenseKey = existing?.key || randomUUID();
      await applyLicenseUpdate(email, {
        paid: true,
        tier: "lifetime",
        productId: obj.product_id,
        validUntil: null,
        gracePeriodUntil: null,
        subscriptionStatus: "active",
        // Clear the recurring subscriptionId — lifetime is not a subscription,
        // and leaving the old id in place would let stale webhook events for
        // it fall through the mismatch guard incorrectly.
        subscriptionId: null,
        onTrial: false,
        dodoCustomerId: obj.customer?.id,
        key: licenseKey,
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
        acceptedTermsVersion: obj.metadata?.acceptedTermsVersion,
        acceptedTermsAt: obj.metadata?.acceptedTermsAt
          ? Number(obj.metadata.acceptedTermsAt)
          : undefined,
      });
      return;
    }

    case "subscription.created":
    case "subscription.active":
    case "subscription.renewed": {
      if (isStale) return;
      // Prefer product_id (authoritative — set by Dodo on the subscription)
      // over metadata.tier (only present if our checkout call set it, and not
      // guaranteed to propagate through every event).
      const tierFromProduct = getTierFromProductId(obj.product_id);
      const tier =
        tierFromProduct === "monthly" || tierFromProduct === "yearly"
          ? tierFromProduct
          : obj.metadata?.tier === "monthly" || obj.metadata?.tier === "yearly"
            ? obj.metadata.tier
            : undefined;
      if (!tier) {
        console.warn(
          `[dodo-webhook] subscription event missing tier (product_id=${obj.product_id}); event=${event.id}`
        );
      }
      const periodEnd = obj.current_period_end
        ? Date.parse(obj.current_period_end)
        : undefined;
      const validUntil = periodEnd && !isNaN(periodEnd) ? periodEnd : undefined;
      const gracePeriodUntil =
        validUntil !== undefined
          ? validUntil + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
          : undefined;
      const licenseKey = existing?.key || randomUUID();
      await applyLicenseUpdate(email, {
        paid: true,
        tier,
        subscriptionId: obj.subscription_id,
        subscriptionStatus: "active",
        productId: obj.product_id,
        validUntil,
        gracePeriodUntil,
        onTrial: false,
        dodoCustomerId: obj.customer?.id,
        key: licenseKey,
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
        acceptedTermsVersion: obj.metadata?.acceptedTermsVersion,
        acceptedTermsAt: obj.metadata?.acceptedTermsAt
          ? Number(obj.metadata.acceptedTermsAt)
          : undefined,
      });
      return;
    }

    case "subscription.plan_changed": {
      if (isStale) return;
      if (isStaleSubscription) {
        console.log(
          `[dodo-webhook] subscription.plan_changed for old subscriptionId ${incomingSubId} (current=${existing?.subscriptionId}); ignoring.`
        );
        return;
      }
      // Plan change can come from our /api/dodo/change-plan call OR from the
      // user changing plan inside Dodo's hosted portal. Either way, derive
      // tier from product_id — metadata is unreliable across plan changes.
      const tierFromProduct = getTierFromProductId(obj.product_id);
      const tier =
        tierFromProduct === "monthly" || tierFromProduct === "yearly"
          ? tierFromProduct
          : obj.metadata?.tier === "monthly" || obj.metadata?.tier === "yearly"
            ? obj.metadata.tier
            : undefined;
      if (!tier) {
        console.warn(
          `[dodo-webhook] subscription.plan_changed: cannot resolve tier (product_id=${obj.product_id}); event=${event.id}`
        );
      }
      const periodEnd = obj.current_period_end
        ? Date.parse(obj.current_period_end)
        : undefined;
      const validUntil = periodEnd && !isNaN(periodEnd) ? periodEnd : undefined;
      const gracePeriodUntil =
        validUntil !== undefined
          ? validUntil + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
          : undefined;
      await applyLicenseUpdate(email, {
        tier,
        productId: obj.product_id,
        validUntil,
        gracePeriodUntil,
        subscriptionStatus: "active",
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "subscription.payment_failed":
    case "subscription.on_hold": {
      if (isStale) return;
      if (isStaleSubscription) {
        console.log(
          `[dodo-webhook] ${event.type} for old subscriptionId ${incomingSubId} (current=${existing?.subscriptionId}); ignoring.`
        );
        return;
      }
      // Mark past_due but DON'T clear paid — the grace window handles access.
      await applyLicenseUpdate(email, {
        subscriptionStatus: "past_due",
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "subscription.canceled":
    case "subscription.expired": {
      if (isStale) return;
      if (isStaleSubscription) {
        console.log(
          `[dodo-webhook] ${event.type} for old subscriptionId ${incomingSubId} (current=${existing?.subscriptionId}); ignoring.`
        );
        return;
      }
      // User keeps access until validUntil — we leave that intact.
      // gracePeriodUntil also stays so the 7-day post-validUntil window applies
      // for users who failed payment.
      await applyLicenseUpdate(email, {
        subscriptionStatus: "canceled",
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "payment.refunded": {
      // Hard revoke.
      await applyLicenseUpdate(email, {
        revoked: true,
        subscriptionStatus: "canceled",
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      // Phase 10 wires the refund-confirmation user email + founder ping here.
      return;
    }

    case "dispute.created": {
      await applyLicenseUpdate(email, {
        disputed: true,
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "dispute.lost": {
      await applyLicenseUpdate(email, {
        revoked: true,
        disputed: true,
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "dispute.won": {
      await applyLicenseUpdate(email, {
        disputed: false,
        lastWebhookEventId: event.id,
        lastWebhookTs: eventTs,
      });
      return;
    }

    default: {
      // Unknown event type — log and ignore. Idempotency ledger still gates retries.
      console.warn(`[dodo-webhook] Unhandled event type: ${event.type}`);
      return;
    }
  }
}

/**
 * Cancel a Dodo subscription via PATCH /subscriptions/{id}. Used when the
 * user upgrades from a recurring tier to lifetime — the recurring sub would
 * otherwise keep charging on its next renewal date.
 *
 * Idempotent on Dodo's side: a subscription that's already cancelled returns
 * 200 with the same state, not an error.
 */
async function cancelDodoSubscription(
  subscriptionId: string,
  reason: "cancelled_by_customer" | "cancelled_by_merchant" = "cancelled_by_merchant",
  comment?: string
): Promise<void> {
  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_API_KEY not set");
  }
  const url = `${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      status: "cancelled",
      cancel_reason: reason,
      ...(comment ? { cancellation_comment: comment } : {}),
    }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      `Dodo cancel returned ${resp.status}: ${data?.message || "unknown error"}`
    );
  }
}

async function getLicenseRow(email: string): Promise<Record<string, any> | null> {
  const { Item } = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ email }),
    })
  );
  return Item ? unmarshall(Item) : null;
}

/**
 * Apply a partial license update via DynamoDB UpdateItem.
 *
 * Filters out undefined values so callers can pass partial objects without
 * inadvertently writing `undefined` (DynamoDB rejects undefined unless you set
 * removeUndefinedValues — and even then we want explicit nulls only where the
 * caller said `null` on purpose, e.g., validUntil for lifetime).
 */
async function applyLicenseUpdate(
  email: string,
  patch: Record<string, any>
): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  // Conditional update: only apply if our event is newer than what's stored.
  // Both `attribute_not_exists(lastWebhookEventId)` (first write) and
  // `lastWebhookEventId <> :sameId` (defensive guard against same-event re-write)
  // are accepted.
  const setClauses: string[] = [];
  const exprValues: Record<string, any> = {};
  const exprNames: Record<string, string> = {};

  for (const [k, v] of entries) {
    const placeholder = `:${k}`;
    const namePlaceholder = `#${k}`;
    setClauses.push(`${namePlaceholder} = ${placeholder}`);
    exprValues[placeholder] = v;
    exprNames[namePlaceholder] = k;
  }

  // The `email` PK is set on the first write; subsequent writes don't need to
  // re-set it but we want to ensure the row exists. Use UpdateItem (which
  // upserts in DynamoDB by default).
  //
  // Default machine cap on new paid rows: when this update is creating a
  // paid row for the first time (paid=true is in the patch), default
  // licenseCount to 2 — but only if the row doesn't already have a value.
  // Use if_not_exists() so a support-bumped 5-machine row is preserved
  // through subsequent webhook updates.
  if (patch.paid === true) {
    setClauses.push(`#licenseCount = if_not_exists(#licenseCount, :__defaultLc)`);
    exprNames["#licenseCount"] = "licenseCount";
    exprValues[":__defaultLc"] = 2;
  }

  const eventIdToWrite = patch.lastWebhookEventId;
  const conditionExpression = eventIdToWrite
    ? "attribute_not_exists(lastWebhookEventId) OR lastWebhookEventId <> :__eid"
    : undefined;
  if (eventIdToWrite) {
    exprValues[":__eid"] = eventIdToWrite;
  }

  try {
    await ddb.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email }),
        UpdateExpression: `SET ${setClauses.join(", ")}`,
        ExpressionAttributeValues: marshall(exprValues, {
          removeUndefinedValues: true,
        }),
        ExpressionAttributeNames: exprNames,
        ConditionExpression: conditionExpression,
      })
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      // Same event re-applied — safe to ignore.
      console.log(
        `[dodo-webhook] applyLicenseUpdate: condition failed (likely duplicate eventId).`
      );
      return;
    }
    throw err;
  }
}
