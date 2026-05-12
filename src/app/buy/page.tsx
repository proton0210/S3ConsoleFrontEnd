/**
 * Magic-link checkout — `/buy?tier=monthly&email=user@example.com`
 *
 * Reached from lifecycle emails (Phase 10c). Reads tier + email from query
 * string, kicks the user straight to Dodo checkout via /api/dodo/create-checkout.
 *
 * Zero friction by design: email pre-filled, tier pre-selected, click → pay.
 */
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { compositeLegalVersion } from "@/lib/legalVersions";

type Tier = "monthly" | "yearly" | "lifetime";

function isValidTier(value: string | null): value is Tier {
  return value === "monthly" || value === "yearly" || value === "lifetime";
}

function BuyPageContent() {
  const sp = useSearchParams();
  const tier = sp.get("tier");
  const queryEmail = sp.get("email") || undefined;
  // `atv` is set by the desktop app when the user has already accepted ToS in
  // the in-app PricingDialog. When absent (e.g. lifecycle-email magic link),
  // the user must consent below before we redirect to Dodo.
  const queryAtv = sp.get("atv") || undefined;
  const { user, isLoaded } = useUser();
  const [termsAccepted, setTermsAccepted] = useState<boolean>(Boolean(queryAtv));

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

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    // Wait for Clerk to load so we don't accidentally start checkout
    // without the email from a still-pending auth context.
    if (!isLoaded) return;

    if (!isValidTier(tier)) {
      setError("Invalid plan. Please go back to the pricing page and pick again.");
      setStatus("error");
      return;
    }

    // Hold the redirect until the user has accepted ToS. The desktop app
    // pre-stamps `atv` to skip this gate — magic-link visitors see the
    // checkbox below before we kick them to Dodo.
    if (!termsAccepted) {
      setStatus("loading");
      return;
    }

    // Subscription tiers require email (Dodo's CustomerRequest schema). If
    // we have no queryEmail and no signed-in user, bounce through sign-up
    // rather than letting the route 400. Lifetime is exempt — /checkouts
    // accepts payments without a customer object.
    const needsAuth = (tier === "monthly" || tier === "yearly") && !email;
    if (needsAuth) {
      const here = `/buy?tier=${encodeURIComponent(tier!)}`;
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(here)}`;
      return;
    }

    let canceled = false;
    (async () => {
      try {
        // The webhook persists `acceptedTermsVersion` from this metadata onto
        // the license row — it's how activation's post-policy gate passes.
        const acceptedTermsVersion = queryAtv || compositeLegalVersion();
        const acceptedTermsAt = String(Date.now());
        const resp = await fetch("/api/dodo/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier,
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
            metadata: { acceptedTermsVersion, acceptedTermsAt },
          }),
        });
        const data = await resp.json();
        if (canceled) return;
        if (!resp.ok || !data?.checkout_url) {
          throw new Error(data?.error || "Could not start checkout. Please try again.");
        }
        setStatus("redirecting");
        window.location.href = data.checkout_url;
      } catch (err: any) {
        if (canceled) return;
        setError(err?.message || "Unexpected error");
        setStatus("error");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [tier, email, name, isLoaded, termsAccepted, queryAtv]);

  // Magic-link visitors land here without `atv` — show a one-tap consent
  // gate so we capture acceptance *before* sending them to Dodo.
  const needsConsent = !termsAccepted && isValidTier(tier);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        {needsConsent && status !== "error" ? (
          <div className="text-left bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Confirm and continue to checkout
            </h1>
            <p className="text-sm text-slate-600 mb-4">
              Before we send you to our payment partner, please review and
              accept our terms.
            </p>
            <label
              htmlFor="buy-terms"
              className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer select-none"
            >
              <input
                id="buy-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  Terms of Service
                </a>
                ,{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  Privacy Policy
                </a>
                , and{" "}
                <a
                  href="/eula"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
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
            <div className="mb-4 inline-block h-8 w-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
            <p className="text-slate-700">Setting up your checkout…</p>
          </>
        )}
        {status === "redirecting" && (
          <>
            <p className="text-slate-700">Redirecting to checkout…</p>
            <p className="text-xs text-slate-500 mt-2">
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
            <p className="text-red-700 font-medium mb-2">{error}</p>
            <p className="text-sm text-slate-600">
              <a className="underline" href="/pricing">
                ← Back to pricing
              </a>
            </p>
          </>
        )}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a href="/" className="hover:text-primary underline">
            Home
          </a>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
        </div>
      }
    >
      <BuyPageContent />
    </Suspense>
  );
}
