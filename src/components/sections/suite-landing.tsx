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
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Infinity as InfinityIcon, Layers } from "lucide-react";
import Link from "next/link";
import { sendGAEvent } from "@next/third-parties/google";

const BUY_HREF = "/buy?tier=suite";
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

function BuyButton({ label = "Get the Suite", where, className }: { label?: string; where: string; className?: string }) {
  return (
    <Link
      href={BUY_HREF}
      className={cn(
        buttonVariants({ size: "lg" }),
        "group h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]",
        className
      )}
      onClick={() => sendGAEvent({ event: "suite_cta_click", label: where })}
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/** The /suite landing page body: hero + price, the two apps, how it works, FAQ, CTA. */
export function SuiteLanding() {
  return (
    <>
      <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Eyebrow>
              <Layers className="h-3.5 w-3.5 text-primary" aria-hidden /> {SUITE_NAME}
            </Eyebrow>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              <span className="text-gradient">Own S3 and DynamoDB for good.</span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-lg leading-8 text-muted-foreground">
              Buckets Lifetime and Tables Lifetime in one payment. Every feature of both apps, every future
              update, on 2 machines each — and nothing to renew, ever.
            </p>
            <ul className="mt-7 grid max-w-xl gap-2.5 sm:grid-cols-2">
              {SUITE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <BuyButton where="hero" className="w-full sm:w-auto" />
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full rounded-full border-border bg-foreground/[0.03] px-7 text-base font-medium hover:bg-foreground/[0.08] sm:w-auto"
                )}
              >
                Compare with single plans
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Already own one of them?{" "}
              <Link href="#faq" className="underline underline-offset-4 hover:text-foreground">
                Add the other for ${SUITE_UPGRADE_PRICE_USD}.
              </Link>
            </p>
          </div>

          <motion.div {...reveal} className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-primary/50 bg-gradient-to-b from-primary/[0.12] to-transparent p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)] sm:p-9">
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
                {["Buckets Lifetime license", "Tables Lifetime license", "2 machines per app", "All future updates"].map((line) => (
                  <li key={line} className="flex items-center gap-3">
                    <InfinityIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-foreground/90">{line}</span>
                  </li>
                ))}
              </ul>
              <BuyButton where="price-card" className="mt-8 w-full" />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Prices in USD. VAT/GST may be added at checkout.
              </p>
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
                <span className="text-muted-foreground">${LIFETIME_PRICE_USD} on its own</span>
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
            <span className="text-gradient">Both apps. ${SUITE_PRICE_USD}. Never again.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-balance text-lg leading-8 text-muted-foreground">
            Save ${SUITE_SAVINGS_USD} versus buying each Lifetime license on its own.
          </p>
          <div className="relative mt-8 flex justify-center">
            <BuyButton where="footer-cta" className="w-full sm:w-auto" />
          </div>
        </div>
      </section>
    </>
  );
}
