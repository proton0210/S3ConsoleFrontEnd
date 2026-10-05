/**
 * Billing dashboard for signed-in paid customers.
 *
 * Two sources of state:
 *   - /api/user-data        → the license row (tier, status, validUntil…).
 *     Written only by the Dodo webhook, so it is the source of truth for
 *     access and for which plan the customer is on.
 *   - /api/dodo/subscription → live Dodo state for things that are only
 *     *scheduled*: a cancellation at period end (set in the portal) or a
 *     downgrade queued for the next billing date.
 *
 * Actions delegate to:
 *   - /api/dodo/portal-session  → Dodo hosted portal (cancel, card, invoices)
 *   - /api/dodo/change-plan     → monthly → yearly now (prorated), or
 *                                 yearly → monthly at the next billing date
 *   - /api/dodo/subscription    → DELETE undoes a scheduled downgrade
 *   - /api/dodo/create-checkout → lifetime upgrade (one-time product; the
 *                                 webhook auto-cancels the old subscription)
 *
 * After any state-changing action the page polls until the webhook (or Dodo)
 * reflects the change, so the customer never has to refresh by hand.
 */
"use client";

import { createCheckout } from "@/lib/checkout-client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Infinity as InfinityIcon,
  LifeBuoy,
  Loader2,
  RefreshCw,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AccountHeader,
  AccountMain,
  ActionTile,
  CopyField,
  EmptyState,
  Fact,
  Meter,
  Notice,
  NoticeStack,
  Panel,
  SectionTitle,
  Skeleton,
  StatusBadge,
  relativeDays,
} from "@/components/account/kit";
import { cn } from "@/lib/utils";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";

type Tier = "monthly" | "yearly" | "lifetime" | "team";
type SoloTier = Exclude<Tier, "team">;
type SubStatus = "active" | "past_due" | "canceled" | string;

interface UserData {
  email: string;
  name?: string;
  paid?: boolean;
  tier?: Tier;
  subscriptionStatus?: SubStatus;
  subscriptionId?: string;
  dodoCustomerId?: string;
  productId?: string;
  validUntil?: number | null;
  gracePeriodUntil?: number | null;
  key?: string;
  licenseCount?: number;
  machines?: string[];
  revoked?: boolean;
  disputed?: boolean;
  /** Team seats: the owner's email (equals `email` for the owner). */
  teamOwner?: string | null;
  /** Team owners: per-seat price their Team product actually charges. */
  teamSeatPriceUsd?: number | null;
}

/** Live Dodo state (see /api/dodo/subscription). */
interface LiveSubscription {
  status: string | null;
  tier: Tier | null;
  nextBillingDate: string | null;
  cancelAtNextBillingDate: boolean;
  scheduledChange: { tier: Tier; effectiveAt: string | null } | null;
}

const TIER_LABELS: Record<Tier, { name: string; price: string; cadence: string; blurb: string }> = {
  monthly: { name: "Monthly", price: "$5", cadence: "per month", blurb: "Flexible, cancel anytime" },
  yearly: { name: "Yearly", price: "$49", cadence: "per year", blurb: "Save 18% vs monthly" },
  lifetime: { name: "Lifetime", price: "$99", cadence: "one-time", blurb: "Pay once, no renewals" },
  team: { name: "Team", price: `$${TEAM_SEAT_PRICE_USD}`, cadence: "per seat / year", blurb: "One invoice for the team" },
};

const PLAN_ORDER: SoloTier[] = ["monthly", "yearly", "lifetime"];
const RANK: Record<SoloTier, number> = { monthly: 0, yearly: 1, lifetime: 2 };
const PERKS: Record<SoloTier, string> = {
  monthly: "$60 a year if you stay",
  yearly: "Save $11 a year vs monthly",
  lifetime: "Never renews — updates included",
};
const SUPPORT_EMAIL = "buckets@serverlesscreed.com";

function errorText(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Deadline helpers live outside the component so polling stays pure. */
const deadlineIn = (ms: number) => Date.now() + ms;
const before = (deadline: number) => Date.now() < deadline;

function formatDate(value?: number | string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function toMs(value?: number | string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function BillingDashboardPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [live, setLive] = useState<LiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState<Tier | "undo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pollAbort = useRef<AbortController | null>(null);
  const [confirm, setConfirm] = useState<"monthly" | "yearly" | "lifetime" | null>(null);

  /**
   * Initial load. If the customer just returned from the Dodo portal
   * (?from=portal), poll briefly so a cancel / card update / plan change made
   * there shows up before they start reading, then strip the marker so a
   * refresh doesn't poll again.
   */
  async function initLoad() {
    const initial = await loadUserData();
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "portal") return;

    setSuccessMessage("Syncing your latest billing changes…");
    const liveBefore = initial ? await fetchLive() : null;
    const landed = await pollUntil(
      async (u) => {
        if (!u) return false;
        if (u.subscriptionStatus !== initial?.subscriptionStatus || u.tier !== initial?.tier) return true;
        const now = await fetchLive();
        return (
          !!now &&
          (now.cancelAtNextBillingDate !== liveBefore?.cancelAtNextBillingDate ||
            now.scheduledChange?.tier !== liveBefore?.scheduledChange?.tier)
        );
      },
      { timeoutMs: 15000, intervalMs: 2500 }
    );
    await loadLive();
    setSuccessMessage(landed ? "Your account is up to date." : "All set — if anything looks off, hit Refresh.");
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
  }

  async function fetchLive(): Promise<LiveSubscription | null> {
    try {
      const resp = await fetch("/api/dodo/subscription", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      return resp.ok && data?.success ? (data.subscription as LiveSubscription | null) : null;
    } catch {
      return null;
    }
  }

  async function loadLive() {
    const next = await fetchLive();
    setLive(next);
    return next;
  }

  /** Load the license row (and live state). Callers own any spinner state. */
  async function loadUserData() {
    try {
      const resp = await fetch("/api/user-data", { headers: { "Content-Type": "application/json" } });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setUserData(data.userData);
        // Live Dodo state only matters for recurring solo plans.
        const tier = data.userData?.tier;
        if (data.userData?.paid && (tier === "monthly" || tier === "yearly")) {
          await loadLive();
        } else {
          setLive(null);
        }
        return data.userData as UserData;
      }
      if (resp.status === 404) {
        // No license row — they haven't bought yet.
        setUserData(null);
        return null;
      }
      throw new Error(data?.error || "Failed to load billing details");
    } catch (e) {
      setError(errorText(e, "Something went wrong loading your billing details."));
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Poll /api/user-data until `predicate` passes or `timeoutMs` elapses.
   * Used after state-changing actions so the page reflects the webhook's
   * write without a manual refresh.
   */
  async function pollUntil(
    predicate: (u: UserData | null) => boolean | Promise<boolean>,
    { timeoutMs = 20000, intervalMs = 2000 } = {}
  ): Promise<boolean> {
    pollAbort.current?.abort();
    const controller = new AbortController();
    pollAbort.current = controller;
    const deadline = deadlineIn(timeoutMs);
    while (before(deadline)) {
      if (controller.signal.aborted) return false;
      try {
        const resp = await fetch("/api/user-data", {
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          setUserData(data.userData);
          if (await predicate(data.userData)) return true;
        }
      } catch {
        // Swallow polling errors — retry on the next tick.
      }
      await sleep(intervalMs);
    }
    return false;
  }

  /** Poll live Dodo state (for scheduled changes the webhook doesn't record). */
  async function pollLiveUntil(predicate: (s: LiveSubscription | null) => boolean, timeoutMs = 12000) {
    const deadline = deadlineIn(timeoutMs);
    while (before(deadline)) {
      const next = await loadLive();
      if (predicate(next)) return true;
      await sleep(2000);
    }
    return false;
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    await loadUserData();
    setRefreshing(false);
  }

  async function handleManageSubscription() {
    if (!userData?.email) return;
    try {
      setPortalLoading(true);
      setError(null);
      const resp = await fetch("/api/dodo/portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userData.email }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.link) {
        throw new Error(data?.error || "Could not open the billing portal. Please refresh and try again.");
      }
      window.location.assign(data.link);
    } catch (e) {
      setError(errorText(e, "Failed to open billing portal."));
      setPortalLoading(false);
    }
  }

  async function handleLifetimeUpgrade(currentTier: Tier) {
    if (!userData?.email) return;
    // Lifetime is a one-time product, so it needs a fresh checkout. Once the
    // payment lands, the webhook cancels the old subscription server-side so
    // the customer is never charged again for it. (Confirmed in the dialog.)
    try {
      setPlanLoading("lifetime");
      setError(null);
      setSuccessMessage(null);
      const fullName =
        user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || userData.name || undefined;
      const data = await createCheckout(userId!, {
        tier: "lifetime", email: userData.email,
        ...(fullName ? { name: fullName } : {}),
        metadata: { upgrade_from: currentTier },
      });
      window.location.assign(data.checkout_url);
    } catch (e) {
      setError(errorText(e, "Failed to start upgrade checkout."));
      setPlanLoading(null);
    }
  }

  async function handleChangePlan(currentTier: Tier, target: "monthly" | "yearly", renewsOn: string) {
    if (!userData?.email) return;
    const info = TIER_LABELS[target];
    // Confirmed in the dialog before we get here.

    try {
      setPlanLoading(target);
      setError(null);
      setSuccessMessage(null);
      const resp = await fetch("/api/dodo/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: target, email: userData.email }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) throw new Error(data?.error || "Failed to change plan.");

      if (data.scheduled) {
        setSuccessMessage("Scheduling your switch to Monthly…");
        const landed = await pollLiveUntil((s) => s?.scheduledChange?.tier === target);
        setSuccessMessage(
          landed
            ? `Done. You'll move to Monthly on ${renewsOn}.`
            : "Switch to Monthly requested. It may take a moment to appear here — hit Refresh if you don't see it shortly."
        );
      } else {
        setSuccessMessage(`Switching to ${info.name}… this updates in a few seconds.`);
        const landed = await pollUntil((u) => u?.tier === target, { timeoutMs: 25000, intervalMs: 2000 });
        await loadLive();
        setSuccessMessage(
          landed
            ? `You're now on the ${info.name} plan.`
            : "Plan change submitted. It may take a moment longer to appear here — hit Refresh if you don't see it shortly."
        );
      }
    } catch (e) {
      setError(errorText(e, "Failed to change plan."));
    } finally {
      setPlanLoading(null);
    }
  }

  async function handleUndoScheduledChange(currentTier: Tier) {
    try {
      setPlanLoading("undo");
      setError(null);
      setSuccessMessage(null);
      const resp = await fetch("/api/dodo/subscription", { method: "DELETE" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) throw new Error(data?.error || "Could not cancel the scheduled change.");
      await pollLiveUntil((s) => !s?.scheduledChange);
      setSuccessMessage(`Scheduled change canceled. You'll stay on ${TIER_LABELS[currentTier].name}.`);
    } catch (e) {
      setError(errorText(e, "Could not cancel the scheduled change."));
    } finally {
      setPlanLoading(null);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/sign-in?redirect_url=/account/billing");
      return;
    }
    // initLoad only sets state after awaiting the network, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  // Cancel any in-flight poll on unmount so we don't setState after it.
  useEffect(() => () => pollAbort.current?.abort(), []);

  /* -------------------------------- Loading ------------------------------- */
  if (loading) {
    return (
      <AccountMain>
        <AccountHeader title="Plan &" accent="billing" description="Your Buckets plan, renewals, payment method and invoices in one place." />
        <div aria-busy="true" aria-label="Loading billing" className="mt-8 space-y-5">
          <div className="rounded-3xl bg-[hsl(var(--acct-hero))] p-6 sm:p-8">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="mt-4 h-9 w-56 bg-white/10" />
            <Skeleton className="mt-6 h-12 w-32 bg-white/10" />
            <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 bg-white/10" />)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] rounded-2xl" />)}
          </div>
        </div>
      </AccountMain>
    );
  }

  /* ------------------------------ Not a customer -------------------------- */
  if (!userData?.paid) {
    return (
      <AccountMain>
        <AccountHeader title="Plan &" accent="billing" description="Pick a plan to get started — every plan unlocks the full Buckets app." />
        <div className="mt-8 space-y-5">
          <NoticeStack>
            {error && (
              <Notice key="error" tone="danger" icon={AlertTriangle} title="We couldn't load your billing details" action={
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")} />Try again</Button>
              }>
                {error}
              </Notice>
            )}
          </NoticeStack>
          <EmptyState
            icon={Receipt}
            title="No active plan yet"
            actions={<>
              <Link href="/pricing" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>See plans &amp; pricing <ArrowRight className="h-4 w-4" /></Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={buttonVariants({ variant: "outline", size: "lg" })}>Already paid? Contact us</a>
            </>}
          >
            You&apos;re signed in but haven&apos;t picked a plan. Every plan unlocks the full Buckets app on up to two machines.
          </EmptyState>
        </div>
      </AccountMain>
    );
  }

  /* --------------------------------- Customer ----------------------------- */
  // Paid rows without a tier are early-access customers from before plans
  // existed: perpetual access like Lifetime, but they never bought the $99
  // Lifetime product, so don't show them its price.
  const isEarly = !userData.tier || (userData.tier === "lifetime" && userData.productId === "legacy");
  const tier = (userData.tier as Tier) || "lifetime";
  const isTeamMember = tier === "team" && !!userData.teamOwner && userData.teamOwner.toLowerCase() !== userData.email.toLowerCase();
  const tierInfo = isEarly
    ? { name: "Early Access", price: "", cadence: "Early supporter", blurb: "Yours for good" }
    : tier === "team"
      // Owners see what their Team product actually charges per seat (teams
      // on a retired product keep their rate); members don't pay, and an
      // unknown product shows no price rather than a guess.
      // `null` = unknown product (no guess); not reported = list price.
      ? isTeamMember
        ? { ...TIER_LABELS.team, price: "", cadence: "Seat provided by your team" }
        : typeof userData.teamSeatPriceUsd === "number"
          ? { ...TIER_LABELS.team, price: `$${userData.teamSeatPriceUsd}` }
          : userData.teamSeatPriceUsd === null
            ? { ...TIER_LABELS.team, price: "", cadence: "Billed per seat, yearly" }
            : TIER_LABELS.team
      : TIER_LABELS[tier] || TIER_LABELS.lifetime;
  const isLifetime = tier === "lifetime";
  const isTeam = tier === "team";
  const isRecurringSolo = tier === "monthly" || tier === "yearly";
  const isCanceled = userData.subscriptionStatus === "canceled";
  const isPastDue = userData.subscriptionStatus === "past_due";

  const periodEnd = live?.nextBillingDate ?? userData.validUntil ?? null;
  const periodEndLabel = formatDate(periodEnd);
  const cancelScheduled = !isCanceled && !!live?.cancelAtNextBillingDate;
  const scheduled = live?.scheduledChange ?? null;
  const scheduledLabel = scheduled ? formatDate(scheduled.effectiveAt ?? periodEnd) : null;

  // Plan changes only make sense on a live, renewing solo subscription.
  // Past-due accounts fix their payment method first (portal), then change plan.
  const canChangePlan = isRecurringSolo && !isCanceled && !isPastDue && !cancelScheduled && !userData.revoked;
  const busy = planLoading !== null;

  const nextCharge =
    isRecurringSolo && !isCanceled && !cancelScheduled
      ? TIER_LABELS[scheduled && scheduled.tier !== tier ? scheduled.tier : tier]
      : null;
  const devicesUsed = userData.machines?.length || 0;
  const devicesLimit = userData.licenseCount || 2;

  const statusBadge = userData.revoked
    ? <StatusBadge tone="hero-danger" icon={XCircle}>Revoked</StatusBadge>
    : isLifetime
      ? <StatusBadge tone="hero-brand" icon={InfinityIcon}>{isEarly ? "Early supporter" : "Owned forever"}</StatusBadge>
      : isPastDue
        ? <StatusBadge tone="hero-warning" icon={AlertTriangle}>Payment due</StatusBadge>
        : isCanceled
          ? <StatusBadge tone="hero-neutral" icon={XCircle}>Canceled</StatusBadge>
          : cancelScheduled
            ? <StatusBadge tone="hero-neutral" icon={CalendarClock}>Ends {periodEndLabel}</StatusBadge>
            : userData.subscriptionStatus === "active"
              ? <StatusBadge tone="hero-success" dot>{isTeamMember ? "Active seat" : "Active · auto-renews"}</StatusBadge>
              : <StatusBadge tone="hero-neutral">Pending</StatusBadge>;

  const confirmCopy = confirm && {
    yearly: {
      title: "Upgrade to Yearly?",
      body: "It takes effect now, with a credit for the unused part of your current month.",
      cta: "Upgrade now",
      icon: Sparkles,
      rows: [["Due today", "Prorated difference"], ["Then", "$49 every year"]] as Array<[string, string]>,
    },
    monthly: {
      title: "Switch to Monthly at renewal?",
      body: "You can undo this any time before the switch.",
      cta: "Schedule switch",
      icon: CalendarClock,
      rows: [["Due today", "Nothing"], ["Yearly until", periodEndLabel], ["Then", "$5 every month"]] as Array<[string, string]>,
    },
    lifetime: {
      title: "Upgrade to Lifetime?",
      body: `You'll finish payment on our secure checkout. Your ${TIER_LABELS[tier].name} subscription is canceled automatically once the payment is confirmed, so you won't be billed for it again.`,
      cta: "Continue to checkout",
      icon: InfinityIcon,
      rows: [["Due at checkout", "$99 once"], ["Renewals", "None, ever"]] as Array<[string, string]>,
    },
  }[confirm];

  async function runConfirm() {
    const target = confirm;
    if (!target) return;
    setConfirm(null);
    if (target === "lifetime") await handleLifetimeUpgrade(tier);
    else await handleChangePlan(tier, target, periodEndLabel);
  }

  return (
    <AccountMain>
      <AccountHeader
        title="Plan &"
        accent="billing"
        description={isLifetime
          ? "Your license, devices and receipts. Nothing to renew, nothing more to buy."
          : isTeamMember
            ? "Your seat, license key and devices. Your team owner handles billing."
            : "Your Buckets plan, renewals, payment method and invoices in one place."}
      >
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || busy} aria-label="Refresh billing status">
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")} />Refresh
        </Button>
      </AccountHeader>

      {/* Notices */}
      <div className="mt-8">
        <NoticeStack>
          {error && <Notice key="error" tone="danger" icon={AlertTriangle} title="Something needs attention" onDismiss={() => setError(null)}>{error}</Notice>}
          {successMessage && <Notice key="success" tone="success" icon={CheckCircle2} title={successMessage} onDismiss={() => setSuccessMessage(null)} />}
          {isTeamMember && (
            <Notice key="member" tone="brand" icon={Users} title="Your seat is part of a team plan">
              Billing is handled by <span className="font-medium text-foreground">{userData.teamOwner}</span>. Ask them to change seats or plans.
            </Notice>
          )}
          {isPastDue && (
            <Notice key="past-due" tone="warning" icon={AlertTriangle} title="Your last payment didn't go through"
              action={
                <Button size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CreditCard className="mr-1.5 h-3.5 w-3.5" />}Update payment
                </Button>
              }
            >
              Update your payment method in the billing portal to keep your plan active.
              {userData.gracePeriodUntil && <> Access continues until {formatDate(userData.gracePeriodUntil)}.</>}
            </Notice>
          )}
          {cancelScheduled && (
            <Notice key="ending" tone="neutral" icon={CalendarClock} title={`Your plan ends on ${periodEndLabel}`}
              action={
                <Button size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}Resume
                </Button>
              }
            >
              Cancellation is scheduled, so you won&apos;t be charged again. You keep full access until then — resume any time from the billing portal.
            </Notice>
          )}
          {isCanceled && !isLifetime && (
            <Notice key="canceled" tone="neutral" icon={XCircle} title="Subscription canceled"
              action={<Link href="/pricing" className={buttonVariants({ size: "sm" })}>Choose a plan</Link>}
            >
              {userData.validUntil ? <>You keep access until {formatDate(userData.validUntil)}.</> : <>Access has ended.</>} Your license key stays the same if you subscribe again.
            </Notice>
          )}
          {scheduled && scheduled.tier !== tier && !cancelScheduled && (
            <Notice key="scheduled" tone="brand" icon={CalendarClock}
              title={`Switching to ${TIER_LABELS[scheduled.tier].name} on ${scheduledLabel}`}
              action={
                <Button size="sm" variant="outline" onClick={() => handleUndoScheduledChange(tier)} disabled={busy}>
                  {planLoading === "undo" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}
                  Keep {tierInfo.name}
                </Button>
              }
            >
              You stay on {tierInfo.name} until then, and you&apos;ll be billed {TIER_LABELS[scheduled.tier].price} {TIER_LABELS[scheduled.tier].cadence} after.
            </Notice>
          )}
        </NoticeStack>
      </div>

      {/* Plan hero */}
      <section
        aria-labelledby="current-plan"
        className="relative mt-6 overflow-hidden rounded-3xl bg-[hsl(var(--acct-hero))] text-[hsl(var(--acct-hero-fg))] shadow-[0_30px_60px_-30px_hsl(var(--acct-hero)/0.7)] dark:ring-1 dark:ring-white/10"
      >
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-72 w-96 rounded-full bg-[radial-gradient(closest-side,hsl(var(--acct-accent)/0.45),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(0_0%_100%/0.04),transparent_40%)]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-12">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <p id="current-plan" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Current plan</p>
              {statusBadge}
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
              Buckets <span className="acct-hero-accent">{tierInfo.name}</span>
            </h2>
            {isEarly ? (
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
                Thanks for backing Buckets early — every feature and every future update, yours for good.
              </p>
            ) : (
              <p className="mt-5 flex items-baseline gap-1.5">
                {tierInfo.price && <span className="text-5xl font-semibold tracking-[-0.04em]">{tierInfo.price}</span>}
                <span className="text-sm text-white/60">{tierInfo.cadence}</span>
              </p>
            )}
            <div className="mt-auto hidden pt-8 lg:block">
              <Link href="/downloads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white">
                License &amp; downloads <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:border-l lg:border-white/10 lg:pl-12">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <Fact
                onDark
                label={isLifetime ? "Renewal" : isCanceled || cancelScheduled ? "Access until" : isPastDue ? "Payment due" : isTeamMember ? "Team renews" : "Renews on"}
                hint={isLifetime ? null : relativeDays(toMs(periodEnd))}
              >
                {isLifetime ? "Never — yours for good" : periodEndLabel}
              </Fact>
              <Fact onDark label="Next charge" hint={nextCharge && periodEnd ? periodEndLabel : null}>
                {nextCharge
                  ? <>{nextCharge.price} <span className="text-white/60">{nextCharge.cadence}</span></>
                  : isTeam
                    ? <span className="text-white/60">{isTeamMember ? "Paid by your team" : "See the Team page"}</span>
                    : <span className="text-white/60">None</span>}
              </Fact>
              <Fact onDark label="Billing email"><span className="break-all">{userData.email}</span></Fact>
              <Fact onDark label="Devices" hint={devicesUsed >= devicesLimit ? "All activations in use" : `${devicesLimit - devicesUsed} activation${devicesLimit - devicesUsed === 1 ? "" : "s"} left`}>
                <span className="flex items-center gap-3">
                  <span className="shrink-0">{devicesUsed} of {devicesLimit}</span>
                  <Meter onDark used={devicesUsed} total={devicesLimit} label={`${devicesUsed} of ${devicesLimit} devices activated`} className="w-full max-w-[9rem]" />
                </span>
              </Fact>
            </dl>
            {userData.key && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">License key</p>
                <CopyField onDark value={userData.key} label="Copy license key" className="mt-1.5" />
              </div>
            )}
            {!isLifetime && userData.subscriptionId && !isTeamMember && (
              <p className="truncate text-xs text-white/45">Subscription <span className="font-mono">{userData.subscriptionId}</span></p>
            )}
            <Link href="/downloads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white lg:hidden">
              License &amp; downloads <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isTeamMember ? (
          <ActionTile icon={Users} title="Billing by your team" description={`Managed by ${userData.teamOwner}`} disabled />
        ) : isTeam ? (
          <ActionTile
            icon={Users}
            title="Team seats & billing"
            description="Members, seats, card and invoices"
            href="/account/team"
            trailing={<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
          />
        ) : isLifetime ? (
          <ActionTile
            icon={Download}
            title="Download Buckets"
            description="Mac, Windows and Linux"
            href="/downloads"
            trailing={<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
          />
        ) : (
          <ActionTile
            icon={CreditCard}
            title="Payment & renewal"
            description="Card, invoices, cancel or resume"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            busy={portalLoading}
            trailing={portalLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
              : <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />}
          />
        )}
        <ActionTile
          icon={Receipt}
          title="Invoices & receipts"
          description="Every purchase on this account"
          href="/account/invoices"
          trailing={<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
        />
        {isLifetime || isTeamMember ? (
          <ActionTile
            icon={Users}
            title={isTeamMember ? "Your team" : "Team seats"}
            description={isTeamMember ? "See your seat details" : "Start or manage company-owned seats"}
            href="/account/team"
            trailing={<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
          />
        ) : (
          <ActionTile
            icon={Download}
            title="Download Buckets"
            description="Mac, Windows and Linux"
            href="/downloads"
            trailing={<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
          />
        )}
      </div>

      {/* Change plan */}
      {canChangePlan && (
        <section aria-labelledby="change-plan" className="mt-12">
          <SectionTitle
            id="change-plan"
            title="Change plan"
            description="Upgrades apply right away with a credit for unused time. Downgrades start at your next renewal. You're never billed twice."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {PLAN_ORDER.map((opt) => {
              const info = TIER_LABELS[opt];
              const isCurrent = opt === tier;
              const isScheduled = scheduled?.tier === opt && !isCurrent;
              const direction = RANK[opt] > RANK[tier as SoloTier] ? "up" : "down";
              return (
                <Panel
                  as="div"
                  key={opt}
                  className={cn(
                    "relative flex flex-col p-6 transition-all duration-300",
                    isCurrent
                      ? "border-[hsl(var(--acct-accent)/0.55)] ring-1 ring-[hsl(var(--acct-accent)/0.35)]"
                      : "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.35)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{info.name}</p>
                    {isCurrent && <StatusBadge tone="brand" icon={Check}>Current</StatusBadge>}
                    {isScheduled && <StatusBadge tone="neutral" icon={CalendarClock}>From {scheduledLabel}</StatusBadge>}
                    {!isCurrent && !isScheduled && opt === "lifetime" && <StatusBadge tone="brand" icon={Sparkles}>Best value</StatusBadge>}
                  </div>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-semibold tracking-[-0.04em]">{info.price}</span>
                    <span className="text-sm text-muted-foreground">{info.cadence}</span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{info.blurb}</p>
                  <p className="mt-1 flex-1 text-xs font-medium text-[hsl(var(--acct-accent-ink))]">{PERKS[opt]}</p>
                  {isCurrent ? (
                    <Button variant="outline" className="mt-6 h-11 w-full" disabled>Current plan</Button>
                  ) : isScheduled ? (
                    <Button variant="outline" className="mt-6 h-11 w-full" disabled>Scheduled</Button>
                  ) : (
                    <Button
                      className="mt-6 h-11 w-full"
                      variant={direction === "up" ? "default" : "outline"}
                      disabled={busy}
                      onClick={() => setConfirm(opt)}
                    >
                      {planLoading === opt && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {direction === "up" ? `Upgrade to ${info.name}` : "Switch at renewal"}
                    </Button>
                  )}
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* Lifetime note */}
      {isLifetime && (
        <Panel className="mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
              <InfinityIcon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold">{isEarly ? "Early Access" : "Lifetime access"}</h2>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                {isEarly
                  ? "Every Buckets Pro feature for good as an early supporter. No renewals, nothing to upgrade."
                  : "You own Buckets Pro for good. No renewals, no recurring charges, and every future update is included."}
              </p>
            </div>
          </div>
          {userData.dodoCustomerId ? (
            <Button variant="outline" className="shrink-0" onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}Receipts
            </Button>
          ) : (
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Buckets%20receipt`} className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
              <Receipt className="mr-2 h-4 w-4" />Request a receipt
            </a>
          )}
        </Panel>
      )}

      {/* Renewal settings */}
      {isRecurringSolo && !isCanceled && !userData.revoked && (
        <Panel className="mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold">{cancelScheduled ? "Renewal is off" : "Auto-renewal is on"}</h2>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
              {cancelScheduled
                ? <>Your plan ends on {periodEndLabel}. Resume it in the billing portal to keep Buckets running without a gap.</>
                : <>Cancel any time in the billing portal and keep access until {periodEndLabel}.</>}
            </p>
          </div>
          <Button variant={cancelScheduled ? "outline" : "ghost"} className={cn("shrink-0", !cancelScheduled && "text-muted-foreground hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300")} onClick={handleManageSubscription} disabled={portalLoading}>
            {cancelScheduled ? <><RotateCcw className="mr-2 h-4 w-4" />Resume subscription</> : "Cancel subscription"}
          </Button>
        </Panel>
      )}

      {/* Help */}
      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[hsl(var(--acct-accent-ink))]" aria-hidden />
          Payments by Dodo Payments · questions about a charge or a refund within 30 days? We&apos;ll sort it out fast.
        </span>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:text-[hsl(var(--acct-accent-ink))]">
          <LifeBuoy className="h-4 w-4" aria-hidden />{SUPPORT_EMAIL}
        </a>
      </div>

      <Dialog open={!!confirmCopy} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <DialogContent className="theme-scope rounded-3xl border-border bg-card p-0 sm:max-w-md sm:rounded-3xl">
          {confirmCopy && (
            <div className="p-6">
              <DialogHeader className="space-y-0 text-left">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
                  <confirmCopy.icon className="h-5 w-5" />
                </span>
                <DialogTitle className="text-xl tracking-tight">{confirmCopy.title}</DialogTitle>
                <DialogDescription className="pt-1.5 text-sm leading-6">{confirmCopy.body}</DialogDescription>
              </DialogHeader>
              <dl className="mt-5 divide-y divide-border rounded-2xl border border-border bg-muted/40 text-sm">
                {confirmCopy.rows.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>Not now</Button>
                <Button onClick={() => void runConfirm()}>{confirmCopy.cta}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AccountMain>
  );
}
