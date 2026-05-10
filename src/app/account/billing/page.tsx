/**
 * Billing dashboard for signed-in paid customers.
 *
 * Read-only view of the license row's billing fields (tier, status,
 * validUntil, gracePeriod) plus action buttons that delegate to:
 *   - /api/dodo/portal-session  → Dodo hosted portal (cancel, update card, invoices)
 *   - /api/dodo/create-checkout → upgrade flow (monthly→yearly, *→lifetime)
 *
 * Lifetime users see a "no recurring billing" state — no cancel/upgrade actions
 * (their tier is the top of the ladder and there's nothing to renew).
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Header from "@/components/sections/header";
import Section from "@/components/section";
import {
  FaCrown,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfinity,
  FaCalendarAlt,
  FaEnvelope,
  FaArrowUp,
  FaCog,
  FaReceipt,
  FaBan,
  FaSync,
} from "react-icons/fa";

type Tier = "monthly" | "yearly" | "lifetime";
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

const TIER_LABELS: Record<Tier, { name: string; price: string; cadence: string }> = {
  monthly: { name: "Monthly", price: "$9", cadence: "per month" },
  yearly: { name: "Yearly", price: "$49", cadence: "per year" },
  lifetime: { name: "Lifetime", price: "$99", cadence: "one-time" },
};

function formatDate(ms?: number | null): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ tier, status, revoked }: { tier?: Tier; status?: SubStatus; revoked?: boolean }) {
  if (revoked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <FaBan className="h-3 w-3" /> Revoked
      </span>
    );
  }
  if (tier === "lifetime") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
        <FaInfinity className="h-3 w-3" /> Lifetime — Active
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <FaCheckCircle className="h-3 w-3" /> Active
      </span>
    );
  }
  if (status === "past_due") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <FaExclamationTriangle className="h-3 w-3" /> Payment past due
      </span>
    );
  }
  if (status === "canceled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
        <FaBan className="h-3 w-3" /> Canceled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      Pending
    </span>
  );
}

export default function BillingDashboardPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/sign-in?redirect_url=/account/billing");
      return;
    }
    void loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  async function loadUserData(silent = false) {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const resp = await fetch("/api/user-data", {
        headers: { "Content-Type": "application/json" },
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setUserData(data.userData);
      } else if (resp.status === 404) {
        // No license row — they haven't bought yet.
        setUserData(null);
      } else {
        throw new Error(data?.error || "Failed to load billing details");
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong loading your billing details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        throw new Error(
          data?.error ||
            "Could not open the billing portal. Please refresh and try again."
        );
      }
      window.location.href = data.link;
    } catch (e: any) {
      setError(e?.message || "Failed to open billing portal.");
      setPortalLoading(false);
    }
  }

  async function handleUpgrade(tier: Tier) {
    if (!userData?.email) return;
    try {
      setUpgradeLoading(tier);
      setError(null);
      const fullName =
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        userData.name ||
        undefined;
      const resp = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          email: userData.email,
          ...(fullName ? { name: fullName } : {}),
          metadata: { upgrade_from: userData.tier || "unknown" },
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.checkout_url) {
        throw new Error(data?.error || "Failed to start upgrade checkout.");
      }
      window.location.href = data.checkout_url;
    } catch (e: any) {
      setError(e?.message || "Failed to start upgrade checkout.");
      setUpgradeLoading(null);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <Section className="py-20">
          <div className="min-h-[40vh] flex items-center justify-center">
            <FaSpinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Section>
      </>
    );
  }

  // Signed in but no paid license — show empty state with CTA to /pricing.
  if (!userData?.paid) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Section className="py-20">
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
                <FaCrown className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                No active subscription
              </h1>
              <p className="text-slate-600 mb-6">
                You're signed in but haven't purchased a plan yet. Pick a plan to
                unlock S3Console Pro on up to two machines.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 transition-colors"
              >
                See plans &amp; pricing
              </Link>
              {error && (
                <p className="mt-6 text-sm text-red-600">{error}</p>
              )}
            </div>
          </Section>
        </div>
      </>
    );
  }

  const tier = (userData.tier as Tier) || "lifetime";
  const tierInfo = TIER_LABELS[tier] || TIER_LABELS.lifetime;
  const isLifetime = tier === "lifetime";
  const isCanceled = userData.subscriptionStatus === "canceled";
  const isPastDue = userData.subscriptionStatus === "past_due";

  // Upgrade options: monthly users see yearly + lifetime; yearly users see lifetime only.
  const upgradeOptions: Tier[] =
    tier === "monthly"
      ? ["yearly", "lifetime"]
      : tier === "yearly"
      ? ["lifetime"]
      : [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Section className="py-12 md:py-16">
          {/* Page header */}
          <div className="max-w-5xl mx-auto mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              Account
            </p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Billing &amp; Subscription
                </h1>
                <p className="text-slate-600 mt-1.5">
                  Manage your S3Console Pro plan, payment method, and invoices.
                </p>
              </div>
              <button
                onClick={() => loadUserData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
                title="Refresh"
              >
                <FaSync className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-5xl mx-auto mb-6">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Past-due banner */}
          {isPastDue && (
            <div className="max-w-5xl mx-auto mb-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <FaExclamationTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Your last payment didn't go through
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Update your payment method to keep your subscription active.
                    {userData.gracePeriodUntil && (
                      <> Access continues until {formatDate(userData.gracePeriodUntil)}.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Canceled banner */}
          {isCanceled && !isLifetime && (
            <div className="max-w-5xl mx-auto mb-6">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 flex items-start gap-3">
                <FaBan className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Subscription canceled
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {userData.validUntil ? (
                      <>You keep Pro access until {formatDate(userData.validUntil)}.</>
                    ) : (
                      <>Access has ended.</>
                    )}{" "}
                    Re-subscribe any time from the pricing page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan summary — spans 2 cols */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 md:px-8 py-6 border-b border-slate-200 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Current plan
                  </p>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-900">
                      S3Console Pro · {tierInfo.name}
                    </h2>
                    <StatusBadge
                      tier={tier}
                      status={userData.subscriptionStatus}
                      revoked={userData.revoked}
                    />
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {tierInfo.price}
                    </span>
                    <span className="text-sm text-slate-500">{tierInfo.cadence}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                  {isLifetime ? (
                    <FaInfinity className="h-5 w-5 text-primary" />
                  ) : (
                    <FaCrown className="h-5 w-5 text-primary" />
                  )}
                </div>
              </div>

              <dl className="px-6 md:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    <FaEnvelope className="h-3 w-3" /> Billing email
                  </dt>
                  <dd className="text-sm text-slate-900 break-all">{userData.email}</dd>
                </div>

                <div>
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    <FaCalendarAlt className="h-3 w-3" />{" "}
                    {isLifetime
                      ? "Purchased"
                      : isCanceled
                      ? "Access until"
                      : "Renews on"}
                  </dt>
                  <dd className="text-sm text-slate-900">
                    {isLifetime ? "—" : formatDate(userData.validUntil)}
                  </dd>
                </div>

                {!isLifetime && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Subscription ID
                    </dt>
                    <dd className="text-xs font-mono text-slate-700 break-all">
                      {userData.subscriptionId || "—"}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    License key
                  </dt>
                  <dd className="text-xs font-mono text-slate-700 break-all">
                    {userData.key || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Devices
                  </dt>
                  <dd className="text-sm text-slate-900">
                    <span className="font-semibold">
                      {userData.machines?.length || 0}
                    </span>{" "}
                    of {userData.licenseCount || 2} activated
                  </dd>
                </div>
              </dl>

              <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-3 justify-between">
                <p className="text-xs text-slate-600">
                  Payments are securely processed by Dodo Payments.
                </p>
                <Link
                  href="/downloads"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View license &amp; devices →
                </Link>
              </div>
            </div>

            {/* Actions sidebar */}
            <div className="space-y-6">
              {/* Manage panel — only for subscriptions */}
              {!isLifetime && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <FaCog className="h-4 w-4 text-primary" /> Manage
                  </h3>
                  <p className="text-xs text-slate-600 mb-4">
                    Cancel, update your card, or download invoices in Dodo's
                    secure customer portal.
                  </p>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {portalLoading ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Opening…
                      </>
                    ) : (
                      <>
                        <FaReceipt className="mr-2 h-4 w-4" />
                        Open billing portal
                      </>
                    )}
                  </Button>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="h-3 w-3 text-slate-400" />
                      Cancel subscription
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="h-3 w-3 text-slate-400" />
                      Update payment method
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="h-3 w-3 text-slate-400" />
                      Download invoices
                    </li>
                  </ul>
                </div>
              )}

              {/* Upgrade panel */}
              {upgradeOptions.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <FaArrowUp className="h-4 w-4 text-primary" /> Upgrade your plan
                  </h3>
                  <p className="text-xs text-slate-700 mb-4">
                    {tier === "monthly"
                      ? "Save 54% with yearly, or pay once for lifetime access."
                      : "Skip renewals forever with a one-time lifetime purchase."}
                  </p>
                  <div className="space-y-2">
                    {upgradeOptions.map((opt) => {
                      const info = TIER_LABELS[opt];
                      return (
                        <Button
                          key={opt}
                          onClick={() => handleUpgrade(opt)}
                          disabled={upgradeLoading !== null}
                          className={`w-full justify-between ${
                            opt === "lifetime"
                              ? "bg-primary hover:bg-primary/90 text-white"
                              : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {upgradeLoading === opt ? (
                              <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                            ) : opt === "lifetime" ? (
                              <FaInfinity className="h-3.5 w-3.5" />
                            ) : (
                              <FaArrowUp className="h-3.5 w-3.5" />
                            )}
                            {info.name}
                          </span>
                          <span className="text-xs opacity-80">
                            {info.price} {info.cadence}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                    Your current plan stays active until you cancel it from the
                    billing portal — your new plan starts at checkout.
                  </p>
                </div>
              )}

              {/* Lifetime panel */}
              {isLifetime && (
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border border-violet-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <FaInfinity className="h-4 w-4 text-violet-600" /> Lifetime access
                  </h3>
                  <p className="text-xs text-slate-700 mb-4">
                    You own S3Console Pro forever. No renewals, no recurring
                    charges. All future updates are included.
                  </p>
                  <Link
                    href="/downloads"
                    className="block w-full text-center rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-semibold py-2.5 text-sm transition-colors"
                  >
                    View downloads
                  </Link>
                </div>
              )}

              {/* Help */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Need help?</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Refunds within 30 days. Reach out and we'll sort it out fast.
                </p>
                <a
                  href="mailto:vidit@serverlesscreed.com"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <FaEnvelope className="h-3 w-3" />
                  vidit@serverlesscreed.com
                </a>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
