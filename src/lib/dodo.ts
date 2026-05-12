/**
 * Dodo Payments — central tier mapping and webhook signature verification.
 *
 * SERVER-ONLY. Do not import from client components — this reads server-only
 * env vars (DODO_API_KEY_SECRET_ARN, DODO_PRODUCT_ID_*) and would leak the
 * mapping logic to the browser bundle.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

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
 * Verify a Dodo webhook signature (Standard Webhooks spec — standardwebhooks.com).
 *
 * Dodo follows the Standard Webhooks signing format used by Svix:
 *   signed_content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 *   signature      = base64( HMAC_SHA256(signed_content, key) )
 * The `webhook-signature` header is a space-separated list of `v1,<sig>` entries
 * (the prefix is the version, the part after the comma is the base64 signature).
 * Verification passes if any one of the provided signatures matches.
 *
 * The shared secret is usually distributed as `whsec_<base64>` — the actual
 * HMAC key is the base64-decoded portion after the prefix. We also accept raw
 * secrets without the prefix for flexibility.
 *
 * @param rawBody  — exact request body bytes Dodo signed (do NOT re-serialize JSON)
 * @param headers  — values of webhook-id, webhook-signature, webhook-timestamp
 * @param secret   — shared secret (with or without `whsec_` prefix)
 */
export function verifyWebhookSignature(
  rawBody: string,
  headers: {
    id: string | null | undefined;
    signature: string | null | undefined;
    timestamp: string | null | undefined;
  },
  secret: string
): boolean {
  const { id, signature, timestamp } = headers;
  if (!id || !signature || !timestamp || !secret) return false;
  // Defend against trailing whitespace/newlines on env-pasted secrets — those
  // would silently corrupt the base64 key without changing string equality.
  secret = secret.trim();

  // Replay protection: reject timestamps more than 5 minutes from now.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  const TOLERANCE_SEC = 5 * 60;
  if (Math.abs(nowSec - ts) > TOLERANCE_SEC) return false;

  // Resolve the HMAC key. `whsec_<base64>` is the Standard Webhooks distribution
  // format; the key is the base64-decoded suffix.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : Buffer.from(secret, "utf8");
  if (key.length === 0) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", key).update(signedContent).digest(); // raw bytes

  // The header is a space-separated list like `v1,<sigA> v1,<sigB>`. Accept
  // any v1 entry that matches. Unknown versions are skipped, not rejected.
  for (const part of signature.split(" ")) {
    const [version, sig] = part.split(",", 2);
    if (version !== "v1" || !sig) continue;
    let provided: Buffer;
    try {
      provided = Buffer.from(sig, "base64");
    } catch {
      continue;
    }
    if (provided.length !== expected.length) continue;
    try {
      if (timingSafeEqual(provided, expected)) return true;
    } catch {
      // length mismatch already filtered; ignore other timingSafeEqual errors
    }
  }
  return false;
}
