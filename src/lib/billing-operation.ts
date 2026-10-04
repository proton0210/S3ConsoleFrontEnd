import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { licenseApiRequest } from "@/lib/license-api";

type Operation = {
  subject: string;
  email: string;
  resource: "checkout" | `subscription:${string}`;
  intent: Record<string, unknown>;
  generation: unknown;
  expected?: { productId?: string; quantity?: number; scheduled?: boolean; cancelAtPeriodEnd?: boolean; clearScheduled?: boolean };
};
export type BillingOperationContext = {
  operationId: string;
  /** Fences ownership immediately before the only provider mutation. */
  mutate: (url: string, init: RequestInit) => Promise<Response>;
};

/** Purchase identity only; activation/device timestamps must not unlock checkout. */
export function purchaseGeneration(license: Record<string, unknown>, team: Record<string, unknown>) {
  const identity = (row: Record<string, unknown>) => ({
    tier: row.tier ?? null, paid: row.paid ?? null, revoked: row.revoked ?? null,
    subscriptionId: row.subscriptionId ?? null, checkoutAttemptId: row.checkoutAttemptId ?? null,
    paymentId: row.paymentId ?? null,
  });
  return { license: identity(license), team: identity(team) };
}

export async function runBillingOperation(
  operation: Operation,
  execute: (context: BillingOperationContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const fingerprint = createHash("sha256").update(JSON.stringify({
    intent: operation.intent, generation: operation.generation,
  })).digest("hex");
  const lane = operation.expected?.clearScheduled === true || typeof operation.expected?.cancelAtPeriodEnd === "boolean"
    ? "subscription-state" : "billing";
  const request = { subject: operation.subject, email: operation.email, resource: operation.resource, fingerprint, expected: operation.expected, lane };
  let operationId: string | undefined;
  let ownerToken: string | undefined;
  let dispatched = false;
  let uncertainProvider = false;
  const call = (action: string, extra: Record<string, unknown> = {}) => licenseApiRequest("/billing-operation", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, action, operationId, ownerToken, ...extra }),
  });
  const pending = () => NextResponse.json({
    error: `This billing request is still being verified. Do not submit another payment; retry this request to check its status. If it remains pending, contact buckets@serverlesscreed.com. Reference: ${operationId ?? "unavailable"}.`,
    code: "billing_outcome_unknown", operationId,
  }, { status: 409, headers: { "Cache-Control": "no-store" } });
  try {
    const claim = await call("claim");
    operationId = claim.data.operationId;
    if (claim.response.status === 409) return pending();
    if (!claim.response.ok) {
      return NextResponse.json({ error: "Billing coordination is unavailable. Please try again shortly." }, { status: 503 });
    }
    operationId = claim.data.operationId;
    if (claim.data.state === "replay") {
      return NextResponse.json(claim.data.result.body, { status: claim.data.result.status, headers: { "Cache-Control": "no-store" } });
    }
    if (claim.data.state !== "acquired") return pending();
    ownerToken = claim.data.ownerToken;
    if (!operationId || !ownerToken) throw new Error("Invalid billing coordination response");
    const result = await execute({
      operationId,
      mutate: async (url, init) => {
        if (dispatched) throw new Error("A billing operation may dispatch only once");
        const providerMutation = { method: (init.method ?? "GET").toUpperCase(), path: new URL(url).pathname,
          ...(typeof init.body === "string" ? { body: JSON.parse(init.body) } : {}) };
        const start = await call("dispatch", { providerMutation,
          ...(operation.intent.action === "seats" ? { seatLimit: operation.intent.seats } : {}) });
        if (!start.response.ok) throw new Error("Billing operation ownership changed");
        // Set before fetch: a network error is an unknown provider outcome.
        dispatched = true;
        const response = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(15_000) });
        uncertainProvider = !response.ok;
        return response;
      },
    });
    if (!dispatched) {
      await call("release");
      return result;
    }
    if (uncertainProvider || result.status >= 400) return pending();
    const body = await result.clone().json();
    const saved = await call("complete", { result: { status: result.status, body } });
    if (!saved.response.ok) return pending();
    return result;
  } catch {
    if (!dispatched && ownerToken) await call("release").catch(() => undefined);
    // A lost dispatch acknowledgement is also safe: release is conditional on
    // prepared state, so it can never unlock a request that was dispatched.
    return operationId ? pending() : NextResponse.json({ error: "Billing coordination is unavailable. Please try again shortly." }, { status: 503 });
  }
}
