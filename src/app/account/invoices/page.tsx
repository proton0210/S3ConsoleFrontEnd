"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Building2, Loader2, Lock, Mail, Receipt, RefreshCw, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountHeader, AccountMain, EmptyState, Notice, NoticeStack, Panel, Skeleton, StatusBadge } from "@/components/account/kit";
import { isInvoicePortalUrl, type InvoiceAccount, type InvoiceScope } from "@/lib/invoice-access";

export default function InvoicesPage() {
  const { user } = useUser();
  return <InvoiceHistory key={user?.id || "signed-out"} />;
}
function InvoiceHistory() {
  const { isLoaded, isSignedIn } = useUser();
  const [accounts, setAccounts] = useState<InvoiceAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<InvoiceScope | null>(null);
  const mounted = useRef(true);
  const portalInFlight = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/billing/invoices", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(body.accounts)) throw new Error(body.error || "Could not load invoice access.");
      if (mounted.current && request === generation.current) setAccounts(body.accounts);
    } catch (failure) {
      if (mounted.current && request === generation.current) {
        setAccounts(null);
        setError(failure instanceof Error ? failure.message : "Could not load invoice access.");
      }
    } finally { if (mounted.current && request === generation.current) setLoading(false); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    if (isLoaded && isSignedIn) queueMicrotask(() => { if (!cancelled) void refresh(); });
    const onReturn = () => { if (isLoaded && isSignedIn) void refresh(); };
    window.addEventListener("pageshow", onReturn);
    return () => { cancelled = true; mounted.current = false; window.removeEventListener("pageshow", onReturn); };
  }, [isLoaded, isSignedIn, refresh]);
  async function openHistory(scope: InvoiceScope) {
    if (portalInFlight.current) return;
    portalInFlight.current = true; setOpening(scope); setError(null);
    try {
      const response = await fetch("/api/dodo/portal-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, returnTo: "invoices" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !isInvoicePortalUrl(body.link)) throw new Error(body.error || "Could not open invoice history. Please retry.");
      if (mounted.current) window.location.assign(body.link);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "Could not open invoice history.");
    } finally {
      portalInFlight.current = false;
      if (mounted.current) setOpening(null);
    }
  }
  const SCOPE_ICON = { personal: User, team: Users } as const;
  return <AccountMain>
    <AccountHeader
      title="Invoices &"
      accent="receipts"
      description="Receipts for your Buckets purchases, including Lifetime and past subscriptions. Dodo Payments keeps the official invoice history."
    >
      {isSignedIn && (
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading || opening !== null} aria-label="Refresh invoice access">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      )}
    </AccountHeader>

    {!isLoaded || (isSignedIn && loading) ? (
      <div aria-busy="true" aria-label="Loading invoice access" className="mt-8 grid gap-5 md:grid-cols-2">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    ) : !isSignedIn ? (
      <div className="mt-8">
        <EmptyState icon={Lock} title="Sign in to view your invoices" actions={
          <Button asChild size="lg"><Link href="/sign-in?redirect_url=%2Faccount%2Finvoices">Sign in</Link></Button>
        }>
          Invoices are tied to the account that made the purchase.
        </EmptyState>
      </div>
    ) : <>
      <div className="mt-8">
        <NoticeStack>
          {error && (
            <Notice key="error" tone="danger" icon={AlertTriangle} title="We couldn't open your invoices" action={
              <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={opening !== null}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry</Button>
            }>
              {error}
            </Notice>
          )}
        </NoticeStack>
      </div>

      {accounts?.length === 0 && (
        <EmptyState icon={Receipt} title="No billing records yet" actions={
          <>
            <Button asChild size="lg"><Link href="/pricing">View plans</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="mailto:buckets@serverlesscreed.com?subject=Buckets%20invoice">Contact support</a></Button>
          </>
        }>
          A trial has no invoice. If you purchased with another email, sign in with that account or contact support.
        </EmptyState>
      )}

      {!!accounts?.length && (
        <div className="grid gap-5 md:grid-cols-2">
          {accounts.map(account => {
            const Icon = SCOPE_ICON[account.scope] ?? Building2;
            return (
              <Panel key={account.scope} className="flex flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {account.status === "available"
                    ? <StatusBadge tone="success" dot>Available</StatusBadge>
                    : account.status === "managed_by_owner"
                      ? <StatusBadge tone="neutral">Team owner only</StatusBadge>
                      : <StatusBadge tone="neutral">Not linked</StatusBadge>}
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-tight">{account.label}</h2>
                {account.status === "available" ? (
                  <>
                    <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">View and download invoices in your secure billing account. Past purchases stay available after a subscription ends.</p>
                    <Button className="mt-6 h-11 w-full" disabled={opening !== null} onClick={() => void openHistory(account.scope)}>
                      {opening === account.scope
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening…</>
                        : <>Open invoice history<ArrowUpRight className="ml-1.5 h-4 w-4" /></>}
                    </Button>
                  </>
                ) : account.status === "managed_by_owner" ? (
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Team invoices and payment details are available to the team owner. Ask your owner for a copy; your team seat does not grant billing access.</p>
                ) : (
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">No online billing record is linked yet. Older licenses may not have Dodo invoices. Contact support if you need a receipt for an earlier purchase.</p>
                )}
              </Panel>
            );
          })}
        </div>
      )}
      {!!accounts?.some(account => account.status === "available") && (
        <p className="mt-5 max-w-3xl text-xs leading-5 text-muted-foreground">Dodo&apos;s portal shows the billing account&apos;s history and payment controls. It may include other purchases made under the same billing account; these links do not filter its invoices by product.</p>
      )}
    </>}

    <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Need help with a receipt or a company invoice?</span>
      <a href="mailto:buckets@serverlesscreed.com?subject=Buckets%20invoice" className="inline-flex items-center gap-2 font-medium text-foreground hover:text-[hsl(var(--acct-accent-ink))]"><Mail className="h-4 w-4" aria-hidden />buckets@serverlesscreed.com</a>
    </div>
  </AccountMain>;
}
