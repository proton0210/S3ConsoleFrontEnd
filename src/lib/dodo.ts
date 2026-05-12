/**
 * Dodo Payments — central tier mapping.
 *
 * SERVER-ONLY. Do not import from client components — this reads server-only
 * env vars (DODO_API_KEY, DODO_PRODUCT_ID_*) and would leak the mapping logic
 * to the browser bundle.
 *
 * Webhook signature verification lives in the dedicated Lambda Function URL
 * at `backend-s3Console/src/handlers/dodo-webhook.ts` (via the shared module
 * `backend-s3Console/src/lib/dodoTier.ts`). The frontend no longer receives
 * Dodo webhook traffic — the Dodo dashboard points at the Lambda URL.
 */
import "server-only";

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
