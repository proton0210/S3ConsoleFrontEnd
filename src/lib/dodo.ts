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

export function getDodoApiBaseUrl(): string {
  return process.env.DODO_API_BASE_URL || "https://live.dodopayments.com";
}

/**
 * Verify Dodo webhook HMAC signature using the shared secret.
 *
 * Dodo signs webhook payloads with a shared HMAC-SHA256 secret. We compute
 * the same HMAC over the raw request body and compare in constant time.
 *
 * @param rawBody — the raw request body bytes (NOT JSON.parsed; signature is
 *   computed over the exact bytes Dodo signed, including whitespace)
 * @param signatureHeader — the header value Dodo sent (typically `webhook-signature` or `x-dodo-signature`)
 * @param secret — shared secret from Secrets Manager (Phase 11 wires this via getSecretJson)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Strip optional `sha256=` prefix Dodo may send
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();

  // Both buffers must be the same length for timingSafeEqual; otherwise it throws.
  // Pad/reject mismatched lengths up front (constant-time short-circuit).
  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}
