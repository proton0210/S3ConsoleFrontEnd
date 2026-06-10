/**
 * Reddit Pixel — typed, SSR-safe event helper.
 *
 * The base pixel (loader + init + first PageVisit) is injected by
 * `<RedditPixel />` (see components/reddit-pixel.tsx). This module is the thin,
 * typed surface every call site uses to fire conversion events, so we never
 * scatter `(window as any).rdt(...)` across the app.
 *
 * Event taxonomy maps to our real funnel so Reddit can optimize campaigns and
 * we can read true ROAS:
 *   PageVisit   → every page / route change   (reach + retargeting)
 *   ViewContent → pricing view                (high intent)
 *   AddToCart   → checkout started (/buy)      (mid-funnel)
 *   Purchase    → payment verified succeeded   (revenue — the money event)
 *   Lead        → desktop download             (activation)
 *
 * Reddit's `value` is the numeric amount in the currency's major unit
 * (e.g. 149 for $149), `currency` is ISO-4217. `transactionId` dedupes Purchase
 * across webhook polling / page refreshes.
 */

export const REDDIT_PIXEL_ID = "a2_j2tprpw6cnq6";

export type RedditEvent =
  | "PageVisit"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "AddToWishlist"
  | "Purchase"
  | "Lead"
  | "SignUp"
  | "Custom";

export interface RedditEventData {
  currency?: string;
  value?: number;
  itemCount?: number;
  transactionId?: string;
  conversionId?: string;
  customEventName?: string;
  products?: Array<{ id?: string; name?: string; category?: string }>;
}

declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void;
  }
}

/** Our license tiers, all USD. Kept in sync with lib/config pricing. */
export type LicenseTier = "monthly" | "yearly" | "lifetime" | "team";

/**
 * Team seat price — SINGLE SOURCE OF TRUTH for every display site (pricing
 * card, buy-page seat total, billing TIER_LABELS, /account/team copy).
 * MUST match the team product's price in the Dodo dashboard: Dodo is what
 * actually charges (product price × quantity); this constant is only what we
 * SHOW. If you change the Dodo product price, change this one number.
 */
export const TEAM_SEAT_PRICE_USD = 99;

const TIER_VALUE_USD: Record<LicenseTier, number> = {
  monthly: 9,
  yearly: 79,
  lifetime: 149,
  // Per-seat price — callers multiply by seat count for cart value.
  team: TEAM_SEAT_PRICE_USD,
};

/** Numeric USD value for a tier; returns undefined for unknown tiers. */
export function tierValue(tier: string | null | undefined): number | undefined {
  if (!tier) return undefined;
  return TIER_VALUE_USD[tier as LicenseTier];
}

/**
 * Fire a Reddit conversion event. No-op on the server or before the pixel
 * loads (its own callQueue also buffers, so calls are never silently dropped
 * once `window.rdt` exists). Never throws — analytics must not break a page.
 */
export function trackReddit(event: RedditEvent, data?: RedditEventData): void {
  if (typeof window === "undefined" || typeof window.rdt !== "function") return;
  try {
    if (data) window.rdt("track", event, data);
    else window.rdt("track", event);
  } catch {
    /* analytics is best-effort */
  }
}

/**
 * Fired when a user clicks any "Download Now" CTA (a link that routes to
 * /downloads). This is a top-of-funnel *intent* signal — distinct from the
 * `Lead` event we fire when the actual installer download starts. Emitted as
 * a Custom event so it shows up as its own conversion in Reddit Events Manager.
 */
export function trackDownloadClick(): void {
  trackReddit("Custom", { customEventName: "DownloadNowClick" });
}
