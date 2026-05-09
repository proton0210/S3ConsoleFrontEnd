"use client";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

type Plan = (typeof siteConfig.pricing)[number];

const ease = [0.16, 1, 0.3, 1] as const;

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const isPopular = plan.isPopular;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.08 * index, ease }}
      className={cn(
        "group relative flex flex-col border bg-paper transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--ink))]",
        isPopular ? "border-ink" : "border-ink/60"
      )}
    >
      {isPopular && (
        <div className="absolute -top-px left-0 right-0 flex items-center justify-between border-b border-ink bg-ink px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-paper">
          <span>● recommended</span>
          <span className="text-signal">save 54%</span>
        </div>
      )}

      <div className={cn("p-7 pt-8", isPopular && "pt-12")}>
        {/* tier label */}
        <div className="flex items-baseline justify-between border-b border-ink/15 pb-3">
          <span className="text-[11px] uppercase tracking-[0.24em] text-char-600">
            tier // {plan.tier}
          </span>
          <span className="text-[10px] tracking-wider text-char-400">
            {String(index + 1).padStart(2, "0")}/03
          </span>
        </div>

        {/* price */}
        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-display text-7xl font-light leading-none text-ink">
            {plan.price}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-char-600">
            {plan.period}
          </span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-char-600">
          {plan.description}
        </p>

        {/* features */}
        <ul className="mt-7 space-y-2 text-[13px]">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span className="mt-[3px] text-signal">›</span>
              <span className="text-char-800">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <Link
        href={plan.href}
        className={cn(
          "group mt-auto flex items-center justify-between border-t px-6 py-4 text-[12px] uppercase tracking-[0.2em] transition-colors",
          isPopular
            ? "border-ink bg-signal text-paper hover:bg-ink"
            : "border-ink/40 text-ink hover:bg-ink hover:text-paper hover:border-ink"
        )}
      >
        <span>$ choose --{plan.tier}</span>
        <span className="arrow-tick">→</span>
      </Link>
    </motion.div>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" className="relative border-y border-ink/15 bg-paper py-24">
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* section header */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-ink pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-signal">
              §02 — Pricing
            </p>
            <h2 className="mt-3 font-display text-5xl font-light leading-[1.05] text-ink sm:text-6xl">
              Three plans. <span className="italic text-char-800">No surprises.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-char-600">
            Every plan includes every feature on up to two machines.
            Start free for 14 days — no card.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {siteConfig.pricing.map((plan, i) => (
            <PlanCard key={plan.tier} plan={plan} index={i} />
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-char-600">
          vat / gst may apply at checkout depending on your jurisdiction
        </p>
      </div>
    </section>
  );
}
