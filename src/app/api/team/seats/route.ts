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
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { currentUser } from "@clerk/nextjs/server";
import {
  getDodoApiBaseUrl,
  getProductId,
  MAX_TEAM_SEATS,
  MIN_TEAM_SEATS,
} from "@/lib/dodo";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";
const ddb = new DynamoDBClient(getDdbClientConfig());

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const ownerEmail = user?.primaryEmailAddress?.emailAddress;
    if (!ownerEmail) {
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

    const { Item } = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email: `TEAM#${ownerEmail}` }),
      })
    );
    if (!Item) {
      return NextResponse.json(
        { error: "No team subscription for this account" },
        { status: 404 }
      );
    }
    const team = unmarshall(Item);

    if (!team.subscriptionId) {
      return NextResponse.json(
        { error: "Team subscription not found — webhook may still be in flight." },
        { status: 409 }
      );
    }
    const memberCount = Array.isArray(team.memberEmails)
      ? team.memberEmails.length
      : 0;
    if (seats < memberCount) {
      return NextResponse.json(
        {
          error: `You have ${memberCount} members — remove ${memberCount - seats} before reducing to ${seats} seats.`,
        },
        { status: 409 }
      );
    }
    if (seats === team.seatsPurchased) {
      return NextResponse.json(
        { error: `Already at ${seats} seats.` },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[team-seats] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const productId = team.productId || getProductId("team");
    const url = `${getDodoApiBaseUrl()}/subscriptions/${encodeURIComponent(
      team.subscriptionId
    )}/change-plan`;

    const dodoResp = await fetch(url, {
      method: "POST",
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
        // change-plan REPLACES the subscription's metadata — re-stamp the
        // routing keys (app/accountEmail) or downstream webhook events lose
        // their product marker and row key after any seat change.
        metadata: {
          tier: "team",
          seats_change_from: String(team.seatsPurchased ?? ""),
          accountEmail: ownerEmail,
          app: "s3console",
        },
      }),
    });

    const data = await dodoResp.json().catch(() => ({}));
    if (!dodoResp.ok) {
      console.error("[team-seats] Dodo error", {
        status: dodoResp.status,
        message: data?.message,
        subscriptionId: team.subscriptionId,
        seats,
      });
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
  } catch (err: any) {
    console.error("[team-seats] unexpected", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
