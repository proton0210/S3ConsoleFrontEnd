/** Reuse one hosted checkout across repeated effects/clicks and tab reloads.
 * This is browser recovery, not a substitute for provider-side idempotency.
 * A response lost before it reaches this client cannot be recovered here.
 */
export type CheckoutResult = { checkout_url: string; session_id?: string };
export class CheckoutError extends Error {
  constructor(message: string, public manageUrl?: string) { super(message); }
}
const pending = new Map<string, Promise<CheckoutResult>>();
const TTL = 30 * 60 * 1000;

export function createCheckout(userId: string, body: Record<string, unknown>): Promise<CheckoutResult> {
  const key = `buckets-checkout:${JSON.stringify([userId, body.tier ?? body.productId, body.seats ?? body.quantity ?? 1])}`;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (saved?.expires > Date.now() && typeof saved?.result?.checkout_url === "string") {
      return Promise.resolve(saved.result);
    }
  } catch { /* Storage may be disabled; in-memory deduplication still works. */ }
  const request = (async () => {
    const response = await fetch("/api/dodo/create-checkout", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || typeof data?.checkout_url !== "string") {
      throw new CheckoutError(data?.error || "Could not start checkout. Please try again.", data?.manageUrl);
    }
    try { sessionStorage.setItem(key, JSON.stringify({ expires: Date.now() + TTL, result: data })); } catch { /* optional */ }
    return data as CheckoutResult;
  })();
  pending.set(key, request);
  void request.finally(() => pending.delete(key)).catch(() => {});
  return request;
}

/** Clear completed sessions so a later legitimate purchase starts fresh. */
export function clearCheckout(userId: string): void {
  try {
    const prefix = `buckets-checkout:${JSON.stringify([userId]).slice(0, -1)},`;
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch { /* Storage may be disabled. */ }
}
