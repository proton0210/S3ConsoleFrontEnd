/** Purchase identity is evidence from webhook rows, never the optimistic redirect status. */
export type PurchaseReference = {
  checkoutAttemptId?: string;
  paymentId?: string;
  subscriptionId?: string;
  expectedTier?: "monthly" | "yearly" | "lifetime" | "team";
};

type Row = Record<string, unknown>;
const identifier = (value: unknown): string | undefined =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value) ? value : undefined;

export function purchaseReference(body: unknown): PurchaseReference {
  const data = body && typeof body === "object" ? body as Row : {};
  if (data.checkoutAttemptId != null &&
      (typeof data.checkoutAttemptId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(data.checkoutAttemptId))) return {};
  const expectedTier = ["monthly", "yearly", "lifetime", "team"].includes(String(data.expectedTier))
    ? data.expectedTier as PurchaseReference["expectedTier"] : undefined;
  return {
    checkoutAttemptId: identifier(data.checkoutAttemptId),
    paymentId: identifier(data.paymentId),
    subscriptionId: identifier(data.subscriptionId),
    expectedTier,
  };
}

export function matchesPurchase(row: Row, purchase: PurchaseReference): boolean {
  // Never fall back to an older payment/subscription when the current attempt
  // is known. Legacy redirects can still use webhook-persisted provider IDs.
  if (purchase.checkoutAttemptId) return row.checkoutAttemptId === purchase.checkoutAttemptId;
  if (purchase.paymentId) return row.paymentId === purchase.paymentId &&
    (!purchase.subscriptionId || row.subscriptionId === purchase.subscriptionId);
  return !!purchase.subscriptionId && row.subscriptionId === purchase.subscriptionId;
}

export function confirmedPurchaseTier(
  license: Row, team: Row | null, purchase: PurchaseReference, email: string,
): string | null {
  if (license.paid !== true || license.effectiveActive !== true || !license.key) return null;
  const normalizedEmail = email.toLowerCase();
  if (purchase.expectedTier !== "team" && matchesPurchase(license, purchase) &&
      license.tier !== "team" && (!purchase.expectedTier || license.tier === purchase.expectedTier)) {
    return typeof license.tier === "string" ? license.tier : null;
  }
  if (purchase.expectedTier && purchase.expectedTier !== "team") return null;
  if (!team || !matchesPurchase(team, purchase) || team.effectiveActive !== true ||
      String(team.ownerEmail).toLowerCase() !== normalizedEmail ||
      typeof team.seatsPurchased !== "number" || team.seatsPurchased < 3) return null;
  const members = Array.isArray(team.members) ? team.members as Row[] : [];
  if (!members.some(member => member.isOwner === true &&
      String(member.email).toLowerCase() === normalizedEmail)) return null;
  // A lifetime owner keeps their perpetual personal key when buying a team.
  const ownerReady = !license.tier || license.tier === "lifetime" ||
    (license.tier === "team" && String(license.teamOwner).toLowerCase() === normalizedEmail &&
      matchesPurchase(license, purchase));
  return ownerReady ? "team" : null;
}

export function paymentSignInUrl(query: string): string {
  return `/sign-in?redirect_url=${encodeURIComponent(`/payment-status${query ? `?${query}` : ""}`)}`;
}

/** Aborting a page/retry also releases its pending delay immediately. */
export function waitForNextPoll(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(); };
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
  });
}

/** Bound each request so an interrupted connection cannot defeat the page timeout. */
export async function fetchPaymentConfirmation(
  purchase: { checkoutAttemptId: string | null; paymentId: string | null; subscriptionId: string | null; expectedTier: string | null },
  signal: AbortSignal,
  timeoutMs = 15_000,
): Promise<{ response: Response; data: { status?: string; userData?: { paid?: boolean; key?: string; tier?: "monthly" | "yearly" | "lifetime" | "team"; validUntil?: number | null; subscriptionStatus?: string; licenseCount?: number } } | null }> {
  const request = new AbortController();
  const abort = () => request.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => request.abort(new DOMException("Confirmation request timed out", "TimeoutError")), timeoutMs);
  try {
    const response = await fetch("/api/payment-success", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchase), signal: request.signal,
    });
    const data = await response.json().catch(error => {
      if (request.signal.aborted) throw error;
      return null;
    });
    return { response, data };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
