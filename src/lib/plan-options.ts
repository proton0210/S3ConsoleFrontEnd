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
/** What a checkout can target: a plan, the Tables + Buckets Suite (one
 * payment that grants Lifetime here AND on Tables), or the Suite upgrade
 * (Tables Lifetime at the owner price, for an existing Buckets Lifetime
 * owner — it grants nothing here). */
export type CheckoutTarget = PlanTier | "suite" | "suite-upgrade";

/** What the customer owns right now, for purchase decisions. */
export type CurrentPlan = "none" | "monthly" | "yearly" | "lifetime" | "early" | "team";

export interface LicenseSnapshot {
  paid?: boolean | string | number;
  tier?: string | null;
  productId?: string | null;
  subscriptionStatus?: string | null;
  revoked?: boolean | string | number;
  disputed?: boolean | string | number;
  effectiveActive?: boolean;
}

export const BILLING_URL = "/account/billing";
export const TEAM_URL = "/account/team";
export const SALES_EMAIL = "mailto:buckets@serverlesscreed.com";
/** The other half of the Suite, bought on its own (team-covered accounts). */
export const SUITE_PARTNER_PRICING_URL = "https://tables.serverlesscreed.com/pricing";
/** Where a Buckets Lifetime owner adds Tables Lifetime at the upgrade price
 * (mirrors SUITE_UPGRADE_PATH in suite-offer.ts; kept literal so this module
 * stays dependency-free for the tests). */
export const SUITE_UPGRADE_HREF = "/buy?tier=suite-upgrade";
export const SUITE_UPGRADE_PRICE_USD = 49;
export const SUITE_HREF = "/buy?tier=suite";
/** Where a Tables Lifetime owner adds Buckets Lifetime: the upgrade is sold on
 * the site that owns the Lifetime, so that is the Tables website (mirrors
 * SUITE_PARTNER.upgradeUrl in suite-offer.ts). */
export const SUITE_PARTNER_UPGRADE_URL = "https://tables.serverlesscreed.com/buy?tier=suite-upgrade";

/**
 * - Paid rows without a tier are early-access (pre-tier) customers: perpetual
 *   access, treated like Lifetime but labelled separately.
 * - A canceled subscription can be bought again, so it counts as "none".
 * - Past-due still counts as the plan (they should fix payment, not re-buy).
 */
/** Match the backend's legacy DynamoDB boolean representations. */
function isTruthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  return false;
}

/** The backend's computed status wins; older responses use its paid semantics. */
function activeLifetime(row: LicenseSnapshot): boolean {
  if (isTruthy(row.revoked) || isTruthy(row.disputed)) return false;
  return typeof row.effectiveActive === "boolean" ? row.effectiveActive : isTruthy(row.paid);
}

export function currentPlanFromLicense(license?: LicenseSnapshot | null): CurrentPlan {
  if (!license || !isTruthy(license.paid) || isTruthy(license.revoked)) return "none";
  const tier = license.tier;
  if ((!tier || tier === "lifetime") && !activeLifetime(license)) return "none";
  if (!tier || (tier === "lifetime" && license.productId === "legacy")) return "early";
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
export function checkoutAllowed(current: CurrentPlan, target: CheckoutTarget): boolean {
  // The Suite upgrade is priced for Buckets Lifetime owners only: they already
  // paid for half of the Suite. Everyone else is sent to the Suite.
  if (target === "suite-upgrade") return ownsLifetime(current);
  // The Suite grants Buckets Lifetime, so it follows the Lifetime rules: a
  // Lifetime owner would pay for Buckets twice (they add Tables Lifetime via
  // the Suite upgrade instead); subscribers upgrade (the webhook cancels
  // their plan).
  const plan: PlanTier = target === "suite" ? "lifetime" : target;
  if (planActionFor(current, plan).kind === "checkout") return true;
  return plan === "lifetime" && (current === "monthly" || current === "yearly");
}

/** Lifetime in any form: the only accounts priced for the Suite upgrade. */
export function ownsLifetime(current: CurrentPlan): boolean {
  return current === "lifetime" || current === "early";
}

/** Where to send a customer whose checkout for `target` is blocked. */
export function checkoutBlockedHref(current: CurrentPlan, target: CheckoutTarget): string {
  if (target === "suite-upgrade") return SUITE_HREF;
  // Buckets is already covered, so the only thing left to buy is Tables: at
  // the owner price for Lifetime owners, on its own for team-covered seats.
  if (target === "suite" && ownsLifetime(current)) return SUITE_UPGRADE_HREF;
  if (target === "suite" && current === "team") return SUITE_PARTNER_PRICING_URL;
  return current === "team" ? TEAM_URL : BILLING_URL;
}

/** Button label next to `checkoutBlockedMessage` for a blocked checkout. */
export function checkoutBlockedCta(current: CurrentPlan, target: CheckoutTarget): string {
  if (target === "suite-upgrade") return "Get the Suite";
  if (target === "suite" && ownsLifetime(current)) return `Add Tables Lifetime for $${SUITE_UPGRADE_PRICE_USD}`;
  if (target === "suite" && current === "team") return "Get Tables Lifetime";
  return current === "team" ? "Go to your team" : "Go to billing";
}

/** Pricing-page CTA for the Suite, given what the customer owns. */
export function suiteActionFor(current: CurrentPlan): PlanAction {
  switch (current) {
    case "none":
      return { kind: "checkout" };
    case "monthly":
    case "yearly":
      return { kind: "switch", label: "Upgrade to the Suite", href: "/buy?tier=suite" };
    case "lifetime":
    case "early":
      // Already paid for half of the Suite: add Tables at the owner price.
      return { kind: "switch", label: `Add Tables Lifetime — $${SUITE_UPGRADE_PRICE_USD}`, href: SUITE_UPGRADE_HREF };
    case "team":
      // The Buckets half is covered by the team; Tables is bought on its own.
      return { kind: "switch", label: "Get Tables Lifetime", href: SUITE_PARTNER_PRICING_URL };
  }
}

const TIER_NAME: Record<PlanTier, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
  team: "Team",
};

export function checkoutBlockedMessage(current: CurrentPlan, target: CheckoutTarget): string {
  if (target === "suite-upgrade") {
    return `The $${SUITE_UPGRADE_PRICE_USD} Suite upgrade is for Buckets Lifetime owners adding Tables. Own both apps for good with the Tables + Buckets Suite instead.`;
  }
  if (target === "suite") {
    if (ownsLifetime(current)) {
      return `You already own Buckets Lifetime, so the Suite would charge you for it again. Add Tables Lifetime for $${SUITE_UPGRADE_PRICE_USD} instead — you still get the Suite deal.`;
    }
    if (current === "team") {
      return "Your Buckets seat is already covered by your Team plan, so the Suite would charge you for it again. Get Tables Lifetime on its own instead.";
    }
    target = "lifetime";
  }
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
      return `You're on ${plan}. To move to a Team plan, contact buckets@serverlesscreed.com and we'll switch you over without double billing.`;
    default:
      return "This plan isn't available for your account.";
  }
}

/**
 * What this person owns across BOTH apps, as far as this website can tell.
 * Buckets and Tables have separate accounts and backends, so the other app is
 * learned server-side from the Tables backend by verified email
 * (`partnerLifetime`; null when that lookup is unavailable). `viaSuite` is
 * true when this site's Lifetime row was granted by a Suite or Suite-upgrade
 * payment — both imply Tables Lifetime — and is only a fallback for an
 * unknown partner answer.
 */
export interface SuiteOwnership {
  partnerLifetime: boolean | null;
  viaSuite: boolean;
}

/**
 * Which version of the Suite offer to show:
 * - public:        no relevant plan (signed out, trial, none, cancelled)
 * - subscriber:    Buckets Monthly/Yearly — $149 Suite, subscription cancelled for them
 * - team:          Buckets seat covered by a Team — Tables Lifetime on its own
 * - upgrade-here:  owns Buckets Lifetime only — add Tables for $49, sold here
 * - upgrade-there: owns Tables Lifetime only — add Buckets for $49, sold on Tables
 * - owned:         owns both — nothing to buy
 */
export type SuiteState = "public" | "subscriber" | "team" | "upgrade-here" | "upgrade-there" | "owned";

/** True when the other app's Lifetime is owned (live answer first, then the row hint). */
export function ownsPartnerLifetime(current: CurrentPlan, suite: SuiteOwnership | null | undefined): boolean {
  if (suite?.partnerLifetime != null) return suite.partnerLifetime;
  return ownsLifetime(current) && suite?.viaSuite === true;
}

export function suiteStateFor(current: CurrentPlan, suite: SuiteOwnership | null | undefined): SuiteState {
  const here = ownsLifetime(current);
  const there = ownsPartnerLifetime(current, suite);
  if (here && there) return "owned";
  if (here) return "upgrade-here";
  if (there) return "upgrade-there";
  if (current === "monthly" || current === "yearly") return "subscriber";
  if (current === "team") return "team";
  return "public";
}

export interface SuitePartnerBlock {
  code: "already_owned" | "partner_owned";
  message: string;
  href: string;
  cta: string;
}

/**
 * Checkout rule for the $149 Suite and the $49 Suite upgrade once Tables
 * ownership is known (the server checks it before creating either checkout;
 * /buy checks it first for a friendlier message):
 * - owns both: nothing to buy — the upgrade would charge $49 for a license
 *   Tables already has (its webhook keeps the original purchase).
 * - owns only Tables Lifetime: the Suite would charge for Tables again and the
 *   upgrade is not sold here — send them to the Tables site's upgrade.
 */
export function suitePartnerBlock(current: CurrentPlan, target: CheckoutTarget, partnerLifetime: boolean): SuitePartnerBlock | null {
  if ((target !== "suite" && target !== "suite-upgrade") || !partnerLifetime) return null;
  if (ownsLifetime(current)) {
    return {
      code: "already_owned",
      message: "You already own Buckets Lifetime and Tables Lifetime — the whole Suite. There's nothing more to buy.",
      href: "/suite",
      cta: "See your Suite",
    };
  }
  return {
    code: "partner_owned",
    message: `You already own Tables Lifetime, so you can add Buckets Lifetime for $${SUITE_UPGRADE_PRICE_USD} instead. Checkout runs on the Tables website, where your Lifetime is — sign in there with this same email.`,
    href: SUITE_PARTNER_UPGRADE_URL,
    cta: `Add Buckets Lifetime for $${SUITE_UPGRADE_PRICE_USD}`,
  };
}
