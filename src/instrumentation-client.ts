/**
 * PostHog for the ServerlessCreed websites (Buckets and Tables share one
 * PostHog project; NEXT_PUBLIC_APP_ID tells them apart). Next.js runs this
 * file before the page becomes interactive. Events go through /relay on our
 * own domain (see next.config.mjs), never straight to posthog.com.
 *
 * Privacy rules, also stated in privacy.md:
 * - Until the visitor answers the consent banner nothing is captured. After
 *   "Decline" we count cookielessly; after "Accept" cookies and masked session
 *   recordings are allowed.
 * - Payment, checkout and auth parameters are stripped from every URL.
 * - /admin is never tracked.
 */
import posthog from "posthog-js";
import { APP_ID, POSTHOG_ENABLED } from "@/lib/analytics";

const STRIP_PARAMS = [
  "payment_id",
  "subscription_id",
  "checkout_attempt_id",
  "account_email",
  "redirect_url",
  "token",
  "code",
  "email",
];

function stripUrl(value: unknown): unknown {
  if (typeof value !== "string" || !value.includes("?")) return value;
  try {
    const url = new URL(value);
    for (const param of STRIP_PARAMS) url.searchParams.delete(param);
    return url.toString();
  } catch {
    return value;
  }
}

function stripUrls(props: Record<string, unknown> | undefined): void {
  if (!props) return;
  for (const key of Object.keys(props)) {
    if (key.endsWith("_url") || key.endsWith("referrer")) props[key] = stripUrl(props[key]);
  }
}

if (POSTHOG_ENABLED && typeof window !== "undefined") {
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
      api_host: "/relay",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://eu.posthog.com",
      defaults: "2026-08-30",
      cookieless_mode: "on_reject",
      person_profiles: "identified_only",
      cross_subdomain_cookie: true,
      // Localhost and Amplify preview builds count as internal traffic.
      internal_or_test_user_hostname: /^(localhost|127\.0\.0\.1|.+\.amplifyapp\.com)$/,
      session_recording: { maskAllInputs: true },
      loaded: (ph) => {
        ph.register({ app: APP_ID });
      },
      before_send: (event) => {
        if (!event) return null;
        const path = event.properties?.$pathname;
        if (typeof path === "string" && path.startsWith("/admin")) return null;
        stripUrls(event.properties);
        stripUrls(event.$set);
        stripUrls(event.$set_once);
        return event;
      },
    });
  } catch {
    // Analytics must never break the page.
  }
}
