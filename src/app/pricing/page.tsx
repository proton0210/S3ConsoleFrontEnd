"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/nextjs";
import { sendGAEvent } from "@next/third-parties/google";
import { FaCheck, FaSpinner, FaCrown } from "react-icons/fa";
import Header from "@/components/sections/header";

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
    description: "Flexible, cancel anytime.",
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
    price: "$79",
    period: "per year",
    description: "Best value for daily users.",
    features: [
      "All features included",
      "Use on 2 machines",
      "Auto-renews yearly",
      "Save 27% vs monthly",
      "Priority email support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$149",
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

  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  const handleCheckout = async (tier: Tier) => {
    try {
      setLoadingTier(tier);

      sendGAEvent("event", "pricing_tier_clicked", {
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
      alert(
        err instanceof Error
          ? err.message
          : "Failed to start checkout. Please try again."
      );
      setLoadingTier(null);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
            Pick a plan that fits
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Same powerful S3Console — three ways to pay. Every plan includes
            every feature on up to 2 machines.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            All plans start with a 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const loading = loadingTier === tier.id;
            const disabled = loadingTier !== null && loadingTier !== tier.id;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? "border-primary shadow-xl shadow-primary/20 bg-white scale-105"
                    : "border-slate-200 bg-white hover:shadow-lg hover:border-primary/30"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {tier.price}
                    </span>
                    <span className="text-slate-500 text-base ml-2">
                      {tier.period}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <FaCheck className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loading || disabled}
                  className={`w-full ${
                    tier.highlighted
                      ? "bg-primary hover:bg-primary/90 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {loading ? (
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FaCrown className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Processing..." : `Choose ${tier.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footnotes */}
        <div className="text-center text-sm text-slate-500 mt-12 max-w-2xl mx-auto space-y-2">
          <p>Subscriptions auto-renew until canceled. You can cancel anytime from your account.</p>
          <p>
            Lifetime is a one-time payment with no recurring billing. All
            future updates included.
          </p>
          <p className="text-xs mt-4">
            By purchasing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-slate-700">
              Terms of Service
            </a>
            ,{" "}
            <a href="/privacy" className="underline hover:text-slate-700">
              Privacy Policy
            </a>
            , and{" "}
            <a href="/refund-policy" className="underline hover:text-slate-700">
              Refund Policy
            </a>
            .
          </p>
        </div>
      </div>
      </main>
    </>
  );
}
