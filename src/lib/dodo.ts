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

export type LicenseTier = "monthly" | "yearly" | "lifetime" | "team";

const TIERS = ["monthly", "yearly", "lifetime", "team"] as const;

/** Canonical public origin for this product. Payment redirects must never be
 * inferred from a shared Dodo/Amplify environment in production because that
 * can send a Buckets buyer into the Tables authentication session. */
export const CANONICAL_APP_ORIGIN = "https://buckets.serverlesscreed.com";

export function getConfiguredProductIds(tier?: LicenseTier): string[] {
  const tiers = tier ? [tier] : TIERS;
  return tiers
    .flatMap((value) => {
      const suffix = value.toUpperCase();
      return [
        process.env[`BUCKETS_DODO_PRODUCT_ID_${suffix}`],
        process.env[`S3CONSOLE_DODO_PRODUCT_ID_${suffix}`],
      ];
    })
    .filter((value, index, values): value is string =>
      !!value && values.indexOf(value) === index
    );
}

export function isLicenseTier(value: unknown): value is LicenseTier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

/**
 * Resolve the Dodo product ID for a given tier from env. Throws if the env
 * var is unset — fail fast at request time rather than silently routing to
 * the wrong product.
 */
export function getProductId(tier: LicenseTier): string {
  const productId = getConfiguredProductIds(tier)[0];
  if (!productId) {
    throw new Error(
      `BUCKETS_DODO_PRODUCT_ID_${tier.toUpperCase()} or its legacy S3CONSOLE alias is not set. Configure tier products in the Dodo dashboard and Amplify env.`
    );
  }
  return productId;
}

/**
 * Subscription tiers use Dodo's /subscriptions endpoint and auto-renew.
 * Lifetime is a one-time purchase via /checkouts.
 */
export function isSubscriptionTier(tier: LicenseTier): boolean {
  return tier === "monthly" || tier === "yearly" || tier === "team";
}

/** Minimum seats on a team subscription (mirrors backend team-invite checks). */
export const MIN_TEAM_SEATS = 3;

/** Maximum seats self-serve — protects against fat-fingered quantities; larger
 * teams go through sales/support so the charge is reviewed first. */
export const MAX_TEAM_SEATS = 50;

export function getDodoApiBaseUrl(): string {
  return process.env.DODO_API_BASE_URL || "https://live.dodopayments.com";
}

export function getProductAppOrigin(requestOrigin?: string): string {
  if (process.env.NODE_ENV === "production") return CANONICAL_APP_ORIGIN;
  return process.env.NEXT_PUBLIC_APP_URL || requestOrigin || CANONICAL_APP_ORIGIN;
}

export function getCheckoutReturnUrl(requestOrigin?: string): string {
  return new URL("/payment-status", getProductAppOrigin(requestOrigin)).toString();
}
