"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; status: string; plan: string | null }
  | { kind: "error"; message: string };

export default function MarketplaceRegistrationForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>(
    initialError
      ? { kind: "error", message: "AWS Marketplace could not validate this registration. Return to your Marketplace order and choose Set up your account again." }
      : { kind: "idle" },
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "loading" });
    const response = await fetch("/api/marketplace/claim", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string; subscriptionStatus?: string; plan?: string | null }
      | null;
    if (!response.ok) {
      setState({ kind: "error", message: result?.error || "Unable to complete registration." });
      return;
    }
    setState({ kind: "success", status: result?.subscriptionStatus || "unknown", plan: result?.plan || null });
  }
  if (state.kind === "success") {
    const active = state.status === "active" || state.status === "grace";
    return (
      <div className="rounded-xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Marketplace account linked</h2>
        <p>Subscription status: <strong>{state.status}</strong>{state.plan ? ` · ${state.plan}` : ""}</p>
        <p className="text-sm text-muted-foreground">
          {active
            ? "You can now download Buckets by ServerlessCreed and sign in with this account."
            : "AWS has not reported an active entitlement yet. The account is linked; retry from the desktop shortly or contact support if the status does not update."}
        </p>
        <div className="flex gap-3">
          <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/account/marketplace">View subscription</Link>
          <Link className="rounded-md border px-4 py-2" href="/downloads">Downloads</Link>
          <a className="rounded-md border px-4 py-2" href="mailto:vidit@serverlesscreed.com">Support</a>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-xl border p-6 space-y-4">
      <div>
        <label htmlFor="marketplace-email" className="block text-sm font-medium">Buyer contact email</label>
        <input
          id="marketplace-email" name="email" type="email" autoComplete="email" required
          value={email} onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border bg-background px-3 py-2" placeholder="you@company.com"
        />
        <p className="mt-2 text-xs text-muted-foreground">Enter the verified email on the account you just used to sign in.</p>
      </div>
      {state.kind === "error" ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
      <button type="submit" disabled={state.kind === "loading"} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">
        {state.kind === "loading" ? "Linking purchase…" : "Complete Marketplace registration"}
      </button>
    </form>
  );
}
