"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Layers } from "lucide-react";
import { Panel } from "@/components/account/kit";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LIFETIME_PRICE_USD,
  SUITE_PARTNER,
  SUITE_PATH,
  SUITE_PRICE_USD,
  SUITE_SAVINGS_USD,
} from "@/lib/suite-offer";
import { sendGAEvent } from "@next/third-parties/google";

/**
 * Billing-page card for the Tables + Buckets Suite, matched to what the
 * account owns. Lifetime owners and team-covered accounts cannot buy the
 * Suite here (Buckets is already covered), so they are offered Tables
 * Lifetime on its own instead.
 */
export function SuiteUpsell({ kind, className }: { kind: "subscription" | "lifetime" | "team"; className?: string }) {
  const covered = kind !== "subscription";
  const href = covered ? SUITE_PARTNER.pricingUrl : SUITE_PATH;
  return (
    <Panel className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-72 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.14),transparent)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
            {covered ? "Complete the pair" : "Tables + Buckets Suite"}
          </p>
          <h2 className="mt-1.5 text-[15px] font-semibold">
            {covered
              ? `Add Tables Lifetime for $${LIFETIME_PRICE_USD}`
              : `Own Buckets and Tables for good — $${SUITE_PRICE_USD}`}
          </h2>
          <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
            {covered
              ? "The same idea for Amazon DynamoDB, from the same studio. Pay once, keep it forever, on 2 machines."
              : `Both Lifetime licenses in one payment, saving $${SUITE_SAVINGS_USD}. Your current subscription is cancelled for you — no double billing.`}
          </p>
        </div>
        <Link
          href={href}
          {...(covered ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0 gap-1.5 rounded-full")}
          onClick={() => sendGAEvent({ event: "suite_cta_click", label: covered ? "billing-tables" : "billing-suite" })}
        >
          {covered ? "See Tables pricing" : "See the Suite"}
          {covered ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </Panel>
  );
}
