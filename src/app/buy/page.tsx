/**
 * Magic-link checkout — `/buy?tier=monthly&email=user@example.com`
 *
 * Reached from lifecycle emails (Phase 10c). Reads tier + email from query
 * string, kicks the user straight to Dodo checkout via /api/dodo/create-checkout.
 *
 * Zero friction by design: email pre-filled, tier pre-selected, click → pay.
 */
"use client";
import { createCheckout, CheckoutError } from "@/lib/checkout-client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { compositeLegalVersion } from "@/lib/legalVersions";
import { sendGAEvent } from "@next/third-parties/google";
import { trackReddit, tierValue } from "@/lib/reddit";
import { useCurrentPlan } from "@/lib/hooks/use-current-plan";
import {
  BILLING_URL,
  TEAM_URL,
  checkoutAllowed,
  checkoutBlockedMessage,
} from "@/lib/plan-options";

type Tier = "monthly" | "yearly" | "lifetime" | "team";

const MIN_TEAM_SEATS = 3;
const MAX_TEAM_SEATS = 50;

function isValidTier(value: string | null): value is Tier {
  return (
    value === "monthly" ||
    value === "yearly" ||
    value === "lifetime" ||
    value === "team"
  );
}

function BuyPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const tier = sp.get("tier");
  const queryEmail = sp.get("email") || undefined;
  // `atv` is set by the desktop app when the user has already accepted ToS in
  // the in-app PricingDialog. When absent (e.g. lifecycle-email magic link),
  // the user must consent below before we redirect to Dodo.
  const queryAtv = sp.get("atv") || undefined;
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  // Team checkouts always pause at the consent box so the buyer sees the seat
  // selector — a pre-stamped ?atv= must not race them past it with the
  // default seat count.
  const [termsAccepted, setTermsAccepted] = useState<boolean>(
    Boolean(queryAtv) && sp.get("tier") !== "team"
  );
  // Team checkout: seat count from ?seats= (pricing card deep-link), clamped;
  // adjustable in the consent box before we redirect to Dodo.
  const [seats, setSeats] = useState<number>(() => {
    const fromQuery = Number(sp.get("seats"));
    if (Number.isInteger(fromQuery)) {
      return Math.min(MAX_TEAM_SEATS, Math.max(MIN_TEAM_SEATS, fromQuery));
    }
    return MIN_TEAM_SEATS;
  });

  // Email priority: ?email=... query param (from magic-link emails) wins.
  // Fallback to Clerk's authenticated email so signed-in homepage clicks
  // pre-fill the Dodo checkout form. If neither is available, Dodo will
  // ask for it on the checkout page.
  const email =
    queryEmail || user?.primaryEmailAddress?.emailAddress || undefined;
  // Dodo's /subscriptions endpoint requires both email AND name on the
  // customer object; passing email alone fails. Pull name from Clerk when
  // available — otherwise the API drops the customer object and Dodo
  // collects both on its hosted checkout.
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    undefined;

  // Existing customers never get a second checkout from a stale link: they
  // see what they own and where to change it instead.
  const { loading: planLoading, plan: currentPlan } = useCurrentPlan();
  const blocked =
    !planLoading && isValidTier(tier) && !checkoutAllowed(currentPlan, tier);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    // Wait for Clerk to load so we don't accidentally start checkout
    // without the email from a still-pending auth context.
    if (!isLoaded) return;

    if (!isValidTier(tier)) return;

    // Wait until we know what the signed-in user already owns.
    if (planLoading || blocked) return;

    // Hold the redirect until the user has accepted ToS. The desktop app
    // pre-stamps `atv` to skip this gate — magic-link visitors see the
    // checkbox below before we kick them to Dodo.
    if (!termsAccepted) return;

    // Every checkout must be attached to a Clerk account, including Lifetime
    // and emailed purchase links. A receipt email is not authentication.
    const needsAuth = !userId;
    if (needsAuth) {
      // Carry the chosen seat count through the sign-up bounce — without it
      // the user lands back here with the default and has to re-pick.
      const here = `/buy?tier=${encodeURIComponent(tier!)}${
        tier === "team" ? `&seats=${seats}` : ""
      }`;
      router.replace(`/sign-up?redirect_url=${encodeURIComponent(here)}`);
      return;
    }

    let canceled = false;
    (async () => {
      try {
        // The webhook persists `acceptedTermsVersion` from this metadata onto
        // the license row — it's how activation's post-policy gate passes.
        const acceptedTermsVersion = queryAtv || compositeLegalVersion();
        const acceptedTermsAt = String(Date.now());
        const data = await createCheckout(userId!, {
          tier,
          ...(tier === "team" ? { seats } : {}),
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
          metadata: { acceptedTermsVersion, acceptedTermsAt },
        });
        if (canceled) return;
        sendGAEvent({ event: "checkout_started", tier: tier });
        // Reddit mid-funnel signal — lets the campaign optimize toward
        // cart-adders, with the tier's price as the cart value.
        trackReddit("AddToCart", {
          currency: "USD",
          value:
            tier === "team"
              ? (tierValue(tier) ?? 0) * seats
              : tierValue(tier),
          itemCount: tier === "team" ? seats : 1,
          products: [{ id: tier!, name: `Buckets by ServerlessCreed ${tier} plan` }],
        });
        setStatus("redirecting");
        window.location.href = data.checkout_url;
      } catch (err: unknown) {
        if (canceled) return;
        if (err instanceof CheckoutError && err.manageUrl) setManageUrl(err.manageUrl);
        setError(err instanceof Error ? err.message : "Unexpected error");
        setStatus("error");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [tier, seats, email, name, isLoaded, termsAccepted, queryAtv, planLoading, blocked, userId, router]);

  if (!isValidTier(tier)) {
    return <div className="theme-scope min-h-screen flex flex-col items-center justify-center gap-4">
      <p>Invalid plan. Please pick a plan from the pricing page.</p>
      <Link href="/pricing" className="text-primary underline">Back to pricing</Link>
    </div>;
  }

  // Magic-link visitors land here without `atv` — show a one-tap consent
  // gate so we capture acceptance *before* sending them to Dodo.
  const needsConsent = !termsAccepted && isValidTier(tier) && !blocked;

  if (blocked && isValidTier(tier)) {
    const href = currentPlan === "team" ? TEAM_URL : BILLING_URL;
    return (
      <div className="theme-scope min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border surface p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">You already have Buckets Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">{checkoutBlockedMessage(currentPlan, tier)}</p>
          <a
            href={href}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {currentPlan === "team" ? "Go to your team" : "Go to Billing"}
          </a>
          <p className="mt-4 text-xs text-muted-foreground">
            <a href="/downloads" className="underline hover:text-primary">
              Download Buckets
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-scope min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {needsConsent && status !== "error" ? (
          <div className="text-left surface border border-border rounded-lg p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Confirm and continue to checkout
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              Before we send you to our payment partner, please review and
              accept our terms.
            </p>
            {tier === "team" && (
              <div className="mb-4 rounded-lg border border-border bg-background p-4">
                <label
                  htmlFor="buy-seats"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Team seats (minimum {MIN_TEAM_SEATS})
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Remove a seat"
                    onClick={() => setSeats((s) => Math.max(MIN_TEAM_SEATS, s - 1))}
                    className="h-8 w-8 rounded border border-border text-foreground hover:bg-foreground/5"
                  >
                    −
                  </button>
                  <input
                    id="buy-seats"
                    type="number"
                    min={MIN_TEAM_SEATS}
                    max={MAX_TEAM_SEATS}
                    value={seats}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isInteger(v)) {
                        setSeats(Math.min(MAX_TEAM_SEATS, Math.max(MIN_TEAM_SEATS, v)));
                      }
                    }}
                    className="w-16 bg-background rounded border border-border px-2 py-1 text-center text-foreground"
                  />
                  <button
                    type="button"
                    aria-label="Add a seat"
                    onClick={() => setSeats((s) => Math.min(MAX_TEAM_SEATS, s + 1))}
                    className="h-8 w-8 rounded border border-border text-foreground hover:bg-foreground/5"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted-foreground ml-1">
                    ${(tierValue("team") ?? 0) * seats}/year total
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  You can add seats later from your account; invite teammates
                  by email after purchase.
                </p>
              </div>
            )}
            <label
              htmlFor="buy-terms"
              className="flex items-start gap-2 text-sm text-foreground cursor-pointer select-none"
            >
              <input
                id="buy-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 flex-shrink-0 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                >
                  Terms of Service
                </a>
                ,{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                >
                  Privacy Policy
                </a>
                , and{" "}
                <a
                  href="/eula"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                >
                  EULA
                </a>
                .
              </span>
            </label>
          </div>
        ) : null}
        {!needsConsent && status === "loading" && (
          <>
            <div className="mb-4 inline-block h-8 w-8 rounded-full border-4 border-border border-t-primary animate-spin" />
            <p className="text-foreground">Setting up your checkout…</p>
          </>
        )}
        {status === "redirecting" && (
          <>
            <p className="text-foreground">Redirecting to checkout…</p>
            <p className="text-xs text-muted-foreground mt-2">
              If nothing happens, refresh this page or go to{" "}
              <a className="underline" href="/pricing">
                /pricing
              </a>
              .
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-destructive font-medium mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              {manageUrl ? (
                <a className="underline" href={manageUrl}>
                  Manage your plan →
                </a>
              ) : (
                <a className="underline" href="/pricing">
                  ← Back to pricing
                </a>
              )}
            </p>
          </>
        )}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary underline">
            Home
          </Link>
          <a href="/pricing" className="hover:text-primary underline">
            Pricing
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper required because useSearchParams() is a client hook that
 * suspends during static rendering. Without this Next.js complains.
 */
export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <div className="theme-scope min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-border border-t-primary animate-spin" />
        </div>
      }
    >
      <BuyPageContent />
    </Suspense>
  );
}
