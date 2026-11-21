"use client";

/**
 * Cookie choice for website analytics. PostHog runs with
 * cookieless_mode "on_reject": nothing is captured until the visitor answers;
 * "Decline" counts the visit without cookies, "Accept" allows cookies and
 * masked session recordings. The same answer is passed to GA4 Consent Mode.
 * The choice is stored per site, so Buckets and Tables each ask once.
 */
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { sendGAEvent } from "@next/third-parties/google";
import { Button } from "@/components/ui/button";
import { POSTHOG_ENABLED } from "@/lib/analytics";

type Status = "pending" | "granted" | "denied";

// PostHog keeps the answer in browser storage; there is nothing to subscribe
// to, and the server never shows the banner (no storage there).
const noSubscription = () => () => {};
function readConsent(): Status | null {
  if (!POSTHOG_ENABLED) return null;
  try {
    return posthog.get_explicit_consent_status();
  } catch {
    return null;
  }
}

export function ConsentBanner() {
  const pathname = usePathname();
  const stored = useSyncExternalStore(noSubscription, readConsent, () => null);
  const [answered, setAnswered] = useState<Status | null>(null);
  const status = answered ?? stored;

  if (!POSTHOG_ENABLED || status !== "pending" || pathname?.startsWith("/admin")) return null;

  const answer = (accept: boolean) => {
    try {
      if (accept) posthog.opt_in_capturing();
      else posthog.opt_out_capturing();
    } catch {
      // Keep going: the banner should still close.
    }
    try {
      const value = accept ? "granted" : "denied";
      sendGAEvent("consent", "update", {
        analytics_storage: value,
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
      });
    } catch {
      // GA may be blocked.
    }
    setAnswered(accept ? "granted" : "denied");
  };

  return (
    <div
      role="region"
      aria-label="Cookie choice"
      className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:left-4 sm:max-w-md"
    >
      <p className="text-sm text-muted-foreground">
        Can we use cookies to see how visitors use this site? If you decline, we only count your visit
        without cookies.{" "}
        <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => answer(false)}>
          Decline
        </Button>
        <Button size="sm" onClick={() => answer(true)}>
          Accept
        </Button>
      </div>
    </div>
  );
}
