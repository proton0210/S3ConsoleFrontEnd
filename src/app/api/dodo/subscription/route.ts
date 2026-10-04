import { runBillingOperation } from "@/lib/billing-operation";
/**
 * Live subscription state, read straight from Dodo.
 *
 * The license row (written by the webhook) is the source of truth for
 * access, but it doesn't record things that are only *scheduled*: a
 * cancellation at period end (set from the customer portal) or a plan
 * downgrade queued for the next billing date. The billing page reads this
 * so it can say "Cancels on …" or "Switches to Monthly on …" instead of
 * a misleading "Renews on …".
 *
 * GET    → current Dodo state for the signed-in user's subscription
 * DELETE → drop a scheduled plan change (undo a queued downgrade)
 */
import { NextResponse } from "next/server";
import { resolveBillingAccount } from "@/lib/billing-account";
import type { LicenseApiData } from "@/lib/license-api";
import { getDodoApiBaseUrl, getTierForProductId } from "@/lib/dodo";

export const dynamic = "force-dynamic";

type DodoSubscription = {
  status?: string | null;
  product_id?: string | null;
  next_billing_date?: string | null;
  cancel_at_next_billing_date?: boolean | null;
  scheduled_change?: {
    product_id?: string | null;
    effective_at?: string | null;
  } | null;
};

function soloSubscriptionId(license: LicenseApiData): string | null {
  const tier = license.tier;
  if (tier !== "monthly" && tier !== "yearly") return null;
  return typeof license.subscriptionId === "string" && license.subscriptionId
    ? license.subscriptionId
    : null;
}

export async function GET() {
  try {
    const resolved = await resolveBillingAccount();
    if (!resolved.ok) return resolved.response;
    const subscriptionId = soloSubscriptionId(resolved.account.license);
    if (!subscriptionId) {
      return NextResponse.json({ success: true, subscription: null });
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[subscription] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const resp = await fetch(
      `${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );
    const data = (await resp.json().catch(() => ({}))) as DodoSubscription;
    if (!resp.ok) {
      console.error("[subscription] Dodo error", { status: resp.status });
      return NextResponse.json(
        { error: "Could not load live subscription status." },
        { status: 502 }
      );
    }

    const scheduled = data.scheduled_change;
    const scheduledTier = getTierForProductId(scheduled?.product_id);
    return NextResponse.json(
      {
        success: true,
        subscription: {
          status: data.status ?? null,
          tier: getTierForProductId(data.product_id),
          nextBillingDate: data.next_billing_date ?? null,
          cancelAtNextBillingDate: data.cancel_at_next_billing_date === true,
          scheduledChange:
            scheduled && scheduledTier
              ? { tier: scheduledTier, effectiveAt: scheduled.effective_at ?? null }
              : null,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    console.error("[subscription] Unexpected request failure.");
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const resolved = await resolveBillingAccount();
    if (!resolved.ok) return resolved.response;
    const subscriptionId = soloSubscriptionId(resolved.account.license);
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found for this account." },
        { status: 409 }
      );
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[subscription] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    return runBillingOperation({
      subject: resolved.account.userId, email: resolved.account.email, resource: `subscription:${subscriptionId}`,
      intent: { action: "cancel-scheduled-plan" }, expected: { clearScheduled: true },
      generation: { tier: resolved.account.license.tier, validUntil: resolved.account.license.validUntil, status: resolved.account.license.subscriptionStatus },
    }, async ({ mutate }) => {
    const live = await fetch(`${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    const provider = await live.json().catch(() => null);
    if (!live.ok || !provider) return NextResponse.json({ error: "Could not verify the scheduled change." }, { status: 502 });
    if (!provider.scheduled_change) return NextResponse.json({ success: true });
    const resp = await mutate(
      `${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/change-plan/scheduled`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      console.error("[subscription] Dodo cancel-scheduled error", {
        status: resp.status,
      });
      return NextResponse.json(
        { error: data?.message || "Could not cancel the scheduled plan change." },
        { status: resp.status || 500 }
      );
    }
    return NextResponse.json({ success: true });
    });
  } catch {
    console.error("[subscription] Unexpected request failure.");
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
