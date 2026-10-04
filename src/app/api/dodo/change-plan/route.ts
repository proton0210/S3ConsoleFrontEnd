import { runBillingOperation } from "@/lib/billing-operation";
/**
 * In-place subscription plan change (monthly ↔ yearly).
 *
 * Calls Dodo's POST /subscriptions/{id}/change-plan so the customer never
 * ends up with two parallel subscriptions:
 *   - Upgrade (monthly → yearly) applies immediately with prorated billing —
 *     unused monthly time is credited against the yearly charge.
 *   - Downgrade (yearly → monthly) is scheduled for the next billing date, so
 *     the customer keeps the year they paid for and is billed monthly after
 *     that. It can be undone with DELETE /api/dodo/subscription. Lifetime is intentionally NOT routed
 * through here — it's a one-time product type and uses /api/dodo/create-checkout.
 *
 * The webhook (subscription.plan_changed) is the authoritative writer of
 * tier/validUntil/productId on the license row; this endpoint only triggers
 * the change and returns immediately.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getDodoApiBaseUrl,
  getProductId,
  isLicenseTier,
  isSubscriptionTier,
  type LicenseTier,
} from "@/lib/dodo";
import { getLicenseForAccount } from "@/lib/license-api";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim() || "";
    const tier = body?.tier as LicenseTier | undefined;

    if (!email || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return NextResponse.json(
        { error: "A verified primary email is required for billing changes" },
        { status: 400 }
      );
    }
    // Team is a subscription tier but is per-seat — seat changes go through
    // /api/team/seats, and solo↔team conversions are a new checkout, never an
    // in-place change (quantity semantics differ).
    if (!tier || !isLicenseTier(tier) || !isSubscriptionTier(tier) || tier === "team") {
      return NextResponse.json(
        {
          error:
            "tier must be 'monthly' or 'yearly' for in-place plan change. Lifetime upgrades go through /api/dodo/create-checkout; team seats are managed at /account/team.",
        },
        { status: 400 }
      );
    }

    const { response: licenseResponse, data: license } =
      await getLicenseForAccount(email);
    if (licenseResponse.status === 404) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    if (!licenseResponse.ok) {
      return NextResponse.json(
        { error: license.error || "License lookup failed" },
        { status: licenseResponse.status },
      );
    }

    if (license.clerkId && license.clerkId !== userId) {
      return NextResponse.json(
        { error: "License does not belong to authenticated user" },
        { status: 403 }
      );
    }

    if (license.tier !== "monthly" && license.tier !== "yearly") {
      return NextResponse.json(
        { error: "Only individual monthly or yearly subscriptions can use this plan change." },
        { status: 400 }
      );
    }
    if (!license.subscriptionId) {
      return NextResponse.json(
        {
          error:
            "No active subscription found for this account. Try refreshing — webhook may still be in flight.",
        },
        { status: 409 }
      );
    }
    if (license.subscriptionStatus === "canceled") {
      return NextResponse.json(
        {
          error:
            "This subscription has been canceled. Choose a new plan from the pricing page to subscribe again.",
        },
        { status: 409 }
      );
    }
    // Only monthly ↔ yearly reaches here (lifetime/team rejected above).
    const isDowngrade = license.tier === "yearly" && tier === "monthly";

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[change-plan] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let newProductId: string;
    try {
      newProductId = getProductId(tier);
    } catch (error: unknown) {
      return NextResponse.json(
        { error: errorMessage(error, "Product is not configured") },
        { status: 500 }
      );
    }

    return runBillingOperation({
      subject: userId, email, resource: `subscription:${license.subscriptionId}`,
      intent: { action: "plan", tier },
      expected: { productId: newProductId, quantity: 1, scheduled: isDowngrade },
      generation: { tier: license.tier, productId: license.productId, validUntil: license.validUntil, status: license.subscriptionStatus },
    }, async ({ operationId, mutate }) => {
    const baseUrl = getDodoApiBaseUrl();
    const providerResponse = await fetch(`${baseUrl}/subscriptions/${encodeURIComponent(license.subscriptionId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    const provider = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok || !provider || !provider.product_id) {
      return NextResponse.json({ error: "Could not verify your current subscription." }, { status: 502 });
    }
    if (license.dodoCustomerId && provider.customer?.customer_id !== license.dodoCustomerId) {
      return NextResponse.json({ error: "Subscription does not match this account." }, { status: 409 });
    }
    if (provider.product_id === newProductId || provider.scheduled_change?.product_id === newProductId) {
      return NextResponse.json({ success: true, tier, scheduled: provider.scheduled_change?.product_id === newProductId,
        message: "This plan change has already been received." });
    }
    if (provider.product_id !== getProductId(license.tier) || provider.status !== "active") {
      return NextResponse.json({ error: "Your subscription is still synchronizing or is not active. Refresh before changing plans." }, { status: 409 });
    }
    const url = `${baseUrl}/subscriptions/${encodeURIComponent(
      license.subscriptionId
    )}/change-plan`;

    const dodoResp = await mutate(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_id: newProductId,
        quantity: 1,
        // Upgrade: prorated_immediately charges the new cycle now and credits
        // the unused part of the old one, so it takes effect right away.
        // Downgrade: queued for the end of the paid year — the switch (and
        // the first monthly charge) happens on the renewal date, and the
        // webhook updates the license when Dodo applies it.
        proration_billing_mode: "prorated_immediately",
        effective_at: isDowngrade ? "next_billing_date" : "immediately",
        // Replace any change already queued (e.g. an earlier downgrade) so
        // the subscription only ever has one pending plan.
        cancel_scheduled_change_plan: true,
        // Don't roll the customer onto the new plan if their card declines —
        // we'd rather keep them where they are than lock them into a failed
        // state.
        on_payment_failure: "prevent_change",
        metadata: {
          ...(provider.metadata && typeof provider.metadata === "object" ? provider.metadata : {}),
          billingOperationId: operationId,
          tier,
          plan_change_from: license.tier || "unknown",
          accountEmail: email,
          accountSubject: userId,
          // Product marker — webhooks drop events that aren't ours (the Dodo
          // account is shared across products).
          app: "serverless-buckets",
        },
      }),
    });

    const data = await dodoResp.json().catch(() => ({}));

    if (!dodoResp.ok) {
      console.error("[change-plan] Dodo error", {
        status: dodoResp.status,
      });
      return NextResponse.json(
        { error: data?.message || "Failed to change plan." },
        { status: dodoResp.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tier,
      scheduled: isDowngrade,
      message: isDowngrade
        ? "Your plan will switch at the end of the current billing period."
        : "Plan change submitted. Your dashboard will reflect the new plan within a few seconds.",
    });
    });
  } catch (error: unknown) {
    console.error("[change-plan] Unexpected request failure.");
    return NextResponse.json(
      { error: errorMessage(error, "Unexpected error") },
      { status: 500 }
    );
  }
}
