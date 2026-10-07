/**
 * Magic-link checkout — `/buy?tier=monthly&email=user@example.com`
 *
 * Reached from lifecycle emails (Phase 10c). Reads tier + email from query
 * string, kicks the user straight to Dodo checkout via /api/dodo/create-checkout.
 *
 * Zero friction by design: email pre-filled, tier pre-selected, click → pay.
 */
"use client";
import { createCheckout, CheckoutError } from "@/lib/checkout-client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { compositeLegalVersion } from "@/lib/legalVersions";
import { sendGAEvent } from "@next/third-parties/google";
import { trackReddit, tierValue, TEAM_SEAT_PRICE_USD } from "@/lib/reddit";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Lock, Minus, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuiteState } from "@/lib/hooks/use-suite-state";
import {
  checkoutAllowed,
  checkoutBlockedCta,
  checkoutBlockedHref,
  checkoutBlockedMessage,
  ownsLifetime,
  ownsPartnerLifetime,
  suitePartnerBlock,
} from "@/lib/plan-options";
import { LIFETIME_PRICE_USD, SUITE_FEATURES, SUITE_PARTNER, SUITE_PRICE_USD, SUITE_SAVINGS_USD, SUITE_SEPARATE_PRICE_USD, SUITE_UPGRADE_PRICE_USD, SUITE_UPGRADE_SAVINGS_USD } from "@/lib/suite-offer";

/** `suite` = the Tables + Buckets Suite (both Lifetime licenses, one payment);
 * `suite-upgrade` = Tables Lifetime for an existing Buckets Lifetime owner. */
type Tier = "monthly" | "yearly" | "lifetime" | "team" | "suite" | "suite-upgrade";

const MIN_TEAM_SEATS = 3;
const MAX_TEAM_SEATS = 50;

function isValidTier(value: string | null): value is Tier {
  return (
    value === "monthly" ||
    value === "yearly" ||
    value === "lifetime" ||
    value === "team" ||
    value === "suite" ||
    value === "suite-upgrade"
  );
}

function BuyPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const tier = sp.get("tier");
  const queryEmail = sp.get("email") || undefined;
  // `atv` is set by the desktop app when the user has already accepted ToS in
  // the in-app PricingDialog. When absent (e.g. lifecycle-email magic link),
  // the user must consent below before we redirect to Dodo.
  const queryAtv = sp.get("atv") || undefined;
  // Set by the desktop app: the email of the account signed in to the app.
  // The purchase is keyed to the Clerk account signed in to THIS browser, and
  // the app's entitlement is bound to ITS account — if they differ, the
  // purchase would never show up in the app. So we compare before checkout.
  const accountEmail = sp.get("account_email")?.trim().toLowerCase() || undefined;
  const fromApp = sp.get("from") === "app";
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id;
  const browserEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  const [accountMismatchAccepted, setAccountMismatchAccepted] = useState(false);
  const accountMismatch = Boolean(
    isLoaded && userId && accountEmail && browserEmail && browserEmail !== accountEmail
  ) && !accountMismatchAccepted;
  // Where to come back to after switching accounts, with the app's identity
  // hint preserved so the check runs again for the new session.
  const selfUrl = `/buy?${sp.toString()}`;
  // Team checkouts always pause at the consent box so the buyer sees the seat
  // selector — a pre-stamped ?atv= must not race them past it with the
  // default seat count.
  const [termsAccepted, setTermsAccepted] = useState<boolean>(
    Boolean(queryAtv) && sp.get("tier") !== "team"
  );
  // Checkout starts only from an explicit "Continue" — ticking the terms box
  // alone never navigates away. A desktop-app link with ?atv= (terms already
  // accepted in the app) still continues straight away, except for Team.
  const [confirmed, setConfirmed] = useState<boolean>(
    Boolean(queryAtv) && sp.get("tier") !== "team"
  );
  // Team checkout: seat count from ?seats= (pricing card deep-link), clamped;
  // adjustable in the consent box before we redirect to Dodo.
  const [seats, setSeats] = useState<number>(() => {
    const fromQuery = Number(sp.get("seats"));
    if (Number.isInteger(fromQuery)) {
      return Math.min(MAX_TEAM_SEATS, Math.max(MIN_TEAM_SEATS, fromQuery));
    }
    return MIN_TEAM_SEATS;
  });

  // Email priority: ?email=... query param (from magic-link emails) wins.
  // Fallback to Clerk's authenticated email so signed-in homepage clicks
  // pre-fill the Dodo checkout form. If neither is available, Dodo will
  // ask for it on the checkout page.
  const email =
    queryEmail || user?.primaryEmailAddress?.emailAddress || undefined;
  // Dodo's /subscriptions endpoint requires both email AND name on the
  // customer object; passing email alone fails. Pull name from Clerk when
  // available — otherwise the API drops the customer object and Dodo
  // collects both on its hosted checkout.
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    undefined;

  // Existing customers never get a second checkout from a stale link: they
  // see what they own and where to change it instead.
  // Includes what they own of Tables: owning Tables Lifetime changes the Suite
  // offers (nothing to buy, or the $49 upgrade on the Tables site).
  const { loading: planLoading, plan: currentPlan, suite } = useSuiteState();
  // The Suite upgrade is judged once the person is signed in: an anonymous
  // visitor resolves to "none", but may well own Buckets Lifetime once they
  // sign in below (the checkout route re-checks either way).
  const partnerBlock =
    !planLoading && isValidTier(tier) ? suitePartnerBlock(currentPlan, tier, ownsPartnerLifetime(currentPlan, suite)) : null;
  const blocked =
    !planLoading && isValidTier(tier) && (!!partnerBlock || ((tier !== "suite-upgrade" || !!userId) && !checkoutAllowed(currentPlan, tier)));
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");

  useEffect(() => {
    // Wait for Clerk to load so we don't accidentally start checkout
    // without the email from a still-pending auth context.
    if (!isLoaded) return;

    if (!isValidTier(tier)) return;

    // Wait until we know what the signed-in user already owns.
    if (planLoading || blocked) return;

    // The browser is signed in as a different account than the desktop app:
    // hold the checkout until the user switches or explicitly continues.
    if (accountMismatch) return;

    // Hold the redirect until the user has accepted ToS. The desktop app
    // pre-stamps `atv` to skip this gate — magic-link visitors see the
    // checkbox below before we kick them to Dodo.
    if (!termsAccepted || !confirmed) return;

    // Every checkout must be attached to a Clerk account, including Lifetime
    // and emailed purchase links. A receipt email is not authentication.
    const needsAuth = !userId;
    if (needsAuth) {
      // Carry the chosen seat count through the sign-up bounce — without it
      // the user lands back here with the default and has to re-pick.
      const here = `/buy?tier=${encodeURIComponent(tier!)}${
        tier === "team" ? `&seats=${seats}` : ""
      }${accountEmail ? `&account_email=${encodeURIComponent(accountEmail)}` : ""}${
        fromApp ? "&from=app" : ""
      }`;
      router.replace(`/sign-up?redirect_url=${encodeURIComponent(here)}`);
      return;
    }

    let canceled = false;
    (async () => {
      try {
        // The webhook persists `acceptedTermsVersion` from this metadata onto
        // the license row — it's how activation's post-policy gate passes.
        const acceptedTermsVersion = queryAtv || compositeLegalVersion();
        const acceptedTermsAt = String(Date.now());
        const data = await createCheckout(userId!, {
          tier,
          ...(tier === "team" ? { seats } : {}),
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
          metadata: { acceptedTermsVersion, acceptedTermsAt },
        });
        if (canceled) return;
        sendGAEvent({ event: "checkout_started", tier: tier });
        // Reddit mid-funnel signal — lets the campaign optimize toward
        // cart-adders, with the tier's price as the cart value.
        trackReddit("AddToCart", {
          currency: "USD",
          value:
            tier === "team"
              ? (tierValue(tier) ?? 0) * seats
              : tierValue(tier),
          itemCount: tier === "team" ? seats : 1,
          products: [{ id: tier!, name: tier === "suite" ? "Tables + Buckets Suite" : tier === "suite-upgrade" ? "Tables Lifetime (Suite upgrade)" : `Buckets by ServerlessCreed ${tier} plan` }],
        });
        setStatus("redirecting");
        window.location.href = data.checkout_url;
      } catch (err: unknown) {
        if (canceled) return;
        if (err instanceof CheckoutError && err.manageUrl) setManageUrl(err.manageUrl);
        setError(err instanceof Error ? err.message : "Unexpected error");
        setStatus("error");
        setConfirmed(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [tier, seats, email, name, isLoaded, termsAccepted, confirmed, queryAtv, planLoading, blocked, userId, router, accountMismatch, accountEmail, fromApp]);

  if (!isValidTier(tier)) {
    return (
      <CheckoutFrame>
        <StatusCard tone="danger" icon={<AlertTriangle className="h-6 w-6" />} title="That plan doesn't exist">
          <p>Please pick a plan from the pricing page.</p>
          <a href="/pricing" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />Back to pricing
          </a>
        </StatusCard>
      </CheckoutFrame>
    );
  }

  // Visitors without `atv` review the order and accept the terms here, so we
  // capture acceptance *before* sending them to Dodo.
  const needsConsent = !confirmed && !blocked && !planLoading && !accountMismatch;
  const order = ORDER[tier];
  const total = tier === "team" ? TEAM_SEAT_PRICE_USD * seats : null;

  return (
    <CheckoutFrame>
      {needsConsent && status !== "error" && order ? (
        <form
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_30px_60px_-30px_hsl(var(--foreground)/0.25)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (termsAccepted) setConfirmed(true);
          }}
        >
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your order</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {tier === "suite" ? <>Tables + Buckets <span className="acct-title-accent">Suite</span></> : tier === "suite-upgrade" ? <>Tables <span className="acct-title-accent">Lifetime</span></> : <>Buckets <span className="acct-title-accent">{order.name}</span></>}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{order.summary}</p>
              </div>
              <p className="shrink-0 text-right">
                <span className="text-3xl font-semibold tracking-[-0.03em]">${tier === "team" ? TEAM_SEAT_PRICE_USD : order.price}</span>
                <span className="block text-xs text-muted-foreground">{order.cadence}</span>
              </p>
            </div>

            {tier === "team" && (
              <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="buy-seats" className="text-sm font-medium">
                    Seats
                    <span className="block text-xs font-normal text-muted-foreground">Minimum {MIN_TEAM_SEATS}, add more any time</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-input bg-card">
                    <button
                      type="button"
                      aria-label="Remove a seat"
                      disabled={seats <= MIN_TEAM_SEATS}
                      onClick={() => setSeats((s) => Math.max(MIN_TEAM_SEATS, s - 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-l-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      id="buy-seats"
                      type="number"
                      inputMode="numeric"
                      min={MIN_TEAM_SEATS}
                      max={MAX_TEAM_SEATS}
                      value={seats}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isInteger(v)) {
                          setSeats(Math.min(MAX_TEAM_SEATS, Math.max(MIN_TEAM_SEATS, v)));
                        }
                      }}
                      className="h-10 w-14 border-x border-input bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Add a seat"
                      disabled={seats >= MAX_TEAM_SEATS}
                      onClick={() => setSeats((s) => Math.min(MAX_TEAM_SEATS, s + 1))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Invite teammates by email after purchase. Need more than {MAX_TEAM_SEATS} seats?{" "}
                  <a href="mailto:buckets@serverlesscreed.com" className="underline underline-offset-2 hover:text-foreground">Contact us</a>.
                </p>
              </div>
            )}

            <ul className="mt-6 space-y-2.5">
              {order.includes.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--acct-accent)/0.14)] text-[hsl(var(--acct-accent-ink))]">
                    <Check className="h-3 w-3" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            {tier === "suite" && (
              <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                Your Tables license is activated on this same email. Sign in at{" "}
                <a href={SUITE_PARTNER.origin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2">
                  tables.serverlesscreed.com<ExternalLink className="h-3 w-3" />
                </a>{" "}
                after purchase to see it. Any active Buckets subscription is cancelled for you.
              </p>
            )}

            {tier === "suite-upgrade" && (
              <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                Owner price for Buckets Lifetime customers. Your Tables license is activated on this same email and the key is emailed to you. Sign in at{" "}
                <a href={SUITE_PARTNER.origin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-2">
                  tables.serverlesscreed.com<ExternalLink className="h-3 w-3" />
                </a>{" "}
                with this email to see it. Any active Tables subscription on that email is cancelled for you. Your Buckets license is unchanged.
              </p>
            )}

            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
              <span className="text-sm font-medium">{tier === "lifetime" || tier === "suite" || tier === "suite-upgrade" ? "Total" : "Total today"}</span>
              <span className="text-right">
                {tier === "suite" && (
                  <span className="mr-2 text-sm text-muted-foreground line-through tabular-nums">${SUITE_SEPARATE_PRICE_USD}</span>
                )}
                {tier === "suite-upgrade" && (
                  <span className="mr-2 text-sm text-muted-foreground line-through tabular-nums">${LIFETIME_PRICE_USD}</span>
                )}
                <span className="text-xl font-semibold tabular-nums">${total ?? order.price}</span>
                <span className="ml-1 text-sm text-muted-foreground">{tier === "team" ? `for ${seats} seats / year` : order.cadence}</span>
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">The final amount, including any tax, is shown at checkout.</p>
          </div>

          <div className="border-t border-border bg-muted/30 p-6 sm:px-8">
            <label htmlFor="buy-terms" className="flex cursor-pointer select-none items-start gap-3 text-sm leading-6">
              <input
                id="buy-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
              />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">Terms of Service</a>,{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</a>, and{" "}
                <a href="/eula" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">EULA</a>.
              </span>
            </label>
            <button
              type="submit"
              disabled={!termsAccepted}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-[0_1px_0_0_hsl(0_0%_100%/0.12)_inset,0_8px_20px_-8px_hsl(var(--foreground)/0.45)] transition-all hover:-translate-y-px hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45"
            >
              <Lock className="h-4 w-4" />Continue to secure checkout<ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Payments by Dodo Payments</span>
              <span className="inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />30-day refund</span>
            </p>
          </div>
        </form>
      ) : null}

      {accountMismatch && status !== "error" && (
        <StatusCard tone="danger" icon={<AlertTriangle className="h-6 w-6" />} title="This browser is signed in to a different account">
          <p>
            The Buckets app is signed in as{" "}
            <span className="font-medium text-foreground">{accountEmail}</span>, but this
            browser is signed in as{" "}
            <span className="font-medium text-foreground">{browserEmail}</span>. A purchase
            made now would be linked to <span className="font-medium text-foreground">{browserEmail}</span>{" "}
            and would not appear in the app.
          </p>
          <button
            type="button"
            onClick={() =>
              void signOut({
                redirectUrl: `/sign-in?redirect_url=${encodeURIComponent(selfUrl)}`,
              })
            }
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in as {accountEmail}<ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAccountMismatchAccepted(true)}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-input bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Buy for {browserEmail} anyway
          </button>
        </StatusCard>
      )}

      {!needsConsent && !accountMismatch && (status === "loading" || status === "redirecting") && !blocked && (
        <StatusCard
          icon={<Loader2 className="h-6 w-6 animate-spin" />}
          title={status === "redirecting" ? "Taking you to secure checkout…" : "Preparing your checkout…"}
        >
          {status === "redirecting" ? (
            <>If nothing happens in a few seconds, refresh this page or go back to <a className="font-medium text-foreground underline underline-offset-2" href="/pricing">pricing</a>.</>
          ) : "This only takes a moment."}
        </StatusCard>
      )}

      {blocked && !accountMismatch && (
        <StatusCard icon={<Check className="h-6 w-6" />} title={partnerBlock ? (partnerBlock.code === "already_owned" ? "You already own the Suite" : "You already own Tables Lifetime") : tier === "suite-upgrade" ? "This price is for Buckets Lifetime owners" : tier === "suite" && ownsLifetime(currentPlan) ? "You already own Buckets Lifetime" : "You already have Buckets Pro"}>
          <p>{partnerBlock?.message ?? checkoutBlockedMessage(currentPlan, tier)}</p>
          <a
            href={partnerBlock?.href ?? checkoutBlockedHref(currentPlan, tier)}
            {...((partnerBlock?.href ?? checkoutBlockedHref(currentPlan, tier)).startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {partnerBlock?.cta ?? checkoutBlockedCta(currentPlan, tier)}<ArrowRight className="h-4 w-4" />
          </a>
          <a href="/downloads" className="mt-3 inline-block text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground">Download Buckets</a>
        </StatusCard>
      )}

      {status === "error" && !blocked && (
        <StatusCard tone="danger" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't start checkout">
          <p>{error}</p>
          {manageUrl ? (
            <a href={manageUrl} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Manage your plan<ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <a href="/pricing" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />Back to pricing
            </a>
          )}
        </StatusCard>
      )}
    </CheckoutFrame>
  );
}

const ORDER: Record<Tier, { name: string; price: number; cadence: string; summary: string; includes: string[] }> = {
  monthly: {
    name: "Monthly", price: 5, cadence: "per month", summary: "Billed monthly. Cancel any time.",
    includes: ["Every feature on Mac, Windows and Linux", "Use on 2 machines", "Cancel any time from your account"],
  },
  yearly: {
    name: "Yearly", price: 49, cadence: "per year", summary: "Billed yearly. Save 18% vs monthly.",
    includes: ["Every feature on Mac, Windows and Linux", "Use on 2 machines", "Switch or cancel any time from your account"],
  },
  lifetime: {
    name: "Lifetime", price: 99, cadence: "one-time", summary: "Pay once. Keep it, with every future update.",
    includes: ["Every feature on Mac, Windows and Linux", "Use on 2 machines", "No renewals, ever"],
  },
  team: {
    name: "Team", price: TEAM_SEAT_PRICE_USD, cadence: "per seat / year", summary: "Company-owned seats on one invoice.",
    includes: ["A full license for every member, on 2 machines each", "Reassign seats as your team changes", "Add seats any time, prorated"],
  },
  suite: {
    name: "Suite", price: SUITE_PRICE_USD, cadence: "one-time",
    summary: `Both Lifetime licenses in one payment. Save $${SUITE_SAVINGS_USD} vs buying them separately.`,
    includes: [...SUITE_FEATURES],
  },
  "suite-upgrade": {
    name: "Tables Lifetime", price: SUITE_UPGRADE_PRICE_USD, cadence: "one-time",
    summary: `Complete the pair. Save $${SUITE_UPGRADE_SAVINGS_USD} vs Tables Lifetime on its own, because you already own Buckets Lifetime.`,
    includes: ["Tables Lifetime — DynamoDB, every feature, all future updates", "Use on 2 machines", "Pay once. No renewals, ever"],
  },
};

function CheckoutFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-scope relative isolate flex min-h-screen flex-col items-center bg-background px-4 py-10 text-foreground sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--acct-accent)/0.12),transparent_70%)]" />
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
        Buckets <span className="font-normal text-muted-foreground">by ServerlessCreed</span>
      </Link>
      <div className="w-full max-w-[30rem]">{children}</div>
      <nav className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <a href="/pricing" className="hover:text-foreground">Pricing</a>
        <a href="mailto:buckets@serverlesscreed.com" className="hover:text-foreground">Help</a>
      </nav>
    </div>
  );
}

function StatusCard({ icon, title, tone = "brand", children }: {
  icon: React.ReactNode;
  title: string;
  tone?: "brand" | "danger";
  children?: React.ReactNode;
}) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className="rounded-3xl border border-border bg-card p-8 text-center shadow-[0_30px_60px_-30px_hsl(var(--foreground)/0.25)]">
      <span className={cn(
        "mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl",
        tone === "danger" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]"
      )}>
        {icon}
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>}
    </div>
  );
}

/**
 * Suspense wrapper required because useSearchParams() is a client hook that
 * suspends during static rendering. Without this Next.js complains.
 */
export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <CheckoutFrame>
          <StatusCard icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Preparing your checkout…" />
        </CheckoutFrame>
      }
    >
      <BuyPageContent />
    </Suspense>
  );
}
