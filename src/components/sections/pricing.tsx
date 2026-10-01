"use client";

import Section from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { trackReddit } from "@/lib/reddit";
import { CurrentPlanBanner, PlanActionButton } from "@/components/plan-action";
import { useCurrentPlan } from "@/lib/hooks/use-current-plan";
import { planActionFor, type PlanTier } from "@/lib/plan-options";

/** Plan cards link to /buy?tier=…; read the tier back for plan-aware CTAs. */
function tierFromHref(href: string): PlanTier | null {
  const tier = new URLSearchParams(href.split("?")[1] ?? "").get("tier");
  return tier === "monthly" || tier === "yearly" || tier === "lifetime" || tier === "team" ? tier : null;
}

export default function PricingSection() {
  const { plan: currentPlan } = useCurrentPlan();
  // High-intent signal: the user is looking at our plans. Fires once per
  // mount (home-page section or the dedicated /pricing route).
  useEffect(() => {
    trackReddit("ViewContent", {
      products: [{ id: "pricing", name: "Buckets pricing", category: "pricing" }],
    });
  }, []);

  return (
    <Section
      title="Pricing"
      subtitle="Simple pricing. Every feature included."
      description="Every plan unlocks the full app on up to 2 machines. Start with a 14-day free trial, no credit card required."
    >
      <CurrentPlanBanner plan={currentPlan} className="mx-auto mt-2 max-w-3xl" />
      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {siteConfig.pricing.map((plan, index) => {
          const tier = tierFromHref(plan.href);
          const action = tier ? planActionFor(currentPlan, tier) : ({ kind: "checkout" } as const);
          const isCurrent = action.kind === "current";
          const showPopular = plan.isPopular && currentPlan === "none";
          return (
          <motion.div
            key={plan.name}
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex h-full flex-col rounded-2xl p-7",
              isCurrent
                ? "border-2 border-primary bg-primary/[0.06]"
                : showPopular
                ? "border border-primary/50 bg-gradient-to-b from-primary/[0.12] to-transparent shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]"
                : "surface"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {plan.name}
              </p>
              {(isCurrent || showPopular) && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {isCurrent ? "Your plan" : "Best value"}
                </span>
              )}
            </div>
            <div className="mt-6 flex items-baseline gap-x-2">
              <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <p className="mt-3 min-h-[2.5rem] text-sm text-muted-foreground">{plan.description}</p>

            {action.kind === "checkout" ? (
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: showPopular ? "default" : "outline" }),
                  "mt-7 h-11 w-full rounded-full font-semibold",
                  !showPopular &&
                    "border-border bg-foreground/[0.03] hover:bg-foreground/[0.08]"
                )}
              >
                {tier === "team" && currentPlan !== "none" ? "Buy for your team" : plan.buttonText}
              </Link>
            ) : (
              <PlanActionButton action={action} className="mt-7" />
            )}

            <ul className="mt-7 flex-1 space-y-3 border-t border-border pt-6 text-left">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        14-day money-back guarantee on Monthly and Yearly, 7 days on Lifetime.{" "}
        <Link href="/refund-policy" className="font-medium text-foreground underline-offset-4 hover:underline">
          Refund policy
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Depending on your country&apos;s tax rules, VAT/GST may be added at checkout.
      </p>
    </Section>
  );
}
