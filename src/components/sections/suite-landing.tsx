"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  LIFETIME_PRICE_USD,
  SUITE_UPGRADE_PATH,
  SUITE_UPGRADE_PRICE_USD,
  SUITE_FAQS,
  SUITE_FEATURES,
  SUITE_NAME,
  SUITE_PARTNER,
  SUITE_PRICE_USD,
  SUITE_PRODUCTS,
  SUITE_SAVINGS_USD,
  SUITE_SEPARATE_PRICE_USD,
  SUITE_STEPS,
} from "@/lib/suite-offer";
import { useSuiteState } from "@/lib/hooks/use-suite-state";
import type { CurrentPlan, SuiteState } from "@/lib/plan-options";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Download, Infinity as InfinityIcon, Layers, Plus } from "lucide-react";
import Link from "next/link";
import { sendGAEvent } from "@next/third-parties/google";

const BUY_HREF = "/buy?tier=suite";
const UPGRADE_SAVINGS_USD = LIFETIME_PRICE_USD - SUITE_UPGRADE_PRICE_USD;
const THIS_APP = "Buckets";

/**
 * The primary call to action for each version of the page. The $49 upgrade
 * is sold on the site that owns the Lifetime: here for a Buckets owner, on the
 * Tables website for a Tables owner. A team-covered Buckets seat has no
 * personal Lifetime to upgrade from, so Tables is offered on its own.
 */
function primaryCta(state: SuiteState): { label: string; href: string; external: boolean } | null {
  switch (state) {
    case "upgrade-here":
      return { label: `Add ${SUITE_PARTNER.name} Lifetime — $${SUITE_UPGRADE_PRICE_USD}`, href: SUITE_UPGRADE_PATH, external: false };
    case "upgrade-there":
      return { label: `Add ${THIS_APP} Lifetime — $${SUITE_UPGRADE_PRICE_USD}`, href: SUITE_PARTNER.upgradeUrl, external: true };
    case "team":
      return { label: `Get ${SUITE_PARTNER.name} Lifetime — $${LIFETIME_PRICE_USD}`, href: SUITE_PARTNER.pricingUrl, external: true };
    case "subscriber":
      return { label: "Upgrade to the Suite", href: BUY_HREF, external: false };
    case "owned":
      return null;
    default:
      return { label: "Get the Suite", href: BUY_HREF, external: false };
  }
}

function subscriptionName(plan: CurrentPlan): string {
  return plan === "yearly" ? "Yearly" : "Monthly";
}
const reveal = {
  initial: { y: 24, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {children}
    </p>
  );
}

const PRIMARY_BUTTON =
  "group h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]";
const OUTLINE_BUTTON =
  "h-12 rounded-full border-border bg-foreground/[0.03] px-7 text-base font-medium hover:bg-foreground/[0.08]";

function BuyButton({ state, where, className }: { state: SuiteState; where: string; className?: string }) {
  const cta = primaryCta(state);
  if (!cta) return null;
  return (
    <Link
      href={cta.href}
      {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(buttonVariants({ size: "lg" }), PRIMARY_BUTTON, className)}
      onClick={() => sendGAEvent({ event: "suite_cta_click", label: `${where}:${state}` })}
    >
      {cta.label}
      {cta.external ? (
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : (
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      )}
    </Link>
  );
}

/** Download/manage links for someone who owns both apps. */
const OWNED_APPS = [
  { name: THIS_APP, manageHref: "/account/billing", downloadHref: "/downloads", external: false },
  { name: SUITE_PARTNER.name, manageHref: SUITE_PARTNER.billingUrl, downloadHref: SUITE_PARTNER.downloadsUrl, external: true },
] as const;

function DownloadButtons({ where, className }: { where: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-stretch gap-3 sm:flex-row sm:items-center", className)}>
      {OWNED_APPS.map((app, index) => (
        <Link
          key={app.name}
          href={app.downloadHref}
          {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn(buttonVariants({ size: "lg", variant: index === 0 ? "default" : "outline" }), index === 0 ? PRIMARY_BUTTON : OUTLINE_BUTTON, "gap-2")}
          onClick={() => sendGAEvent({ event: "suite_cta_click", label: `${where}:download-${app.name.toLowerCase()}` })}
        >
          <Download className="h-4 w-4" />
          Download {app.name}
        </Link>
      ))}
    </div>
  );
}

const CARD = "relative overflow-hidden rounded-3xl border border-primary/50 bg-gradient-to-b from-primary/[0.12] to-transparent p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)] transition-opacity duration-300 sm:p-9";

/** $149 Suite card (signed out, no plan, subscribers). */
function SuiteCard({ state }: { state: SuiteState }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suite · one-time</p>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
          Save ${SUITE_SAVINGS_USD}
        </span>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-6xl font-semibold tracking-[-0.04em] text-foreground">${SUITE_PRICE_USD}</span>
        <span className="text-lg text-muted-foreground line-through">${SUITE_SEPARATE_PRICE_USD}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        vs ${LIFETIME_PRICE_USD} + ${LIFETIME_PRICE_USD} bought separately
      </p>
      <ul className="mt-7 space-y-3 border-t border-border pt-6 text-sm">
        {[`${THIS_APP} Lifetime license`, `${SUITE_PARTNER.name} Lifetime license`, "2 machines per app", "All future updates"].map((line) => (
          <li key={line} className="flex items-center gap-3">
            <InfinityIcon className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>
      <BuyButton state={state} where="price-card" className="mt-8 w-full" />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Prices in USD. VAT/GST may be added at checkout.
      </p>
    </>
  );
}

/**
 * One app is already theirs: $49 to add the other (upgrade states), or — for
 * a team-covered Buckets seat — Tables Lifetime on its own.
 */
function UpgradeCard({ state }: { state: SuiteState }) {
  const team = state === "team";
  const owned = state === "upgrade-there" ? SUITE_PARTNER.name : THIS_APP;
  const adding = state === "upgrade-there" ? THIS_APP : SUITE_PARTNER.name;
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {team ? `${adding} · one-time` : "Owner price · one-time"}
        </p>
        {!team && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            Save ${UPGRADE_SAVINGS_USD}
          </span>
        )}
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-6xl font-semibold tracking-[-0.04em] text-foreground">${team ? LIFETIME_PRICE_USD : SUITE_UPGRADE_PRICE_USD}</span>
        {!team && <span className="text-lg text-muted-foreground line-through">${LIFETIME_PRICE_USD}</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {team ? `Your ${THIS_APP} seat is covered by your Team plan` : `${adding} Lifetime, because you already own ${owned}`}
      </p>
      <ul className="mt-7 space-y-3 border-t border-border pt-6 text-sm">
        <li className="flex items-center gap-3">
          <Check className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2.5} />
          <span className="text-muted-foreground">{team ? `${THIS_APP} — via your Team` : `${owned} Lifetime license`}</span>
          <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {team ? "Covered" : "Yours"}
          </span>
        </li>
        <li className="flex items-center gap-3">
          <Plus className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2.5} />
          <span className="font-medium text-foreground">{adding} Lifetime license</span>
        </li>
        {["2 machines per app", "All future updates"].map((line) => (
          <li key={line} className="flex items-center gap-3">
            <InfinityIcon className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>
      <BuyButton state={state} where="price-card" className="mt-8 w-full" />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {state === "upgrade-here"
          ? "Prices in USD. VAT/GST may be added at checkout."
          : `Checkout runs on ${SUITE_PARTNER.origin.replace("https://", "")}${team ? "" : ", where your Lifetime is"}.`}
      </p>
    </>
  );
}

/** Both apps are theirs: an ownership card instead of a price. */
function OwnedCard({ email }: { email?: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suite · owned</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} />
          Complete
        </span>
      </div>
      <p className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
        Both apps <span className="text-gradient">are yours.</span>
      </p>
      <p className="mt-3 text-sm text-muted-foreground">Lifetime licenses, every future update, nothing to renew.</p>
      <ul className="mt-7 divide-y divide-border rounded-2xl border border-border bg-background/60">
        {OWNED_APPS.map((app) => (
          <li key={app.name} className="flex items-center gap-3 px-4 py-3.5 text-sm">
            <InfinityIcon className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="font-medium text-foreground">{app.name} Lifetime</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />Active
            </span>
            <span className="ml-auto flex items-center gap-3 text-xs">
              <Link
                href={app.downloadHref}
                {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
              >
                Download
              </Link>
              <Link
                href={app.manageHref}
                {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-primary"
              >
                Manage
              </Link>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        {email ? <>Signed in as <span className="text-foreground/80">{email}</span>. </> : null}
        Use the same email on both sites to see each key.
      </p>
    </>
  );
}

/** The /suite landing page body: hero + price, the two apps, how it works, FAQ, CTA. */
export function SuiteLanding() {
  const { pending, plan, state } = useSuiteState();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const upgrading = state === "upgrade-here" || state === "upgrade-there";
  const ownedHere = state === "owned" || state === "upgrade-here";
  const ownedThere = state === "owned" || state === "upgrade-there";
  const subscribedHere = plan === "monthly" || plan === "yearly";
  const heroFeatures =
    state === "owned"
      ? [`${THIS_APP} Lifetime — active on your account`, `${SUITE_PARTNER.name} Lifetime — active on your account`, "Each license works on 2 machines", "Every future update, nothing to renew"]
      : upgrading
        ? [
            `${ownedHere ? THIS_APP : SUITE_PARTNER.name} Lifetime — already yours`,
            ...SUITE_FEATURES.filter((feature) => feature.startsWith(ownedHere ? SUITE_PARTNER.name : THIS_APP)),
            "Same email, two keys, 2 machines each",
            "Pay once. No renewals, ever",
          ]
        : state === "team"
          ? [
              `${THIS_APP} — covered by your Team plan`,
              ...SUITE_FEATURES.filter((feature) => feature.startsWith(SUITE_PARTNER.name)),
              `${SUITE_PARTNER.name} on 2 machines`,
              "Pay once. No renewals, ever",
            ]
          : [...SUITE_FEATURES];
  return (
    <>
      <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className={cn("transition-opacity duration-300 lg:col-span-7", pending && "opacity-50")} aria-busy={pending}>
            <Eyebrow>
              <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />{" "}
              {state === "owned" ? `${SUITE_NAME} · Owned` : upgrading ? "Complete the pair" : SUITE_NAME}
            </Eyebrow>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              <span className="text-gradient">
                {state === "owned"
                  ? "S3 and DynamoDB. Yours for good."
                  : upgrading
                    ? `You own ${ownedHere ? THIS_APP : SUITE_PARTNER.name}. Add ${ownedHere ? SUITE_PARTNER.name : THIS_APP} for $${SUITE_UPGRADE_PRICE_USD}.`
                    : "Own S3 and DynamoDB for good."}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-lg leading-8 text-muted-foreground">
              {state === "owned"
                ? `You own the whole ${SUITE_NAME}: Buckets Lifetime and Tables Lifetime. Every feature of both apps, every future update, on 2 machines each — nothing to renew, ever.`
                : state === "upgrade-here"
                  ? `As a Buckets Lifetime owner you get the Suite deal on the other half: Tables Lifetime — DynamoDB, every feature, every future update — for $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}.`
                  : state === "upgrade-there"
                    ? `As a Tables Lifetime owner you get the Suite deal on the other half: Buckets Lifetime — S3, every feature, every future update — for $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}. Checkout runs on the Tables website, where your Lifetime is.`
                    : state === "team"
                      ? "Your Buckets seat is already covered by your Team plan, so the Suite would charge you for Buckets again. Add Tables Lifetime on its own instead — DynamoDB, every feature, every future update."
                      : "Buckets Lifetime and Tables Lifetime in one payment. Every feature of both apps, every future update, on 2 machines each — and nothing to renew, ever."}
            </p>
            {subscribedHere && state !== "owned" && state !== "upgrade-here" && (
              <p className="mt-4 max-w-xl rounded-2xl border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
                You&apos;re on Buckets {subscriptionName(plan)}. It is cancelled for you the moment your Buckets Lifetime
                license is issued, so you never pay for both.
              </p>
            )}
            <ul className="mt-7 grid max-w-xl gap-2.5 sm:grid-cols-2">
              {heroFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
            {state === "owned" ? (
              <DownloadButtons where="hero" className="mt-9" />
            ) : (
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <BuyButton state={state} where="hero" className="w-full sm:w-auto" />
                <Link
                  href="/pricing"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), OUTLINE_BUTTON, "w-full sm:w-auto")}
                >
                  Compare with single plans
                </Link>
              </div>
            )}
            {(state === "public" || state === "subscriber") && (
              <p className="mt-4 text-xs text-muted-foreground">
                Already own one of them?{" "}
                <Link href="#faq" className="underline underline-offset-4 hover:text-foreground">
                  Add the other for ${SUITE_UPGRADE_PRICE_USD}.
                </Link>
              </p>
            )}
          </div>

          <motion.div {...reveal} className="lg:col-span-5">
            {/* While we learn who is looking, dim the card so a Lifetime owner
                never sees $149 flash before their $49 (or "owned") card. */}
            <div className={cn(CARD, pending && "opacity-40")} aria-busy={pending}>
              {state === "owned" ? (
                <OwnedCard email={email} />
              ) : upgrading || state === "team" ? (
                <UpgradeCard state={state} />
              ) : (
                <SuiteCard state={state} />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* The two apps */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8" id="apps">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Two apps</Eyebrow>
          <h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            <span className="text-gradient">The two halves of your AWS data workflow.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Built by the same one-person studio, with the same care. Buckets for your objects, Tables for your
            records.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SUITE_PRODUCTS.map((product, index) => (
            <motion.div
              key={product.name}
              {...reveal}
              transition={{ ...reveal.transition, delay: 0.08 * index }}
              className="surface flex flex-col rounded-2xl p-7 sm:p-9"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.name} <span className="text-primary">Lifetime</span>
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">{product.tagline}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.blurb}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm">
                {(product.name === THIS_APP ? ownedHere : ownedThere) ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Yours — Lifetime
                  </span>
                ) : upgrading ? (
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">${SUITE_UPGRADE_PRICE_USD} for you</span> · ${LIFETIME_PRICE_USD} on its own
                  </span>
                ) : (
                  <span className="text-muted-foreground">${LIFETIME_PRICE_USD} on its own</span>
                )}
                <Link
                  href={product.href}
                  {...(product.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
                >
                  Explore {product.name}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8" id="how-it-works">
        <div className="surface relative overflow-hidden rounded-3xl p-7 sm:p-12">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                <span className="text-gradient">One payment. Two licenses.</span>
              </h2>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
              {SUITE_STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Eyebrow>Suite FAQ</Eyebrow>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              <span className="text-gradient">Before you buy.</span>
            </h2>
            {state === "owned" ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Keys, devices and receipts for each app live on its own billing page:{" "}
                <Link href="/account/billing" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Buckets</Link>
                {" · "}
                <a href={SUITE_PARTNER.billingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
                  Tables
                </a>.
              </p>
            ) : upgrading ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The ${SUITE_UPGRADE_PRICE_USD} owner price is for adding the second app to a Lifetime you already own, with the
                same email on both sites.
              </p>
            ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Already own Buckets Lifetime?{" "}
              <Link href={SUITE_UPGRADE_PATH} className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
                Add Tables Lifetime for ${SUITE_UPGRADE_PRICE_USD}
              </Link>{" "}
              instead of ${LIFETIME_PRICE_USD}. Own Tables Lifetime? Add Buckets the same way at{" "}
              <a href={`${SUITE_PARTNER.origin}/suite`} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
                tables.serverlesscreed.com
              </a>.
            </p>
            )}
          </div>
          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full divide-y divide-border border-y border-border">
              {SUITE_FAQS.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question} className="border-0">
                  <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-7 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="surface relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="bg-glow pointer-events-none absolute inset-0" />
          <h2 className="relative mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            <span className="text-gradient">
              {state === "owned"
                ? "Both apps. Thank you."
                : upgrading
                  ? `The other half. $${SUITE_UPGRADE_PRICE_USD}. Never again.`
                  : state === "team"
                    ? `Tables Lifetime. $${LIFETIME_PRICE_USD}. Never again.`
                    : `Both apps. $${SUITE_PRICE_USD}. Never again.`}
            </span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-balance text-lg leading-8 text-muted-foreground">
            {state === "owned"
              ? "Owning both keeps this studio independent. Grab the latest builds any time."
              : upgrading
                ? `Save $${UPGRADE_SAVINGS_USD} versus ${ownedHere ? SUITE_PARTNER.name : THIS_APP} Lifetime on its own.`
                : state === "team"
                  ? "Your Team keeps covering Buckets; Tables is yours for good."
                  : `Save $${SUITE_SAVINGS_USD} versus buying each Lifetime license on its own.`}
          </p>
          <div className="relative mt-8 flex justify-center">
            {state === "owned" ? (
              <DownloadButtons where="footer-cta" className="w-full justify-center sm:w-auto" />
            ) : (
              <BuyButton state={state} where="footer-cta" className="w-full sm:w-auto" />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
