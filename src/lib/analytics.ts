/**
 * One place for product analytics. Every call goes to PostHog (when it is
 * enabled for this build) and to GA4, using GA4's recommended event names
 * where one exists (`begin_checkout`, `sign_up`) so both tools line up.
 *
 * Shared with the Tables website: copy this file as is. The only thing that
 * differs between the two sites is NEXT_PUBLIC_APP_ID, which PostHog adds to
 * every event as `app` (see src/instrumentation-client.ts).
 *
 * Never put emails, names, AWS identifiers or payment ids in event
 * properties. (The account email is set once as a person property in
 * src/components/posthog-identify.tsx, and nowhere else.)
 */
import posthog from "posthog-js";
import { sendGAEvent } from "@next/third-parties/google";

export type AppId = "buckets" | "tables";
export type ProductId = "buckets" | "tables" | "suite";

export const APP_ID: AppId =
  process.env.NEXT_PUBLIC_APP_ID === "tables" ? "tables" : "buckets";

export const POSTHOG_ENABLED =
  process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

type Props = Record<string, string | number | boolean | undefined>;

/** The tracking plan. Add an event here before using it. */
export type AnalyticsEvents = {
  /** Any call-to-action that isn't a download or a checkout. */
  cta_clicked: { cta: string; location: string } & Props;
  download_clicked: {
    product: ProductId;
    os: "macOS" | "Windows" | "Linux";
    location: string;
    arch?: string;
    format?: string;
    release_channel?: string;
  };
  downloads_page_viewed: { has_license: boolean };
  pricing_tier_clicked: { tier: string; location: string; signed_in: boolean };
  begin_checkout: { product: ProductId; tier: string; location: string; seats?: number };
  film_opened: { location: string };
  film_chapter_clicked: { location: string; t: number };
  wow_selected: { wow: string };
  sign_up: { method?: string };
};

export type AnalyticsEvent = keyof AnalyticsEvents;

function clean(props: Props): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]): void {
  const properties = clean(props as Props);
  if (POSTHOG_ENABLED) {
    try {
      posthog.capture(event, properties);
    } catch {
      // Analytics must never break the page.
    }
  }
  try {
    sendGAEvent("event", event, properties);
  } catch {
    // GA may be blocked or not loaded yet.
  }
}

/** Which product a checkout tier belongs to. */
export function productForTier(tier: string | null | undefined): ProductId {
  if (tier === "suite") return "suite";
  // A Suite upgrade buys Lifetime of the other app.
  if (tier === "suite-upgrade") return APP_ID === "buckets" ? "tables" : "buckets";
  return APP_ID;
}
