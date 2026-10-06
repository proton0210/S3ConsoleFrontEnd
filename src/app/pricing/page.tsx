"use client";
import { useRouter } from "next/navigation";
import { createCheckout } from "@/lib/checkout-client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/nextjs";
import { sendGAEvent } from "@next/third-parties/google";
import { FaCheck, FaSpinner } from "react-icons/fa";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { CurrentPlanBanner, PlanActionButton } from "@/components/plan-action";
import { SuiteOffer } from "@/components/sections/pricing";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";
import { useCurrentPlan } from "@/lib/hooks/use-current-plan";
import { planActionFor } from "@/lib/plan-options";

type Tier = "monthly" | "yearly" | "lifetime" | "team";

interface TierConfig {
  id: Tier;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  /** Shown under the price, e.g. the 3-seat minimum math for Team. */
  priceNote?: string;
}

const TIERS: TierConfig[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$5",
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
    price: "$49",
    period: "per year",
    description: "Best value for daily users.",
    features: [
      "All features included",
      "Use on 2 machines",
      "Auto-renews yearly",
      "Save 18% vs monthly",
      "Priority email support",
    ],
    highlighted: true,
    badge: "Best value",
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
  {
    id: "team",
    name: "Team",
    price: `$${TEAM_SEAT_PRICE_USD}`,
    period: "per seat / year",
    priceNote: "3-seat minimum · up to 50 seats",
    description: "Company-owned seats on one invoice.",
    badge: "For Teams",
    features: [
      "Same price per seat as Yearly",
      "Seats belong to your company — reassign anytime",
      "Each member uses 2 machines",
      "One invoice for the whole team",
      "Add seats as you grow, prorated",
    ],
  },
];

// Team checkout needs a seat count, so it goes through the /buy seat
// selector instead of straight to create-checkout.
const TEAM_BUY_URL = "/buy?tier=team&seats=3";

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  // Existing customers see their plan marked and upgrades routed through
  // Billing instead of a second checkout.
  const { loading: planLoading, plan: currentPlan } = useCurrentPlan();
  // Opened from the desktop app ("See pricing" / Upgrade): the app passes the
  // email of the account it is signed in as. Carry it through to /buy, which
  // pre-fills checkout with it and blocks the purchase if this browser is
  // signed in as someone else — otherwise the license would never reach the
  // app. Read from window (not useSearchParams) so this static page needs no
  // Suspense boundary; it is only used on click, never in markup, so the
  // server/client render stays identical.
  const [appAccount] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const email = params.get("account_email")?.trim();
    return params.get("from") === "app" && email ? email : null;
  });
  const appIdentityQuery = appAccount
    ? `&account_email=${encodeURIComponent(appAccount)}&from=app`
    : "";

  const handleCheckout = async (tier: Tier) => {
    try {
      setLoadingTier(tier);

      sendGAEvent("event", "pricing_tier_clicked", {
        tier,
        location: "pricing_page",
        signedIn: !!isSignedIn,
      });

      // From the desktop app every tier goes through /buy so the account
      // check above runs before any money moves.
      if (appAccount) {
        const buyUrl = `/buy?tier=${encodeURIComponent(tier)}${tier === "team" ? "&seats=3" : ""}${appIdentityQuery}`;
        router.push(isSignedIn ? buyUrl : `/sign-up?redirect_url=${encodeURIComponent(buyUrl)}`);
        return;
      }

      // Team checkout picks a seat count on /buy before paying.
      if (tier === "team") {
        router.push(isSignedIn
          ? TEAM_BUY_URL
          : `/sign-up?redirect_url=${encodeURIComponent(TEAM_BUY_URL)}`);
        return;
      }

      // Anonymous users go through Clerk first so /buy has the email + name
      // it needs to satisfy Dodo's CustomerRequest schema. Clerk redirects
      // back to /buy?tier=... after sign-up, which auto-starts checkout.
      if (!isSignedIn) {
        const redirectUrl = `/buy?tier=${encodeURIComponent(tier)}`;
        router.push(`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      const email = user?.primaryEmailAddress?.emailAddress;
      const name =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        undefined;

      const data = await createCheckout(user!.id, {
        tier, ...(email ? { email } : {}), ...(name ? { name } : {}),
      });

      window.location.assign(data.checkout_url);
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
    <div className="theme-scope min-h-screen">
      <Header />
      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to Home
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          {/* Header */}
          <div className="mb-16 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Pricing
            </p>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              <span className="text-gradient">Simple pricing. Every feature included.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Solo or with your whole team, every plan unlocks the full Buckets
              app on up to 2 machines per seat.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Every plan starts with a 14-day free trial. No credit card required.
            </p>
          </div>

          <CurrentPlanBanner plan={currentPlan} className="mx-auto mb-10 max-w-3xl" />

          {/* Tier Cards */}
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => {
              const loading = loadingTier === tier.id;
              const disabled = loadingTier !== null && loadingTier !== tier.id;
              const action = planActionFor(currentPlan, tier.id);
              const isCurrent = action.kind === "current";

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl p-7 transition-colors duration-300 ${
                    isCurrent
                      ? "border-2 border-primary bg-primary/[0.06]"
                      : tier.highlighted && currentPlan === "none"
                      ? "border border-primary/50 bg-gradient-to-b from-primary/[0.12] to-transparent shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]"
                      : "surface hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {tier.name}
                    </h3>
                    {isCurrent ? (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        Your plan
                      </span>
                    ) : (
                      tier.badge && (currentPlan === "none" || tier.id === "team") && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            tier.highlighted
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-foreground"
                          }`}
                        >
                          {tier.badge}
                        </span>
                      )
                    )}
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="mt-2 min-h-[1rem] text-xs text-muted-foreground">{tier.priceNote}</p>
                  <p className="mt-2 min-h-[2.5rem] text-sm text-muted-foreground">{tier.description}</p>

                  {action.kind === "checkout" ? (
                    <Button
                      size="lg"
                      onClick={() => handleCheckout(tier.id)}
                      disabled={loading || disabled || planLoading}
                      variant={tier.highlighted ? "default" : "outline"}
                      className={`mt-7 h-11 w-full rounded-full font-semibold ${
                        tier.highlighted
                          ? ""
                          : "border-border bg-foreground/[0.03] hover:bg-foreground/[0.08]"
                      }`}
                    >
                      {loading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
                      {loading
                        ? "Processing..."
                        : tier.id === "team" && currentPlan !== "none"
                        ? "Buy for your team"
                        : `Choose ${tier.name}`}
                    </Button>
                  ) : (
                    <PlanActionButton action={action} className="mt-7" />
                  )}

                  <ul className="mt-7 flex-1 space-y-3 border-t border-border pt-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <FaCheck className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <SuiteOffer currentPlan={currentPlan} />

          {/* Footnotes */}
          <div className="mx-auto mt-14 max-w-2xl space-y-2 text-center text-sm text-muted-foreground">
            <p>Subscriptions auto-renew until canceled. You can cancel anytime from your account.</p>
            <p>
              Lifetime is a one-time payment with no recurring billing. All
              future updates included.
            </p>
            <p>
              Team is billed yearly per seat with a 3-seat minimum (up to 50
              seats self-serve). Invite members and add seats anytime from your
              account. Need more than 50 seats?{" "}
              <a
                href="mailto:buckets@serverlesscreed.com"
                className="underline hover:text-foreground"
              >
                Contact us
              </a>
              .
            </p>
            <p className="mt-4 text-xs">
              By purchasing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>
              ,{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              , and{" "}
              <a href="/refund-policy" className="underline hover:text-foreground">
                Refund Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
