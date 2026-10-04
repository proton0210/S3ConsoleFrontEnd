import { runBillingOperation } from "@/lib/billing-operation";
/**
 * POST /api/team/seats — change the seat count on the signed-in owner's team
 * subscription. Body: { seats }
 *
 * Calls Dodo's change-plan with the SAME team product and the new quantity,
 * prorated immediately — adding 2 seats mid-cycle charges only the difference.
 * The webhook (subscription.plan_changed / subscription.updated) is the
 * authoritative writer of seatsPurchased on the TEAM# row.
 *
 * Decreases are allowed only down to the current member count — the owner
 * must remove members first so we never strand a licensed member without a
 * seat.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getDodoApiBaseUrl,
  getProductId,
  MAX_TEAM_SEATS,
  MIN_TEAM_SEATS,
} from "@/lib/dodo";
import { getTeamByOwner } from "@/lib/license-api";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await currentUser();
    const ownerEmail = user?.primaryEmailAddress?.emailAddress;
    if (!ownerEmail || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const seats = Number(body?.seats);
    if (
      !Number.isInteger(seats) ||
      seats < MIN_TEAM_SEATS ||
      seats > MAX_TEAM_SEATS
    ) {
      return NextResponse.json(
        {
          error: `seats must be an integer between ${MIN_TEAM_SEATS} and ${MAX_TEAM_SEATS}`,
        },
        { status: 400 }
      );
    }

    const { response: teamResponse, data: team } =
      await getTeamByOwner(ownerEmail, userId);
    if (teamResponse.status === 404) {
      return NextResponse.json(
        { error: "No team subscription for this account" },
        { status: 404 }
      );
    }
    if (!teamResponse.ok) {
      return NextResponse.json(
        { error: team.error || "Team lookup failed" },
        { status: teamResponse.status },
      );
    }

    if (team.ownerClerkId && team.ownerClerkId !== userId) {
      return NextResponse.json({ error: "Team does not belong to authenticated user." }, { status: 403 });
    }

    if (!team.subscriptionId) {
      return NextResponse.json(
        { error: "Team subscription not found — webhook may still be in flight." },
        { status: 409 }
      );
    }
    const memberCount = Array.isArray(team.members)
      ? team.members.length
      : Number(team.seatsUsed || 0);
    if (seats < memberCount) {
      return NextResponse.json(
        {
          error: `You have ${memberCount} members — remove ${memberCount - seats} before reducing to ${seats} seats.`,
        },
        { status: 409 }
      );
    }
    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    return runBillingOperation({
      subject: userId, email: ownerEmail, resource: `subscription:${team.subscriptionId}`,
      intent: { action: "seats", seats },
      expected: { productId: team.productId || getProductId("team"), quantity: seats },
      generation: { productId: team.productId, quantity: team.seatsPurchased, validUntil: team.validUntil, status: team.subscriptionStatus },
    }, async ({ operationId, mutate }) => {
    const productId = team.productId || getProductId("team");
    const subscriptionUrl = `${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(team.subscriptionId)}`;
    // If the previous response was lost before the webhook arrived, a retry
    // must not charge again for an already accepted seat count.
    const providerResponse = await fetch(subscriptionUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    const provider = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok || !provider || !Number.isInteger(provider.quantity)) {
      return NextResponse.json({ error: "Could not verify the current subscription. Please try again." }, { status: 502 });
    }
    if (provider.product_id !== productId ||
        (team.dodoCustomerId && provider.customer?.customer_id !== team.dodoCustomerId)) {
      return NextResponse.json({ error: "Subscription does not match this team. Contact support." }, { status: 409 });
    }
    if (provider.quantity === seats) {
      return NextResponse.json({ success: true, seats, pending: true,
        message: "Seat change already received. Waiting for your dashboard to synchronize." });
    }
    if (provider.quantity !== team.seatsPurchased) {
      return NextResponse.json({ error: "A seat change is still synchronizing. Refresh before changing seats." }, { status: 409 });
    }
    if (provider.status !== "active") {
      return NextResponse.json({ error: "Your subscription must be active to change seats. Check the billing portal." }, { status: 409 });
    }
    const url = `${subscriptionUrl}/change-plan`;

    const dodoResp = await mutate(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: seats,
        proration_billing_mode: "prorated_immediately",
        effective_at: "immediately",
        on_payment_failure: "prevent_change",
        // Plan-change metadata belongs to the resulting payment. Preserve
        // account routing keys for its signed payment webhook.
        metadata: {
          ...(provider.metadata && typeof provider.metadata === "object" ? provider.metadata : {}),
          billingOperationId: operationId,
          tier: "team",
          seats_change_from: String(team.seatsPurchased ?? ""),
          accountEmail: team.ownerEmail || ownerEmail,
          accountSubject: userId,
          app: "serverless-buckets",
        },
      }),
    });

    const data = await dodoResp.json().catch(() => ({}));
    if (!dodoResp.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to change seat count." },
        { status: dodoResp.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      seats,
      message:
        "Seat change submitted. Your dashboard will reflect the new count within a few seconds.",
    });
    });
  } catch (error: unknown) {
    console.error("[team-seats] Unexpected request failure.");
    return NextResponse.json(
      { error: errorMessage(error, "Unexpected error") },
      { status: 500 }
    );
  }
}
