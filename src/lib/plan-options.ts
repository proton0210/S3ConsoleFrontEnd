/**
 * What a signed-in customer can do with each plan, given what they already own.
 *
 * Shared by every plan picker (pricing page, homepage pricing section, /buy)
 * and by /api/dodo/create-checkout, so the UI and the server agree on when a
 * new checkout is allowed. Without this, an existing customer could start a
 * second checkout and end up with two parallel subscriptions.
 *
 * Client-safe: no server-only imports.
 */

export type PlanTier = "monthly" | "yearly" | "lifetime" | "team";

/** What the customer owns right now, for purchase decisions. */
export type CurrentPlan = "none" | "monthly" | "yearly" | "lifetime" | "early" | "team";

export interface LicenseSnapshot {
  paid?: boolean;
  tier?: string | null;
  subscriptionStatus?: string | null;
  revoked?: boolean;
}

export const BILLING_URL = "/account/billing";
export const TEAM_URL = "/account/team";
export const SALES_EMAIL = "mailto:vidit@serverlesscreed.com";

/**
 * - Paid rows without a tier are early-access (pre-tier) customers: perpetual
 *   access, treated like Lifetime but labelled separately.
 * - A canceled subscription can be bought again, so it counts as "none".
 * - Past-due still counts as the plan (they should fix payment, not re-buy).
 */
export function currentPlanFromLicense(license?: LicenseSnapshot | null): CurrentPlan {
  if (!license || !license.paid || license.revoked) return "none";
  const tier = license.tier;
  if (!tier) return "early";
  if (tier === "lifetime") return "lifetime";
  if (tier === "monthly" || tier === "yearly" || tier === "team") {
    return license.subscriptionStatus === "canceled" ? "none" : tier;
  }
  return "none";
}

export const CURRENT_PLAN_LABEL: Record<Exclude<CurrentPlan, "none">, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
  early: "Early Access",
  team: "Team",
};

export type PlanAction =
  /** Normal purchase flow. */
  | { kind: "checkout" }
  /** This is the plan they're on. */
  | { kind: "current"; label: string; href: string }
  /** Change happens on the billing page (in-place plan change / upgrade). */
  | { kind: "switch"; label: string; href: string }
  /** Nothing to buy — their plan already includes it. */
  | { kind: "included"; label: string }
  /** No self-serve path; talk to us. */
  | { kind: "contact"; label: string; href: string };

export function planActionFor(current: CurrentPlan, target: PlanTier): PlanAction {
  switch (current) {
    case "none":
      return { kind: "checkout" };

    case "monthly":
    case "yearly":
      if (target === current) return { kind: "current", label: "Your current plan", href: BILLING_URL };
      if (target === "team") return { kind: "contact", label: "Contact us to switch", href: SALES_EMAIL };
      if (target === "monthly") return { kind: "switch", label: "Switch on Billing", href: BILLING_URL };
      return { kind: "switch", label: "Upgrade on Billing", href: BILLING_URL };

    case "lifetime":
    case "early":
      if (target === "team") return { kind: "checkout" };
      if (target === "lifetime" && current === "lifetime") {
        return { kind: "current", label: "Your current plan", href: BILLING_URL };
      }
      return {
        kind: "included",
        label: current === "early" ? "Already included" : "Included in Lifetime",
      };

    case "team":
      if (target === "team") return { kind: "current", label: "Manage your team", href: TEAM_URL };
      return { kind: "included", label: "Covered by your Team plan" };
  }
}

/**
 * Server rule for /api/dodo/create-checkout. Same as the UI, plus the one
 * upgrade that does need a checkout: Lifetime bought from Monthly/Yearly
 * (started from the billing page; the webhook then cancels the old
 * subscription so it never renews).
 */
export function checkoutAllowed(current: CurrentPlan, target: PlanTier): boolean {
  if (planActionFor(current, target).kind === "checkout") return true;
  return target === "lifetime" && (current === "monthly" || current === "yearly");
}

const TIER_NAME: Record<PlanTier, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
  team: "Team",
};

export function checkoutBlockedMessage(current: CurrentPlan, target: PlanTier): string {
  const action = planActionFor(current, target);
  const plan = current === "none" ? "a plan" : `the ${CURRENT_PLAN_LABEL[current]} plan`;
  switch (action.kind) {
    case "current":
      return `You're already on ${plan}.`;
    case "included":
      return `You're on ${plan}, which already includes everything in ${TIER_NAME[target]}. There's nothing more to buy.`;
    case "switch":
      return `You're on ${plan}. Change plans from your Billing page so your current subscription is updated instead of starting a second one.`;
    case "contact":
      return `You're on ${plan}. To move to a Team plan, contact vidit@serverlesscreed.com and we'll switch you over without double billing.`;
    default:
      return "This plan isn't available for your account.";
  }
}
