/**
 * Dodo Payments webhook handler — single source of truth for license state.
 *
 * Responsibilities:
 *   1. Verify HMAC signature on the raw request body (Standard Webhooks).
 *   2. Idempotency: short-circuit if we've already processed the `webhook-id`
 *      header (DynamoDB conditional PutItem on a WEBHOOK#<id> ledger row).
 *   3. Out-of-order ordering: skip status-affecting updates if an older event
 *      arrives after a newer one (compare `webhook-timestamp` to lastWebhookTs).
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

// Event names verified against Dodo's webhooks documentation (see the
// webhook-integration skill). Dodo uses British spelling "cancelled" — older
// payloads occasionally used "canceled", so the dispatcher normalizes both.
type DodoEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.processing"
  | "payment.cancelled"
  | "refund.succeeded"
  | "subscription.active"
  | "subscription.renewed"
  | "subscription.updated"
  | "subscription.plan_changed"
  | "subscription.on_hold"
  | "subscription.cancelled"
  | "subscription.canceled" // legacy US spelling — normalize on read
  | "subscription.expired"
  | "subscription.failed"
  | "dispute.opened"
  | "license_key.created";

interface DodoEvent {
  type: DodoEventType;
  // Dodo's webhook envelope is `{ business_id, type, timestamp, data }` per
  // their docs — there is NO top-level `id` and NO `created_at`. The per-event
  // identifier and event-time both come from the headers (Standard Webhooks
  // spec: `webhook-id` and `webhook-timestamp`).
  timestamp?: string; // top-level ISO 8601, only sometimes present
  business_id?: string;
  data: DodoPayloadObject;
}

interface DodoPayloadObject {
  // Common fields across event types
  customer?: { customer_id?: string; id?: string; email?: string; name?: string };
  metadata?: Record<string, string>;
  product_id?: string;
  payload_type?: "Payment" | "Subscription" | "Refund" | "Dispute" | "LicenseKey";
  // Subscription-specific (per Dodo docs)
  subscription_id?: string;
  status?: string;
  next_billing_date?: string; // ISO 8601 — Dodo's field for when this subscription bills next
  cancelled_at?: string;
  cancel_at_next_billing_date?: boolean;
  // Payment-specific
  payment_id?: string;
  total_amount?: number;
  // Refund-specific
  refund_id?: string;
  // Dispute-specific
  dispute_id?: string;
  dispute_status?: string;
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
  const verification = verifyWebhookSignature(
    rawBody,
    { id: webhookId, signature: webhookSignature, timestamp: webhookTimestamp },
    webhookSecret
  );
  if (!verification.ok) {
    console.warn("[dodo-webhook] Signature verification failed", {
      reason: verification.reason,
      hasId: !!webhookId,
      hasSignature: !!webhookSignature,
      hasTimestamp: !!webhookTimestamp,
      timestamp: webhookTimestamp,
      bodyLen: rawBody.length,
      // Diagnostic: confirm the secret has the standard whsec_ prefix without
      // leaking any of the key material itself.
      secretHasWhsecPrefix: webhookSecret.startsWith("whsec_"),
      secretLen: webhookSecret.length,
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

  if (!event.type) {
    return NextResponse.json(
      { error: "Missing event type" },
      { status: 400 }
    );
  }

  // The event identifier and timestamp come from the Standard Webhooks headers
  // (Dodo's envelope doesn't ship them in the body).
  const eventId = webhookId!; // verified non-null by signature check above
  const eventTsSec = Number(webhookTimestamp);
  const eventTs = Number.isFinite(eventTsSec) ? eventTsSec * 1000 : Date.now();
  const ledgerKey = `WEBHOOK#${eventId}`;

  // 4. Idempotency pre-check — if we've ALREADY successfully processed this
  //    event, short-circuit. We only check (GetItem), we don't write yet.
  //    The ledger row is written AFTER successful dispatch so that a failed
  //    dispatch can be retried by Dodo (writing the ledger first would cause
  //    every retry to short-circuit before re-running dispatch).
  try {
    const existingLedger = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email: ledgerKey }),
      })
    );
    if (existingLedger.Item) {
      console.log(`[dodo-webhook] Duplicate event ${eventId}, ignoring.`);
      return NextResponse.json({ status: "duplicate" });
    }
  } catch (err) {
    console.error("[dodo-webhook] Failed to read idempotency ledger", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // 5. Dispatch — does the actual license-row update. The row-level conditional
  //    in applyLicenseUpdate (lastWebhookEventId <> :__eid) prevents the same
  //    event from being applied twice if Dodo retries before the ledger write.
  try {
    await dispatch(event, eventId, eventTs);
  } catch (err: any) {
    console.error("[dodo-webhook] Dispatch error", {
      eventId,
      type: event.type,
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }

  // 6. Record successful processing in the ledger (best-effort — a retry that
  //    duplicates this row is harmless because dispatch is idempotent).
  const expiresAt =
    Math.floor(Date.now() / 1000) + WEBHOOK_LEDGER_TTL_DAYS * 24 * 60 * 60;
  try {
    await ddb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(
          {
            email: ledgerKey,
            eventType: event.type,
            receivedAt: new Date().toISOString(),
            expiresAt,
          },
          { removeUndefinedValues: true }
        ),
      })
    );
  } catch (err) {
    console.warn("[dodo-webhook] Failed to write post-dispatch ledger row", err);
    // Not fatal — dispatch already succeeded.
  }
  console.log(`[dodo-webhook] OK ${event.type} eventId=${eventId}`);
  return NextResponse.json({ status: "ok" });
}

/**
 * Resolve subscription tier from a webhook payload. Tries product_id mapping
 * (authoritative — set on the Dodo product) before falling back to checkout
 * metadata. Returns `null` only if both routes fail, in which case callers
 * should log loudly and still proceed (paid=true without tier is better than
 * 500'ing the webhook).
 */
function resolveSubscriptionTier(
  obj: DodoPayloadObject
): "monthly" | "yearly" | null {
  const fromProduct = getTierFromProductId(obj.product_id);
  if (fromProduct === "monthly" || fromProduct === "yearly") return fromProduct;
  const m = obj.metadata?.tier;
  if (m === "monthly" || m === "yearly") return m;
  return null;
}

/**
 * Compute `validUntil` (ms epoch) for a subscription event. Prefers Dodo's
 * `next_billing_date`, falling back to a tier-based interval anchored at
 * `eventTs` so a monthly/yearly user never ends up with `validUntil=undefined`
 * (which would silently mean "no expiry").
 */
function computeValidUntil(
  obj: DodoPayloadObject,
  tier: "monthly" | "yearly" | null,
  eventTs: number
): number | undefined {
  if (obj.next_billing_date) {
    const t = Date.parse(obj.next_billing_date);
    if (!isNaN(t)) return t;
  }
  const DAY_MS = 24 * 60 * 60 * 1000;
  if (tier === "monthly") return eventTs + 31 * DAY_MS;
  if (tier === "yearly") return eventTs + 366 * DAY_MS;
  return undefined;
}

async function dispatch(event: DodoEvent, eventId: string, eventTs: number) {
  const obj = event.data;
  if (!obj) {
    throw new Error("Missing event.data");
  }

  // Resolve customer email — the license row's primary key. Trim only; we do
  // NOT lowercase here because other routes (change-plan, portal-session,
  // payment-success) key by the email Clerk stored, which may be mixed-case.
  // Lowercasing would orphan existing rows. Case normalization is a separate
  // refactor to apply consistently at row-creation time.
  const email = (obj.customer?.email || obj.metadata?.email)?.trim();
  if (!email) {
    const softFailTypes: ReadonlyArray<string> = [
      "subscription.updated",
      "dispute.opened",
      "license_key.created",
    ];
    if (softFailTypes.includes(event.type)) {
      console.warn(
        `[dodo-webhook] No customer email on ${event.type} (event=${eventId}); skipping.`
      );
      return;
    }
    throw new Error(
      `Cannot resolve customer email for event ${eventId} (type=${event.type})`
    );
  }
  console.log(
    `[dodo-webhook] dispatch type=${event.type} email=${email} eventId=${eventId} product_id=${obj.product_id ?? "—"} subscription_id=${obj.subscription_id ?? "—"} metadata.tier=${obj.metadata?.tier ?? "—"}`
  );

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
      if (isStale) return;
      // Discriminate lifetime vs subscription by the AUTHORITATIVE signal:
      // a Payment with a populated `subscription_id` is a subscription invoice
      // (already handled by `subscription.active`/`.renewed`); without one
      // it's a one-time purchase, i.e. lifetime. This is more reliable than
      // metadata (Dodo doesn't always propagate checkout metadata, especially
      // through the UPI flow) and more reliable than product_id mapping
      // (depends on env-var configuration that can drift).
      if (obj.subscription_id) {
        console.log(
          `[dodo-webhook] payment.succeeded skipped — subscription invoice (sub_id=${obj.subscription_id}, product_id=${obj.product_id}); handled by subscription event.`
        );
        return;
      }
      // Safety check: if product_id mapping resolves to monthly/yearly, this
      // is *almost certainly* a misrouted subscription payment that lost its
      // subscription_id somehow. Skip rather than corrupt the row to lifetime.
      const tierFromProduct = getTierFromProductId(obj.product_id);
      if (tierFromProduct === "monthly" || tierFromProduct === "yearly") {
        console.warn(
          `[dodo-webhook] payment.succeeded with monthly/yearly product but no subscription_id (product_id=${obj.product_id}); skipping to avoid corrupting tier.`
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
        dodoCustomerId: obj.customer?.customer_id ?? obj.customer?.id,
        key: licenseKey,
        lastWebhookEventId: eventId,
        lastWebhookTs: eventTs,
        acceptedTermsVersion: obj.metadata?.acceptedTermsVersion,
        acceptedTermsAt: obj.metadata?.acceptedTermsAt
          ? Number(obj.metadata.acceptedTermsAt)
          : undefined,
      });
      return;
    }

    case "subscription.active":
    case "subscription.renewed":
    case "subscription.updated": {
      if (isStale) return;
      const tier = resolveSubscriptionTier(obj);
      if (!tier) {
        console.warn(
          `[dodo-webhook] subscription event missing tier (product_id=${obj.product_id}, metadata.tier=${obj.metadata?.tier}); event=${eventId}. Writing paid=true without tier — fix product-ID env vars.`
        );
      }
      const validUntil = computeValidUntil(obj, tier, eventTs);
      const gracePeriodUntil =
        validUntil !== undefined
          ? validUntil + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
          : undefined;
      const licenseKey = existing?.key || randomUUID();
      await applyLicenseUpdate(email, {
        paid: true,
        tier: tier ?? undefined,
        subscriptionId: obj.subscription_id,
        subscriptionStatus: "active",
        productId: obj.product_id,
        validUntil,
        gracePeriodUntil,
        onTrial: false,
        dodoCustomerId: obj.customer?.customer_id ?? obj.customer?.id,
        key: licenseKey,
        lastWebhookEventId: eventId,
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
      const tier = resolveSubscriptionTier(obj);
      if (!tier) {
        console.warn(
          `[dodo-webhook] subscription.plan_changed: cannot resolve tier (product_id=${obj.product_id}); event=${eventId}`
        );
      }
      const validUntil = computeValidUntil(obj, tier, eventTs);
      const gracePeriodUntil =
        validUntil !== undefined
          ? validUntil + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
          : undefined;
      await applyLicenseUpdate(email, {
        tier: tier ?? undefined,
        productId: obj.product_id,
        validUntil,
        gracePeriodUntil,
        subscriptionStatus: "active",
        lastWebhookEventId: eventId,
        lastWebhookTs: eventTs,
      });
      return;
    }

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
        lastWebhookEventId: eventId,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "subscription.canceled":
    case "subscription.expired":
    case "subscription.failed": {
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
        lastWebhookEventId: eventId,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "refund.succeeded": {
      // Hard revoke. Refund payloads include the original customer per Dodo's
      // Refund schema, so the email resolution above still works.
      await applyLicenseUpdate(email, {
        revoked: true,
        subscriptionStatus: "canceled",
        lastWebhookEventId: eventId,
        lastWebhookTs: eventTs,
      });
      return;
    }

    case "dispute.opened": {
      await applyLicenseUpdate(email, {
        disputed: true,
        lastWebhookEventId: eventId,
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
    console.log(
      `[dodo-webhook] DDB write OK email=${email} paid=${patch.paid} tier=${patch.tier} subscriptionId=${patch.subscriptionId}`
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      // Same event re-applied — safe to ignore.
      console.log(
        `[dodo-webhook] applyLicenseUpdate: condition failed for email=${email} (duplicate eventId).`
      );
      return;
    }
    throw err;
  }
}
