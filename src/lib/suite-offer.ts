/**
 * The Tables + Buckets Suite — both Lifetime licenses for one price.
 *
 * Client-safe (no env, no server-only imports): the pricing section, the
 * /buy page and the payment-status page all read the offer from here, and the
 * checkout route derives the Dodo metadata from the same constants.
 *
 * How it works end to end: the Suite is ONE one-time Dodo product
 * (SUITE_DODO_PRODUCT_ID_LIFETIME, the same ID configured on both websites and
 * both backends). Dodo broadcasts the payment to both products' webhooks, each
 * of which recognizes the product as a Lifetime product and grants its own
 * license to the buyer's email. Buckets and Tables use separate Clerk
 * instances, so `originApp` tells the OTHER backend not to bind this site's
 * Clerk subject to its row (the buyer claims it there by signing in with the
 * same email).
 *
 * SUITE_PRICE_USD MUST match the Suite product's price in the Dodo dashboard:
 * Dodo is what actually charges; this constant is only what we SHOW.
 */

export const SUITE_PRICE_USD = 149;
/** Lifetime price of each product bought on its own. */
export const LIFETIME_PRICE_USD = 99;
export const SUITE_SEPARATE_PRICE_USD = 2 * LIFETIME_PRICE_USD;
export const SUITE_SAVINGS_USD = SUITE_SEPARATE_PRICE_USD - SUITE_PRICE_USD;

/** `?tier=suite` on /buy and in the checkout request body. */
export const SUITE_CHECKOUT_TIER = "suite";
/** metadata.app on a Suite checkout — recognized by BOTH backends. */
export const SUITE_APP_ID = "serverless-suite";
/** metadata.bundle on a Suite checkout. */
export const SUITE_BUNDLE_ID = "tables-buckets";
/** metadata.originApp on a Suite checkout sold by THIS website. */
export const SUITE_ORIGIN_APP = "serverless-buckets";
/** `?bundle=` on the /payment-status return URL. */
export const SUITE_RETURN_PARAM = "suite";

/**
 * The Suite upgrade — "complete the pair": someone who already owns Buckets
 * Lifetime adds Tables Lifetime for $49 instead of the full $99, so owning
 * both never costs more than the Suite would have. Sold HERE (this site
 * verifies the Buckets Lifetime before creating the checkout) as one shared
 * one-time Dodo product (SUITE_UPGRADE_DODO_PRODUCT_ID_LIFETIME, the same ID
 * on both websites and both backends). The checkout stamps `app` with the
 * PARTNER's marker so only the Tables webhook claims the payment and grants
 * Tables Lifetime to the buyer's email; the Buckets row is untouched.
 *
 * SUITE_UPGRADE_PRICE_USD MUST match the upgrade product's price in Dodo.
 */
export const SUITE_UPGRADE_PRICE_USD = 49;
/** What a Buckets Lifetime owner saves vs buying Tables Lifetime outright. */
export const SUITE_UPGRADE_SAVINGS_USD = LIFETIME_PRICE_USD - SUITE_UPGRADE_PRICE_USD;
/** `?tier=suite-upgrade` on /buy and in the checkout request body. */
export const SUITE_UPGRADE_CHECKOUT_TIER = "suite-upgrade";
/** metadata.bundle on a Suite upgrade checkout (both backends recognize it). */
export const SUITE_UPGRADE_BUNDLE_ID = "suite-upgrade";
/** metadata.app on a Suite upgrade checkout: the PARTNER product's marker,
 * so its webhook (and only its webhook) claims the payment. */
export const SUITE_UPGRADE_TARGET_APP = "serverless-tables";
/** `?bundle=` on the /payment-status return URL after a Suite upgrade. */
export const SUITE_UPGRADE_RETURN_PARAM = "suite-upgrade";
/** Where a Buckets Lifetime owner adds Tables Lifetime. */
export const SUITE_UPGRADE_PATH = `/buy?tier=${SUITE_UPGRADE_CHECKOUT_TIER}`;

export const SUITE_NAME = "Tables + Buckets Suite";

/** The other product in the Suite, where the second license is used. */
export const SUITE_PARTNER = {
  name: "Tables",
  origin: "https://tables.serverlesscreed.com",
  pricingUrl: "https://tables.serverlesscreed.com/pricing",
  billingUrl: "https://tables.serverlesscreed.com/account/billing",
  downloadsUrl: "https://tables.serverlesscreed.com/downloads",
} as const;

export const SUITE_FEATURES = [
  "Buckets Lifetime — S3, every feature, all future updates",
  "Tables Lifetime — DynamoDB, every feature, all future updates",
  "Each license works on 2 machines",
  "Pay once. No renewals, ever",
] as const;

/** `/suite` on this site; the partner's is `${SUITE_PARTNER.origin}/suite`. */
export const SUITE_PATH = "/suite";

/** The two halves of the Suite as shown on the landing page (this product first). */
export const SUITE_PRODUCTS = [
  {
    name: "Buckets",
    tagline: "Amazon S3, beautifully managed",
    blurb: "Browse, search and move objects across buckets and accounts, manage permissions and lifecycle rules, and preview files without leaving the app.",
    href: "/",
    external: false,
  },
  {
    name: "Tables",
    tagline: "Amazon DynamoDB, in one desktop workspace",
    blurb: "Explore and edit live data, design access patterns, generate GraphQL and REST APIs, and operate production tables with cost, capacity and audit tooling.",
    href: SUITE_PARTNER.origin,
    external: true,
  },
] as const;

export const SUITE_STEPS = [
  { title: "Pay once", body: `One $${SUITE_PRICE_USD} payment on either site, checked out with the email you sign in with.` },
  { title: "Two keys, same email", body: "Both Lifetime licenses are activated on that email within minutes. Each key arrives by email and shows up on that product's billing page." },
  { title: "Use each on 2 machines", body: "Activate Buckets and Tables on up to two machines each. Every feature, every future update, nothing to renew." },
] as const;

export const SUITE_FAQS = [
  {
    question: "What exactly do I get with the Suite?",
    answer: `Two perpetual licenses: Buckets Lifetime (S3) and Tables Lifetime (DynamoDB). It is the same $${LIFETIME_PRICE_USD} Lifetime plan each app sells on its own, bought together for $${SUITE_PRICE_USD} instead of $${SUITE_SEPARATE_PRICE_USD}. Every feature, every future update, usable on 2 machines per app.`,
  },
  {
    question: "I already own one of them. Can I still get the deal?",
    answer: `Yes — you pay the difference. If you own Buckets Lifetime, add Tables Lifetime for $${SUITE_UPGRADE_PRICE_USD} instead of $${LIFETIME_PRICE_USD}: sign in here and use "Add Tables Lifetime" on your billing or pricing page (you're sent there automatically if you try to buy the Suite). Tables Lifetime owners do the same on the Tables website to add Buckets. Either way, owning both costs no more than the Suite.`,
  },
  {
    question: "I'm on a monthly or yearly plan. What happens to it?",
    answer: "Buy the Suite and your subscription for that product is cancelled for you the moment the Lifetime license is issued, so you are never charged for both. Your license key and devices stay the same.",
  },
  {
    question: "Which email are the licenses tied to?",
    answer: "The email of the account you check out with. Sign in on the other product's website with that same email to see its key and receipts there. Both keys are also emailed to you.",
  },
  {
    question: "Can I buy the Suite for my team?",
    answer: "The Suite is a personal license. For a company-owned pool of seats on one invoice, use each product's Team plan.",
  },
  {
    question: "What is the refund policy?",
    answer: "The Lifetime refund window of each product applies to the Suite, and a refund covers both licenses. See the refund policy on either site.",
  },
] as const;
