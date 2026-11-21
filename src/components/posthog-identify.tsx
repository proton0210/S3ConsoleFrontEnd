"use client";

/**
 * Links a signed-in visitor's PostHog person to their Clerk user id, so the
 * Dodo webhook (which knows the same id as `accountSubject`) can attribute
 * purchases. Sends no email or name. Person properties are prefixed with the
 * app because Buckets and Tables share one PostHog project.
 */
import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { APP_ID, POSTHOG_ENABLED, track } from "@/lib/analytics";

/** Accounts on these domains are our own and are filtered out of reports. */
const INTERNAL_EMAIL_DOMAINS = ["serverlesscreed.com"];
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

export function PostHogIdentify() {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedAs = useRef<string | null>(null);

  useEffect(() => {
    if (!POSTHOG_ENABLED || !isLoaded) return;
    try {
      if (isSignedIn && user) {
        if (identifiedAs.current === user.id) return;
        identifiedAs.current = user.id;

        const createdAt = user.createdAt ? new Date(user.createdAt) : null;
        posthog.identify(
          user.id,
          { [`${APP_ID}_user`]: true },
          createdAt ? { [`${APP_ID}_signed_up_at`]: createdAt.toISOString() } : undefined,
        );

        const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
        if (INTERNAL_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`))) {
          posthog.setInternalOrTestUser();
        }

        // Clerk has no client "signed up" event; a brand-new account is close
        // enough. sessionStorage stops a refresh from counting it twice.
        const flag = `${APP_ID}-ph-signup:${user.id}`;
        if (createdAt && Date.now() - createdAt.getTime() < NEW_ACCOUNT_WINDOW_MS) {
          let seen = false;
          try {
            seen = sessionStorage.getItem(flag) === "1";
            sessionStorage.setItem(flag, "1");
          } catch {
            // Storage may be disabled; at worst sign_up is counted twice.
          }
          if (!seen) {
            track("sign_up", { method: user.externalAccounts?.[0]?.provider || "email" });
          }
        }
      } else if (identifiedAs.current) {
        identifiedAs.current = null;
        posthog.reset();
      }
    } catch {
      // Analytics must never break the page.
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
