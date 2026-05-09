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

type Tier = "monthly" | "yearly" | "lifetime";

function isValidTier(value: string | null): value is Tier {
  return value === "monthly" || value === "yearly" || value === "lifetime";
}

function BuyPageContent() {
  const sp = useSearchParams();
  const tier = sp.get("tier");
  const email = sp.get("email") || undefined;

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    if (!isValidTier(tier)) {
      setError("Invalid plan. Please go back to the pricing page and pick again.");
      setStatus("error");
      return;
    }

    let canceled = false;
    (async () => {
      try {
        const resp = await fetch("/api/dodo/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier,
            ...(email ? { email } : {}),
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
  }, [tier, email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        {status === "loading" && (
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
