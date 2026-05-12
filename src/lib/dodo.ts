/**
 * Dodo Payments — central tier mapping and webhook signature verification.
 *
 * SERVER-ONLY. Do not import from client components — this reads server-only
 * env vars (DODO_API_KEY_SECRET_ARN, DODO_PRODUCT_ID_*) and would leak the
 * mapping logic to the browser bundle.
 */
import "server-only";
import { Webhook } from "standardwebhooks";

export type LicenseTier = "monthly" | "yearly" | "lifetime";

const TIERS = ["monthly", "yearly", "lifetime"] as const;

export function isLicenseTier(value: unknown): value is LicenseTier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

/**
 * Resolve the Dodo product ID for a given tier from env. Throws if the env
 * var is unset — fail fast at request time rather than silently routing to
 * the wrong product.
 */
export function getProductId(tier: LicenseTier): string {
  const map: Record<LicenseTier, string | undefined> = {
    monthly: process.env.S3CONSOLE_DODO_PRODUCT_ID_MONTHLY,
    yearly: process.env.S3CONSOLE_DODO_PRODUCT_ID_YEARLY,
    lifetime: process.env.S3CONSOLE_DODO_PRODUCT_ID_LIFETIME,
  };
  const productId = map[tier];
  if (!productId) {
    throw new Error(
      `S3CONSOLE_DODO_PRODUCT_ID_${tier.toUpperCase()} env var is not set. Configure tier products in the Dodo dashboard and Amplify env.`
    );
  }
  return productId;
}

/**
 * Subscription tiers use Dodo's /subscriptions endpoint and auto-renew.
 * Lifetime is a one-time purchase via /checkouts.
 */
export function isSubscriptionTier(tier: LicenseTier): boolean {
  return tier === "monthly" || tier === "yearly";
}

/**
 * Reverse lookup: given a Dodo product ID, return the tier it corresponds to.
 * Returns null when the product ID doesn't match any configured tier (e.g.,
 * an addon product or stale env). Used by the webhook handler to derive tier
 * authoritatively from the event payload rather than trusting metadata, which
 * Dodo doesn't always propagate from /change-plan calls into subsequent
 * subscription.plan_changed events.
 */
export function getTierFromProductId(
  productId: string | undefined | null
): LicenseTier | null {
  if (!productId) return null;
  const map: Record<LicenseTier, string | undefined> = {
    monthly: process.env.S3CONSOLE_DODO_PRODUCT_ID_MONTHLY,
    yearly: process.env.S3CONSOLE_DODO_PRODUCT_ID_YEARLY,
    lifetime: process.env.S3CONSOLE_DODO_PRODUCT_ID_LIFETIME,
  };
  for (const [tier, configuredId] of Object.entries(map)) {
    if (configuredId && configuredId === productId) {
      return tier as LicenseTier;
    }
  }
  return null;
}

export function getDodoApiBaseUrl(): string {
  return process.env.DODO_API_BASE_URL || "https://live.dodopayments.com";
}

/**
 * Verify a Dodo webhook signature using the `standardwebhooks` library —
 * the same package Dodo's own checkout demo uses, so we match their server's
 * signing implementation exactly (Standard Webhooks v1, base64 HMAC-SHA256
 * over `${id}.${timestamp}.${body}`).
 *
 * The secret is the value Dodo shows in the dashboard (typically `whsec_<base64>`).
 * The library strips the prefix and base64-decodes the suffix to derive the key.
 *
 * Returns true on success, false on any verification failure (the library
 * throws — we convert to a boolean so callers can stay tidy).
 */
export function verifyWebhookSignature(
  rawBody: string,
  headers: {
    id: string | null | undefined;
    signature: string | null | undefined;
    timestamp: string | null | undefined;
  },
  secret: string
): { ok: true } | { ok: false; reason: string } {
  const { id, signature, timestamp } = headers;
  if (!id || !signature || !timestamp) {
    return { ok: false, reason: "Missing webhook-id/signature/timestamp header" };
  }
  if (!secret) {
    return { ok: false, reason: "Webhook secret not configured" };
  }
  try {
    new Webhook(secret.trim()).verify(rawBody, {
      "webhook-id": id,
      "webhook-signature": signature,
      "webhook-timestamp": timestamp,
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "Verification failed" };
  }
}
