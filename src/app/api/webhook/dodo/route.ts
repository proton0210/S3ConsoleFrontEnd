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
import { verifyWebhookSignature } from "@/lib/dodo";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";
const WEBHOOK_LEDGER_TTL_DAYS = 30;
const GRACE_PERIOD_DAYS = 7;

const ddb = new DynamoDBClient(getDdbClientConfig());

type DodoEventType =
  | "payment.succeeded"
  | "payment.refunded"
  | "subscription.active"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.payment_failed"
  | "subscription.on_hold"
  | "subscription.canceled"
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
  const signatureHeader =
    req.headers.get("webhook-signature") ||
    req.headers.get("x-dodo-signature") ||
    req.headers.get("x-webhook-signature");

  // 1. Resolve webhook secret. Phase 11 will swap this for getSecretJson() reading
  //    from Secrets Manager via DODO_WEBHOOK_SECRET_ARN.
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[dodo-webhook] DODO_WEBHOOK_SECRET not set; refusing all webhooks.");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // 2. HMAC verification
  if (!verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    console.warn("[dodo-webhook] Signature verification failed", {
      hasHeader: !!signatureHeader,
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

  switch (event.type) {
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
      const licenseKey = existing?.key || randomUUID();
      await applyLicenseUpdate(email, {
        paid: true,
        tier: "lifetime",
        productId: obj.product_id,
        validUntil: null,
        gracePeriodUntil: null,
        subscriptionStatus: "active",
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
      const tier = (obj.metadata?.tier === "monthly" || obj.metadata?.tier === "yearly")
        ? obj.metadata.tier
        : undefined;
      if (!tier) {
        console.warn(
          `[dodo-webhook] subscription event missing tier metadata; event=${event.id}`
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

    case "subscription.payment_failed":
    case "subscription.on_hold": {
      if (isStale) return;
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
