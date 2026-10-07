"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Layers } from "lucide-react";
import { Panel } from "@/components/account/kit";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSuiteState } from "@/lib/hooks/use-suite-state";
import {
  LIFETIME_PRICE_USD,
  SUITE_PARTNER,
  SUITE_PATH,
  SUITE_PRICE_USD,
  SUITE_SAVINGS_USD,
  SUITE_UPGRADE_PATH,
  SUITE_UPGRADE_PRICE_USD,
} from "@/lib/suite-offer";
import { sendGAEvent } from "@next/third-parties/google";

/**
 * Billing-page card for the Tables + Buckets Suite, matched to what the
 * account owns across BOTH apps (Tables ownership comes from the partner
 * lookup in /api/suite/ownership):
 * - owns both: a quiet "you own the Suite" card with a link to Tables
 * - owns Buckets Lifetime: add Tables Lifetime for $49 (sold here)
 * - owns Tables Lifetime (Buckets subscriber/team): add Buckets for $49 on the
 *   Tables site, where that Lifetime lives
 * - team-covered: Tables Lifetime on its own ($99)
 * - otherwise: the $149 Suite
 */
export function SuiteUpsell({ kind, className }: { kind: "subscription" | "lifetime" | "team"; className?: string }) {
  const { loading, state } = useSuiteState();
  // Never flash an offer to someone who may already own everything.
  if (loading) return null;

  if (state === "owned") {
    return (
      <Panel className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
              Tables + Buckets Suite
            </p>
            <h2 className="mt-1.5 inline-flex items-center gap-2 text-[15px] font-semibold">
              <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
              You own both apps for good
            </h2>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
              Your Tables key, devices and receipts are on the Tables website — sign in there with this same email.
            </p>
          </div>
          <a
            href={SUITE_PARTNER.billingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0 gap-1.5 rounded-full")}
            onClick={() => sendGAEvent({ event: "suite_cta_click", label: "billing-owned-tables" })}
          >
            Tables billing
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </Panel>
    );
  }

  const ownerHere = state === "upgrade-here" || kind === "lifetime";
  const ownerThere = state === "upgrade-there";
  const covered = !ownerHere && !ownerThere && kind === "team";
  const href = ownerThere ? SUITE_PARTNER.upgradeUrl : ownerHere ? SUITE_UPGRADE_PATH : covered ? SUITE_PARTNER.pricingUrl : SUITE_PATH;
  const external = ownerThere || covered;
  const pair = ownerHere || ownerThere || covered;
  return (
    <Panel className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-72 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.14),transparent)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
            {pair ? "Complete the pair" : "Tables + Buckets Suite"}
          </p>
          <h2 className="mt-1.5 text-[15px] font-semibold">
            {ownerThere
              ? `Add Buckets Lifetime for $${SUITE_UPGRADE_PRICE_USD}`
              : ownerHere
                ? `Add Tables Lifetime for $${SUITE_UPGRADE_PRICE_USD}`
                : covered
                  ? `Add Tables Lifetime for $${LIFETIME_PRICE_USD}`
                  : `Own Buckets and Tables for good — $${SUITE_PRICE_USD}`}
          </h2>
          <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
            {ownerThere
              ? `You own Tables Lifetime, so Buckets Lifetime is $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}. Checkout runs on the Tables website${kind === "subscription" ? "; your Buckets subscription is cancelled for you" : ""}.`
              : ownerHere
                ? `The same idea for Amazon DynamoDB, from the same studio — $${LIFETIME_PRICE_USD} on its own, $${SUITE_UPGRADE_PRICE_USD} for Buckets Lifetime owners. Pay once, keep it forever, on 2 machines.`
                : covered
                  ? "The same idea for Amazon DynamoDB, from the same studio. Pay once, keep it forever, on 2 machines."
                  : `Both Lifetime licenses in one payment, saving $${SUITE_SAVINGS_USD}. Your current subscription is cancelled for you — no double billing.`}
          </p>
        </div>
        <Link
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0 gap-1.5 rounded-full")}
          onClick={() => sendGAEvent({ event: "suite_cta_click", label: ownerThere ? "billing-upgrade-there" : ownerHere ? "billing-upgrade" : covered ? "billing-tables" : "billing-suite" })}
        >
          {ownerThere ? "Add Buckets Lifetime" : ownerHere ? "Add Tables Lifetime" : covered ? "See Tables pricing" : "See the Suite"}
          {external ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </Panel>
  );
}
