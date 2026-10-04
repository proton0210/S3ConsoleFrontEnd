/**
 * Plan-card call to action for existing customers (see lib/plan-options).
 * New visitors keep each page's own checkout button; these cover the rest.
 */
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BILLING_URL,
  CURRENT_PLAN_LABEL,
  TEAM_URL,
  type CurrentPlan,
  type PlanAction,
} from "@/lib/plan-options";

export function PlanActionButton({
  action,
  className,
}: {
  action: Exclude<PlanAction, { kind: "checkout" }>;
  className?: string;
}) {
  const base = "h-11 w-full rounded-full font-semibold";
  if (action.kind === "included") {
    return (
      <div
        className={cn(
          base,
          "inline-flex items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground",
          className
        )}
      >
        <Check className="h-4 w-4 text-primary" aria-hidden />
        {action.label}
      </div>
    );
  }
  const href = action.href;
  const external = href.startsWith("mailto:");
  const classes = cn(
    buttonVariants({ variant: action.kind === "current" ? "default" : "outline" }),
    base,
    action.kind !== "current" && "border-border bg-foreground/[0.03] hover:bg-foreground/[0.08]",
    className
  );
  return external ? (
    <a href={href} className={classes}>
      {action.label}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {action.label}
    </Link>
  );
}

const BANNER_COPY: Record<Exclude<CurrentPlan, "none">, string> = {
  lifetime: "Your personal license includes every feature and future update. Add a Team plan if you need shared billing.",
  early: "As an early supporter you have every feature for good. Add a Team plan if you need shared billing.",
  monthly: "Upgrades change your existing subscription from the Billing page, so you're never billed twice.",
  yearly: "Plan changes happen from the Billing page, so you're never billed twice.",
  team: "Your team plan covers every feature. Manage seats and members from the Team page.",
};

export function CurrentPlanBanner({ plan, className }: { plan: CurrentPlan; className?: string }) {
  if (plan === "none") return null;
  const href = plan === "team" ? TEAM_URL : BILLING_URL;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          You&apos;re on the {CURRENT_PLAN_LABEL[plan]} plan
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{BANNER_COPY[plan]}</p>
      </div>
      <Link
        href={href}
        className={cn(buttonVariants({ size: "sm" }), "h-9 shrink-0 rounded-full px-4 font-semibold")}
      >
        {plan === "team" ? "Manage team" : "Go to Billing"}
      </Link>
    </div>
  );
}
