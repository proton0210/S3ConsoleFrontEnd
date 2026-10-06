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
    answer: "The Suite is for people who own neither. If you already have Buckets Lifetime, buy Tables Lifetime on its own (and vice versa) — you'll be pointed there automatically if you try to buy the Suite while signed in.",
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
