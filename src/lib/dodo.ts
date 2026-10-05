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
import { RETIRED_TEAM_SEAT_PRICE_USD, TEAM_SEAT_PRICE_USD } from "@/lib/reddit";

export type LicenseTier = "monthly" | "yearly" | "lifetime" | "team";

const TIERS = ["monthly", "yearly", "lifetime", "team"] as const;

/** Canonical public origin for this product. Payment redirects must never be
 * inferred from a shared Dodo/Amplify environment in production because that
 * can send a Buckets buyer into the Tables authentication session. */
export const CANONICAL_APP_ORIGIN = "https://buckets.serverlesscreed.com";

/**
 * Retired Dodo products that existing subscriptions still renew on. They are
 * recognized (billing views, tier lookups) but never sold: new checkouts and
 * plan changes only target current products. Mirrors RETIRED_PRODUCT_IDS in
 * backend-s3Console/src/lib/dodoTier.ts.
 *
 * Team: the original $99/seat/year product, replaced by the $49/seat/year
 * product in October 2026. Extra IDs can be appended via the comma-separated
 * BUCKETS_DODO_LEGACY_PRODUCT_IDS_<TIER> env var.
 */
const RETIRED_PRODUCT_IDS: Readonly<Record<LicenseTier, readonly string[]>> = {
  monthly: [],
  yearly: [],
  lifetime: [],
  team: ["pdt_0Ngjrw1D8wTdKaMz9Xd6X"],
};

const unique = <T>(value: T, index: number, values: readonly T[]) =>
  values.indexOf(value) === index;

function splitIds(value: string | undefined): string[] {
  return (value ?? "").split(",").map((id) => id.trim()).filter(Boolean);
}

function retiredProductIds(tier: LicenseTier): string[] {
  const suffix = tier.toUpperCase();
  return [
    ...RETIRED_PRODUCT_IDS[tier],
    ...splitIds(process.env[`BUCKETS_DODO_LEGACY_PRODUCT_IDS_${suffix}`]),
    ...splitIds(process.env[`S3CONSOLE_DODO_LEGACY_PRODUCT_IDS_${suffix}`]),
  ].filter(unique);
}

/** True when `productId` is a retired product (existing subscribers only). */
export function isRetiredProductId(productId: unknown): boolean {
  return typeof productId === "string" && !!productId &&
    TIERS.some((tier) => retiredProductIds(tier).includes(productId));
}

/**
 * Products that can be SOLD for a tier: the configured current products,
 * never a retired one (even if an env var still points at it).
 */
export function getPurchasableProductIds(tier?: LicenseTier): string[] {
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
      !!value && unique(value, index, values) && !isRetiredProductId(value)
    );
}

/**
 * Every product that belongs to a tier (current first, then retired). Use this
 * to RECOGNIZE a product, e.g. map a live subscription back to its tier.
 */
export function getConfiguredProductIds(tier?: LicenseTier): string[] {
  const tiers = tier ? [tier] : TIERS;
  return tiers
    .flatMap((value) => {
      const suffix = value.toUpperCase();
      return [
        process.env[`BUCKETS_DODO_PRODUCT_ID_${suffix}`],
        process.env[`S3CONSOLE_DODO_PRODUCT_ID_${suffix}`],
        ...retiredProductIds(value),
      ];
    })
    .filter((value, index, values): value is string =>
      !!value && unique(value, index, values)
    );
}

/**
 * Per-seat price a team actually pays, given its Dodo product. `null` when the
 * product is unknown (e.g. a team row without a product id) — callers then
 * show no price rather than guess.
 */
export function teamSeatPriceForProduct(productId: unknown): number | null {
  if (isRetiredProductId(productId)) return RETIRED_TEAM_SEAT_PRICE_USD;
  if (typeof productId === "string" && getPurchasableProductIds("team").includes(productId)) {
    return TEAM_SEAT_PRICE_USD;
  }
  return null;
}

/** Reverse lookup: which tier a Dodo product id belongs to (null if not ours). */
export function getTierForProductId(productId?: string | null): LicenseTier | null {
  if (!productId) return null;
  return TIERS.find((tier) => getConfiguredProductIds(tier).includes(productId)) ?? null;
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
  const productId = getPurchasableProductIds(tier)[0];
  if (!productId) {
    // Fails closed if the env still names a retired product: selling it would
    // charge a price the website no longer shows.
    throw new Error(
      `BUCKETS_DODO_PRODUCT_ID_${tier.toUpperCase()} or its legacy S3CONSOLE alias is not set to a current product. Configure tier products in the Dodo dashboard and Amplify env.`
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
