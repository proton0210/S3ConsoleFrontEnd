"use client";

import Section from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Layers } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { trackReddit } from "@/lib/reddit";
import { CurrentPlanBanner, PlanActionButton } from "@/components/plan-action";
import { useCurrentPlan } from "@/lib/hooks/use-current-plan";
import { ownsLifetime, planActionFor, suiteActionFor, type CurrentPlan, type PlanTier } from "@/lib/plan-options";
import { useSuiteState } from "@/lib/hooks/use-suite-state";
import { LIFETIME_PRICE_USD, SUITE_FEATURES, SUITE_PARTNER, SUITE_PATH, SUITE_PRICE_USD, SUITE_SAVINGS_USD, SUITE_SEPARATE_PRICE_USD, SUITE_UPGRADE_PRICE_USD, SUITE_UPGRADE_SAVINGS_USD } from "@/lib/suite-offer";

/** Plan cards link to /buy?tier=…; read the tier back for plan-aware CTAs. */
function tierFromHref(href: string): PlanTier | null {
  const tier = new URLSearchParams(href.split("?")[1] ?? "").get("tier");
  return tier === "monthly" || tier === "yearly" || tier === "lifetime" || tier === "team" ? tier : null;
}

/**
 * The Tables + Buckets Suite: both Lifetime licenses for one payment. Shown
 * under the plan cards. A Buckets Lifetime owner is offered the Suite upgrade
 * instead — Tables Lifetime at the owner price (the Suite would charge them
 * for Buckets again); subscribers get an upgrade CTA (their subscription is
 * cancelled on purchase by the webhook).
 */
/** Banner for someone who already owns both apps: nothing to sell. */
function SuiteOwnedBanner() {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      data-testid="suite-offer"
      className="surface relative mx-auto mt-6 flex max-w-7xl flex-col gap-5 overflow-hidden rounded-2xl p-7 md:flex-row md:items-center md:justify-between sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-56 w-72 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent)]" />
      <div className="relative max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />Suite
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            <Check className="h-3 w-3" strokeWidth={3} />Owned
          </span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          You own Buckets + Tables Lifetime
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The whole Suite is on your account — S3 and DynamoDB, every future update, nothing to renew.
        </p>
      </div>
      <div className="relative flex shrink-0 flex-col items-start gap-2 md:items-end">
        <a
          href={SUITE_PARTNER.downloadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-1.5 rounded-full px-6 font-semibold")}
        >
          Download Tables <ArrowUpRight className="h-4 w-4" />
        </a>
        <Link href={SUITE_PATH} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
          View your Suite
        </Link>
      </div>
    </motion.div>
  );
}

export function SuiteOffer({ currentPlan }: { currentPlan: CurrentPlan }) {
  // What they own of Tables decides the offer: both owned → nothing to sell;
  // Tables Lifetime only → add Buckets for $49 on the Tables site.
  const { state, pending, plan } = useSuiteState();
  if (state === "owned") return <SuiteOwnedBanner />;
  // `plan` lets a Buckets Lifetime owner who also owns a Team see the $49
  // upgrade (useCurrentPlan reports them as "team").
  return <SuiteOfferCard currentPlan={pending ? currentPlan : plan} there={state === "upgrade-there"} pending={pending} />;
}

function SuiteOfferCard({ currentPlan, there, pending }: { currentPlan: CurrentPlan; there: boolean; pending: boolean }) {
  const action: ReturnType<typeof suiteActionFor> = there
    ? { kind: "switch", label: `Add Buckets Lifetime — $${SUITE_UPGRADE_PRICE_USD}`, href: SUITE_PARTNER.upgradeUrl }
    : suiteActionFor(currentPlan);
  const owner = ownsLifetime(currentPlan) || there;
  const href = action.kind === "checkout" ? "/buy?tier=suite" : action.kind === "switch" ? action.href : null;
  const label = action.kind === "checkout" ? "Get the Suite" : action.label;
  const external = !!href && href.startsWith("http");
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      data-testid="suite-offer"
      aria-busy={pending}
      className={cn("surface relative mx-auto mt-6 flex max-w-7xl flex-col gap-6 overflow-hidden rounded-2xl p-7 transition-opacity duration-300 md:flex-row md:items-center md:justify-between sm:p-8", pending && "opacity-40")}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-56 w-72 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent)]" />
      <div className="relative max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />Suite
          </p>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            Save ${owner ? SUITE_UPGRADE_SAVINGS_USD : SUITE_SAVINGS_USD}
          </span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Buckets + Tables Lifetime, together
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {there
            ? `You already own Tables Lifetime, so you get the Suite deal on the other half: add Buckets Lifetime for $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}. Checkout runs on the Tables website, where your Lifetime is.`
            : owner
            ? `You already own Buckets Lifetime, so you get the Suite deal on the other half: add Tables Lifetime — the same idea for DynamoDB — for $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}.`
            : `Own S3 and DynamoDB for good. Both Lifetime licenses in one payment, instead of $${SUITE_SEPARATE_PRICE_USD} separately.`}
        </p>
        {!owner && (
          <ul className="mt-4 grid gap-2 text-left sm:grid-cols-2">
            {SUITE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative flex shrink-0 flex-col items-start gap-3 md:items-end">
        <p className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground line-through">${owner ? LIFETIME_PRICE_USD : SUITE_SEPARATE_PRICE_USD}</span>
          <span className="text-4xl font-semibold tracking-[-0.04em] text-foreground">${owner ? SUITE_UPGRADE_PRICE_USD : SUITE_PRICE_USD}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </p>
        {href ? (
          <Link
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(buttonVariants({ variant: "default" }), "h-11 gap-1.5 rounded-full px-6 font-semibold")}
          >
            {label} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-dashed border-border px-6 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" aria-hidden />{label}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {owner ? "Owner price. The key lands in your inbox; use it on 2 machines." : "Both keys land in your inbox. Use each on 2 machines."}
        </p>
      </div>
    </motion.div>
  );
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
      <SuiteOffer currentPlan={currentPlan} />
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
