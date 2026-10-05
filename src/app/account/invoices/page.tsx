"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
    <h1 className="text-3xl font-semibold tracking-tight">Invoices &amp; receipts</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Find receipts for your Buckets purchases, including Lifetime and past subscriptions. Dodo provides the official invoice history.</p>
    {!isLoaded || (isSignedIn && loading) ? <p role="status" className="mt-8 text-muted-foreground">Loading invoice access…</p> : !isSignedIn ?
      <div className="mt-8 rounded-2xl border border-border bg-card p-6"><p>Sign in to view your invoices.</p><Link href="/sign-in?redirect_url=%2Faccount%2Finvoices" className="mt-4 inline-block font-medium underline">Sign in</Link></div> : <>
      {error && <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => void refresh()} disabled={opening !== null}>Retry</Button></div>}
      {accounts?.length === 0 && <section className="mt-8 rounded-2xl border border-border bg-card p-6"><h2 className="font-semibold">No billing records yet</h2><p className="mt-2 text-sm text-muted-foreground">A trial has no invoice. If you purchased with another email, sign in with that account or contact support.</p><Link href="/pricing" className="mt-4 inline-block text-sm font-medium underline">View plans</Link></section>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">{accounts?.map(account => <section key={account.scope} className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">{account.label}</h2>
        {account.status === "available" ? <><p className="mt-2 text-sm leading-6 text-muted-foreground">Open your secure billing account to view and download invoices. Past purchases remain accessible after a subscription ends.</p><Button className="mt-5 w-full" disabled={opening !== null} onClick={() => void openHistory(account.scope)}>{opening === account.scope ? "Opening…" : "Open invoice history"}</Button></> : account.status === "managed_by_owner" ? <p className="mt-2 text-sm leading-6 text-muted-foreground">Team invoices and payment details are available to the team owner. Ask your owner for a copy; your team seat does not grant billing access.</p> : <p className="mt-2 text-sm leading-6 text-muted-foreground">No online billing record is linked yet. Older licenses may not have Dodo invoices. Contact support if you need a receipt for an earlier purchase.</p>}
      </section>)}</div>
      {!!accounts?.some(account => account.status === "available") && <p className="mt-5 text-xs leading-5 text-muted-foreground">Dodo&apos;s portal shows the billing account&apos;s history and payment controls. It may include other purchases made under the same billing account; these links do not filter its invoices by product.</p>}
      <Button variant="outline" className="mt-6" onClick={() => void refresh()} disabled={loading || opening !== null}>Refresh invoice access</Button>
    </>}
    <p className="mt-8 text-sm text-muted-foreground">Need help with a receipt? <a href="mailto:buckets@serverlesscreed.com?subject=Buckets%20invoice" className="font-medium underline">buckets@serverlesscreed.com</a></p>
  </main>;
}
