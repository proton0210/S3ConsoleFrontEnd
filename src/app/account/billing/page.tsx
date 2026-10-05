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
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import Footer from "@/components/sections/footer";
import { cn } from "@/lib/utils";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";
import {
  FaArrowDown,
  FaArrowUp,
  FaBan,
  FaCalendarAlt,
  FaCheckCircle,
  FaCrown,
  FaEnvelope,
  FaExclamationTriangle,
  FaInfinity,
  FaInfoCircle,
  FaReceipt,
  FaSpinner,
  FaSync,
  FaUndo,
  FaUsers,
} from "react-icons/fa";

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

/* ------------------------------------------------------------------ */
/* Small themed building blocks                                        */
/* ------------------------------------------------------------------ */

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const PILL_TONES: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-800 ring-sky-500/25 dark:text-sky-300",
  neutral: "bg-foreground/[0.05] text-muted-foreground ring-border",
  brand: "bg-primary/10 text-primary ring-primary/25",
};

const NOTICE_TONES: Record<Tone, { box: string; icon: string }> = {
  success: {
    box: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-900 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    box: "border-amber-500/30 bg-amber-500/[0.08] text-amber-900 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    box: "border-red-500/25 bg-red-500/[0.07] text-red-800 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
  },
  info: {
    box: "border-sky-500/25 bg-sky-500/[0.07] text-sky-900 dark:text-sky-200",
    icon: "text-sky-600 dark:text-sky-400",
  },
  neutral: { box: "surface text-foreground", icon: "text-muted-foreground" },
  brand: {
    box: "border-primary/30 bg-primary/[0.07] text-foreground",
    icon: "text-primary",
  },
};

function Pill({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        PILL_TONES[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function Notice({
  tone,
  icon,
  title,
  children,
  action,
}: {
  tone: Tone;
  icon: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const t = NOTICE_TONES[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm", t.box)}>
      <span className={cn("mt-0.5 flex-shrink-0", t.icon)}>{icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

function FieldLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <dt className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {icon}
      {children}
    </dt>
  );
}

function CardTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </h3>
  );
}

function StatusBadge({
  tier,
  status,
  revoked,
  cancelsOn,
}: {
  tier?: Tier;
  status?: SubStatus;
  revoked?: boolean;
  cancelsOn?: string | null;
}) {
  if (revoked) return <Pill tone="danger" icon={<FaBan className="h-3 w-3" />}>Revoked</Pill>;
  if (tier === "lifetime")
    return <Pill tone="brand" icon={<FaInfinity className="h-3 w-3" />}>Active · never expires</Pill>;
  if (status === "past_due")
    return <Pill tone="warning" icon={<FaExclamationTriangle className="h-3 w-3" />}>Payment past due</Pill>;
  if (status === "canceled") return <Pill tone="neutral" icon={<FaBan className="h-3 w-3" />}>Canceled</Pill>;
  if (status === "active" && cancelsOn)
    return <Pill tone="warning" icon={<FaCalendarAlt className="h-3 w-3" />}>Cancels {cancelsOn}</Pill>;
  if (status === "active") return <Pill tone="success" icon={<FaCheckCircle className="h-3 w-3" />}>Active</Pill>;
  return <Pill tone="neutral">Pending</Pill>;
}

/** Page chrome shared by every state: premium theme, header, glow, footer. */
function BillingShell({ children }: { children: ReactNode }) {
  return (
    <div className="theme-scope min-h-screen">
      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-70" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
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
    // the customer is never charged again for it.
    const ok = window.confirm(
      `Upgrade to Lifetime for ${TIER_LABELS.lifetime.price} (one-time)?\n\n` +
        `You'll finish payment on our secure checkout. Your current ${TIER_LABELS[currentTier].name} ` +
        `subscription is canceled automatically once the payment is confirmed, so you won't be billed for it again.`
    );
    if (!ok) return;
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
    const isDowngrade = currentTier === "yearly" && target === "monthly";
    const ok = window.confirm(
      isDowngrade
        ? `Switch to the Monthly plan (${info.price} ${info.cadence})?\n\n` +
            `You keep Yearly until ${renewsOn}. After that you'll be billed ${info.price} each month instead of renewing yearly. ` +
            `You can undo this any time before then.`
        : `Upgrade to the Yearly plan (${info.price} ${info.cadence})?\n\n` +
            `It takes effect now. You'll be charged for the year today, minus a credit for the unused part of your current month.`
    );
    if (!ok) return;

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
      <BillingShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <FaSpinner className="h-7 w-7 animate-spin text-primary" aria-label="Loading billing" />
        </div>
      </BillingShell>
    );
  }

  /* ------------------------------ Not a customer -------------------------- */
  if (!userData?.paid) {
    return (
      <BillingShell>
        <div className="surface mx-auto mt-6 max-w-xl rounded-2xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
            <FaCrown className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">No active plan yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            You&apos;re signed in but haven&apos;t picked a plan. Every plan unlocks the full Buckets app on up to
            two machines.
          </p>
          <Link
            href="/pricing"
            className={cn(buttonVariants({ size: "lg" }), "mt-7 h-11 rounded-full px-7 font-semibold")}
          >
            See plans &amp; pricing
          </Link>
          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
        </div>
      </BillingShell>
    );
  }

  /* --------------------------------- Customer ----------------------------- */
  // Paid rows without a tier are early-access customers from before plans
  // existed: perpetual access like Lifetime, but they never bought the $99
  // Lifetime product, so don't show them its price.
  const isEarly = !userData.tier || (userData.tier === "lifetime" && userData.productId === "legacy");
  const tier = (userData.tier as Tier) || "lifetime";
  const tierInfo = isEarly
    ? { name: "Early Access", price: "Pro", cadence: "early supporter", blurb: "Yours for good" }
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

  return (
    <BillingShell>
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            Account
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            <span className="text-gradient">Billing &amp; plan</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Your Buckets plan, renewals, payment method and invoices in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || busy}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
        >
          <FaSync className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Notices */}
      <div className="mb-6 space-y-3 empty:hidden">
        {error && (
          <Notice tone="danger" icon={<FaExclamationTriangle className="h-4 w-4" />}>
            {error}
          </Notice>
        )}
        {successMessage && (
          <Notice tone="success" icon={<FaCheckCircle className="h-4 w-4" />}>
            {successMessage}
          </Notice>
        )}
        {isTeam && (
          <Notice tone="info" icon={<FaUsers className="h-4 w-4" />} title="You're on a Team plan">
            Seats and members are managed on the{" "}
            <Link href="/account/team" className="font-medium underline underline-offset-2">
              Team page
            </Link>
            .
          </Notice>
        )}
        {isPastDue && (
          <Notice
            tone="warning"
            icon={<FaExclamationTriangle className="h-4 w-4" />}
            title="Your last payment didn't go through"
            action={
              <Button
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="h-8 rounded-full px-3.5 text-xs font-semibold"
              >
                {portalLoading ? <FaSpinner className="h-3 w-3 animate-spin" /> : "Update payment"}
              </Button>
            }
          >
            Update your payment method in the billing portal to keep your plan active.
            {userData.gracePeriodUntil && <> Access continues until {formatDate(userData.gracePeriodUntil)}.</>}
          </Notice>
        )}
        {cancelScheduled && (
          <Notice
            tone="warning"
            icon={<FaCalendarAlt className="h-4 w-4" />}
            title={`Your plan ends on ${periodEndLabel}`}
          >
            Cancellation is scheduled, so you won&apos;t be charged again. You keep full access until then. Changed
            your mind? Resume it from the billing portal.
          </Notice>
        )}
        {isCanceled && !isLifetime && (
          <Notice tone="neutral" icon={<FaBan className="h-4 w-4" />} title="Subscription canceled">
            {userData.validUntil ? <>You keep access until {formatDate(userData.validUntil)}.</> : <>Access has ended.</>}{" "}
            <Link href="/pricing" className="font-medium text-primary underline-offset-2 hover:underline">
              Choose a plan
            </Link>{" "}
            to subscribe again.
          </Notice>
        )}
        {scheduled && scheduled.tier !== tier && !cancelScheduled && (
          <Notice
            tone="brand"
            icon={<FaArrowDown className="h-4 w-4" />}
            title={`Switching to ${TIER_LABELS[scheduled.tier].name} on ${scheduledLabel}`}
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUndoScheduledChange(tier)}
                disabled={busy}
                className="h-8 rounded-full border-border bg-transparent px-3 text-xs font-semibold hover:bg-foreground/5"
              >
                {planLoading === "undo" ? (
                  <FaSpinner className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <FaUndo className="mr-1.5 h-3 w-3" />
                )}
                Keep {tierInfo.name}
              </Button>
            }
          >
            You stay on {tierInfo.name} until then, and you&apos;ll be billed {TIER_LABELS[scheduled.tier].price}{" "}
            {TIER_LABELS[scheduled.tier].cadence} after.
          </Notice>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan summary */}
        <section className="surface self-start overflow-hidden rounded-2xl lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-6 md:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current plan · Buckets Pro
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{tierInfo.name}</h2>
                <StatusBadge
                  tier={tier}
                  status={userData.subscriptionStatus}
                  revoked={userData.revoked}
                  cancelsOn={cancelScheduled ? periodEndLabel : null}
                />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground">{tierInfo.price}</span>
                <span className="text-sm text-muted-foreground">{tierInfo.cadence}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isEarly
                  ? "Thanks for backing Buckets early — your access never expires."
                  : "List price. Your receipts in the billing portal show exactly what you were charged."}
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 sm:flex">
              {isLifetime ? (
                <FaInfinity className="h-5 w-5 text-primary" />
              ) : isTeam ? (
                <FaUsers className="h-5 w-5 text-primary" />
              ) : (
                <FaCrown className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 md:px-8">
            <div>
              <FieldLabel icon={<FaCalendarAlt className="h-3 w-3" />}>
                {isLifetime
                  ? "Renewal"
                  : isCanceled || cancelScheduled
                  ? "Access until"
                  : isPastDue
                  ? "Payment due"
                  : "Renews on"}
              </FieldLabel>
              <dd className="text-sm text-foreground">{isLifetime ? "Never — yours for good" : periodEndLabel}</dd>
            </div>

            <div>
              <FieldLabel icon={<FaReceipt className="h-3 w-3" />}>Next charge</FieldLabel>
              <dd className="text-sm text-foreground">
                {nextCharge ? (
                  <>
                    {nextCharge.price} <span className="text-muted-foreground">{nextCharge.cadence}</span>
                    {periodEnd && <span className="text-muted-foreground"> · {periodEndLabel}</span>}
                  </>
                ) : isTeam ? (
                  <span className="text-muted-foreground">See the Team page</span>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </dd>
            </div>

            <div>
              <FieldLabel icon={<FaEnvelope className="h-3 w-3" />}>Billing email</FieldLabel>
              <dd className="break-all text-sm text-foreground">{userData.email}</dd>
            </div>

            <div>
              <FieldLabel>Devices</FieldLabel>
              <dd className="text-sm text-foreground">
                <span className="font-semibold">{userData.machines?.length || 0}</span> of{" "}
                {userData.licenseCount || 2} activated
              </dd>
            </div>

            <div>
              <FieldLabel>License key</FieldLabel>
              <dd className="break-all font-mono text-xs text-foreground/80">{userData.key || "—"}</dd>
            </div>

            {!isLifetime && (
              <div>
                <FieldLabel>Subscription ID</FieldLabel>
                <dd className="break-all font-mono text-xs text-foreground/80">{userData.subscriptionId || "—"}</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-foreground/[0.02] px-6 py-4 md:px-8">
            <p className="text-xs text-muted-foreground">
              {isLifetime
                ? isEarly
                  ? "Early Access — no recurring charges."
                  : "One-time purchase — no recurring charges."
                : "Renewals are charged automatically."}{" "}
              Payments are processed securely by Dodo Payments.
            </p>
            <Link href="/downloads" className="text-xs font-semibold text-primary hover:underline">
              License &amp; devices →
            </Link>
          </div>
        </section>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Change plan */}
          {canChangePlan && (
            <section className="surface rounded-2xl p-6">
              <CardTitle icon={<FaArrowUp className="h-3.5 w-3.5" />}>Change plan</CardTitle>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Upgrades apply right away with a credit for unused time. Downgrades start at your next renewal.
              </p>
              <ul className="mt-4 space-y-2.5">
                {PLAN_ORDER.map((opt) => {
                  const info = TIER_LABELS[opt];
                  const isCurrent = opt === tier;
                  const isScheduled = scheduled?.tier === opt && !isCurrent;
                  const direction = RANK[opt] > RANK[tier as SoloTier] ? "up" : "down";
                  return (
                    <li
                      key={opt}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
                        isCurrent ? "border-primary/40 bg-primary/[0.06]" : "border-border"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          {info.name}
                          {isCurrent && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {info.price} {info.cadence} · {info.blurb}
                        </p>
                      </div>
                      {isCurrent ? null : isScheduled ? (
                        <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                          From {scheduledLabel}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={direction === "up" ? "default" : "outline"}
                          disabled={busy}
                          onClick={() =>
                            opt === "lifetime"
                              ? handleLifetimeUpgrade(tier)
                              : handleChangePlan(tier, opt, periodEndLabel)
                          }
                          className={cn(
                            "h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold",
                            direction === "down" && "border-border bg-transparent hover:bg-foreground/5"
                          )}
                        >
                          {planLoading === opt ? (
                            <FaSpinner className="h-3 w-3 animate-spin" />
                          ) : direction === "up" ? (
                            "Upgrade"
                          ) : (
                            "Downgrade"
                          )}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                You&apos;re never billed twice: plan changes update your existing subscription, and Lifetime cancels
                it automatically once paid.
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6"><h2 className="font-semibold">Invoices &amp; receipts</h2><p className="mt-2 text-sm text-muted-foreground">Find purchase history for your own billing accounts, including Lifetime and team purchases.</p><Link href="/account/invoices" className="mt-4 inline-block text-sm font-medium underline">View invoices &amp; receipts</Link></section>

          {/* Manage */}
          {!isLifetime && !isTeam && (
            <section className="surface rounded-2xl p-6">
              <CardTitle icon={<FaReceipt className="h-3.5 w-3.5" />}>Payment &amp; invoices</CardTitle>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Update your card, download invoices, or cancel or resume your subscription in Dodo&apos;s secure
                portal.
              </p>
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="mt-4 h-10 w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
              >
                {portalLoading ? (
                  <>
                    <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  "Open billing portal"
                )}
              </Button>
            </section>
          )}

          {/* Lifetime */}
          {isLifetime && (
            <section className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/[0.12] to-transparent p-6 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
              <CardTitle icon={<FaInfinity className="h-3.5 w-3.5" />}>
                {isEarly ? "Early Access" : "Lifetime access"}
              </CardTitle>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isEarly
                  ? "You have every Buckets Pro feature for good as an early supporter. No renewals, nothing to upgrade, and every future update is included."
                  : "You own Buckets Pro for good. No renewals, no recurring charges, and every future update is included."}
              </p>
              <Link href="/downloads" className={cn(buttonVariants(), "mt-4 h-10 w-full rounded-full font-semibold")}>
                Go to downloads
              </Link>
              <Link href="/account/team" className="mt-4 block text-center text-xs font-semibold text-primary hover:underline">
                Manage or start a team
              </Link>
            </section>
          )}

          {/* Help */}
          <section className="surface rounded-2xl p-6">
            <CardTitle icon={<FaInfoCircle className="h-3.5 w-3.5" />}>Need help?</CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Questions about a charge or refunds within 30 days? Email us and we&apos;ll sort it out fast.
            </p>
            <a
              href="mailto:buckets@serverlesscreed.com"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <FaEnvelope className="h-3 w-3" />
              buckets@serverlesscreed.com
            </a>
          </section>
        </div>
      </div>
    </BillingShell>
  );
}
