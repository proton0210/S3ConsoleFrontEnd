/**
 * In-place subscription plan change (monthly ↔ yearly).
 *
 * Calls Dodo's POST /subscriptions/{id}/change-plan with prorated billing so
 * the customer is charged the difference immediately rather than ending up
 * with two parallel subscriptions. Lifetime is intentionally NOT routed
 * through here — it's a one-time product type and uses /api/dodo/create-checkout.
 *
 * The webhook (subscription.plan_changed) is the authoritative writer of
 * tier/validUntil/productId on the license row; this endpoint only triggers
 * the change and returns immediately.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { auth } from "@clerk/nextjs/server";
import {
  getDodoApiBaseUrl,
  getProductId,
  isLicenseTier,
  isSubscriptionTier,
  type LicenseTier,
} from "@/lib/dodo";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";
const ddb = new DynamoDBClient(getDdbClientConfig());

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const tier = body?.tier as LicenseTier | undefined;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!tier || !isLicenseTier(tier) || !isSubscriptionTier(tier)) {
      return NextResponse.json(
        {
          error:
            "tier must be 'monthly' or 'yearly' for in-place plan change. Lifetime upgrades go through /api/dodo/create-checkout.",
        },
        { status: 400 }
      );
    }

    const { Item } = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email }),
      })
    );
    if (!Item) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }
    const license = unmarshall(Item);

    if (license.clerkId && license.clerkId !== userId) {
      return NextResponse.json(
        { error: "License does not belong to authenticated user" },
        { status: 403 }
      );
    }

    if (license.tier === "lifetime") {
      return NextResponse.json(
        { error: "Lifetime plan cannot be changed." },
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
    if (license.tier === tier) {
      return NextResponse.json(
        { error: `Already on the ${tier} plan.` },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[change-plan] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let newProductId: string;
    try {
      newProductId = getProductId(tier);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    const baseUrl = getDodoApiBaseUrl();
    const url = `${baseUrl}/subscriptions/${encodeURIComponent(
      license.subscriptionId
    )}/change-plan`;

    const dodoResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_id: newProductId,
        quantity: 1,
        // prorated_immediately: customer charged the difference on the spot,
        // remaining time on old plan credited. Best fit for monthly→yearly
        // where we want the upgrade to take effect immediately.
        proration_billing_mode: "prorated_immediately",
        effective_at: "immediately",
        // Don't roll the customer onto the new plan if their card declines —
        // we'd rather keep them where they are than lock them into a failed
        // state.
        on_payment_failure: "prevent_change",
        metadata: {
          tier,
          plan_change_from: license.tier || "unknown",
        },
      }),
    });

    const data = await dodoResp.json().catch(() => ({}));

    if (!dodoResp.ok) {
      console.error("[change-plan] Dodo error", {
        status: dodoResp.status,
        message: data?.message,
        subscriptionId: license.subscriptionId,
        tier,
      });
      return NextResponse.json(
        { error: data?.message || "Failed to change plan." },
        { status: dodoResp.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tier,
      message:
        "Plan change submitted. Your dashboard will reflect the new plan within a few seconds.",
    });
  } catch (err: any) {
    console.error("[change-plan] unexpected", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
