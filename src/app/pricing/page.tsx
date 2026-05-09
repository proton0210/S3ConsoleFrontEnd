"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";

type Tier = "monthly" | "yearly" | "lifetime";

interface TierConfig {
  id: Tier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const TIERS: TierConfig[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9",
    period: "per month",
    description: "Flexible. Cancel any time.",
    features: [
      "All features included",
      "Use on 2 machines",
      "Auto-renews monthly",
      "Cancel anytime",
      "Priority email support",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$49",
    period: "per year",
    description: "Best value for daily users.",
    features: [
      "All features included",
      "Use on 2 machines",
      "Auto-renews yearly",
      "Save 54% vs monthly",
      "Priority email support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$99",
    period: "one-time",
    description: "Pay once, own forever.",
    features: [
      "All features included",
      "Use on 2 machines",
      "No recurring billing",
      "All future updates free",
      "Priority email support",
    ],
  },
];

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const handleCheckout = async (tier: Tier) => {
    try {
      setLoadingTier(tier);

      posthog?.capture("pricing_tier_clicked", {
        tier,
        location: "pricing_page",
        signedIn: !!isSignedIn,
      });

      // Anonymous users go through Clerk first so /buy has the email + name
      // it needs to satisfy Dodo's CustomerRequest schema. Clerk redirects
      // back to /buy?tier=... after sign-up, which auto-starts checkout.
      if (!isSignedIn) {
        const redirectUrl = `/buy?tier=${encodeURIComponent(tier)}`;
        window.location.href = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`;
        return;
      }

      const email = user?.primaryEmailAddress?.emailAddress;
      const name =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        undefined;

      const resp = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.checkout_url) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Pricing checkout error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to start checkout. Please try again."
      );
      setLoadingTier(null);
    }
  };

  return (
    <main className="relative min-h-screen bg-paper text-ink">
      {/* atmospheric paper grain + grid */}
      <div className="pointer-events-none fixed inset-0 grid-rule opacity-50" />
      <div className="pointer-events-none fixed inset-0 paper-grain opacity-60" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
        {/* breadcrumb / serial */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-char-600 mb-12">
          <Link href="/" className="group inline-flex items-center gap-2 hover:text-ink transition-colors">
            <span className="arrow-tick rotate-180">→</span>
            <span>back</span>
          </Link>
          <span>§ pricing — three tiers</span>
        </div>

        {/* header */}
        <div className="border-b border-ink pb-10">
          <p className="text-[11px] uppercase tracking-[0.24em] text-signal">
            ● shipping now
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-[0.95]">
            Pick a plan that <span className="italic text-char-800">fits.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[14px] leading-relaxed text-char-600">
            Same powerful S3Console — three ways to pay. Every plan
            includes every feature on up to two machines.
            All plans start with a 14-day free trial. No credit card
            required.
          </p>
        </div>

        {/* cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier, idx) => {
            const loading = loadingTier === tier.id;
            const disabled = loadingTier !== null && loadingTier !== tier.id;
            const isHi = !!tier.highlighted;

            return (
              <div
                key={tier.id}
                className={cn(
                  "group relative flex flex-col border bg-paper transition-all duration-200 lift-in",
                  "hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--ink))]",
                  isHi ? "border-ink" : "border-ink/60",
                  disabled && "opacity-50"
                )}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {isHi && (
                  <div className="absolute -top-px left-0 right-0 flex items-center justify-between border-b border-ink bg-ink px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-paper">
                    <span>● recommended</span>
                    <span className="text-signal">save 54%</span>
                  </div>
                )}

                <div className={cn("p-7 pt-8", isHi && "pt-12")}>
                  <div className="flex items-baseline justify-between border-b border-ink/15 pb-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-char-600">
                      tier // {tier.id}
                    </span>
                    <span className="text-[10px] tracking-wider text-char-400">
                      {String(idx + 1).padStart(2, "0")}/03
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-7xl font-light leading-none text-ink">
                      {tier.price}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-char-600">
                      {tier.period}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-char-600">
                    {tier.description}
                  </p>

                  <ul className="mt-7 space-y-2 text-[13px]">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-[3px] text-signal">›</span>
                        <span className="text-char-800">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loading || disabled}
                  className={cn(
                    "mt-auto flex items-center justify-between border-t px-6 py-4 text-[12px] uppercase tracking-[0.2em] transition-colors",
                    isHi
                      ? "border-ink bg-signal text-paper hover:bg-ink"
                      : "border-ink/40 text-ink hover:bg-ink hover:text-paper hover:border-ink",
                    (loading || disabled) && "cursor-not-allowed"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {loading && <FaSpinner className="h-3 w-3 animate-spin" />}
                    {loading ? "processing..." : `$ choose --${tier.id}`}
                  </span>
                  {!loading && <span className="arrow-tick">→</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* footnotes */}
        <div className="mt-16 grid grid-cols-1 gap-3 border-t border-ink/15 pt-8 text-[12px] leading-relaxed text-char-600 sm:grid-cols-2">
          <p>
            <span className="text-ink">› subscriptions</span> auto-renew until
            canceled. You can cancel anytime from your account.
          </p>
          <p>
            <span className="text-ink">› lifetime</span> is a one-time payment
            with no recurring billing. All future updates included.
          </p>
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-char-600">
          By purchasing, you agree to our{" "}
          <Link href="/terms" className="underline decoration-signal underline-offset-4 hover:text-ink">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="underline decoration-signal underline-offset-4 hover:text-ink">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/refund-policy" className="underline decoration-signal underline-offset-4 hover:text-ink">
            Refund Policy
          </Link>.
        </p>
      </div>
    </main>
  );
}
