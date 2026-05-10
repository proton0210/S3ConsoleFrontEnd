/**
 * Dodo customer-portal session minter.
 *
 * Mints a single-use session URL that takes the customer to Dodo's hosted
 * portal where they can:
 *   - Update payment method
 *   - Cancel subscription
 *   - View invoice history
 *   - Retrieve license keys
 *
 * Auth: requires the requesting user's email + verified Clerk session.
 *       The license row's `dodoCustomerId` is the Dodo customer ID (captured
 *       by the webhook on first subscription event).
 *
 * Reference: POST /customers/{customer_id}/customer-portal/session
 *            Bearer DODO_API_KEY → returns { link: "https://..." }
 */
import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { getDodoApiBaseUrl } from "@/lib/dodo";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";

const ddb = new DynamoDBClient(getDdbClientConfig());

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — only the user themselves can mint a portal link for their account.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // 2. Look up dodoCustomerId for this license row.
    const { Item } = await ddb.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email }),
      })
    );

    if (!Item) {
      return NextResponse.json(
        { error: "License not found for this email" },
        { status: 404 }
      );
    }

    const license = unmarshall(Item);

    // Defense-in-depth: confirm the requesting Clerk user owns this license row.
    if (license.clerkId && license.clerkId !== userId) {
      return NextResponse.json(
        { error: "License does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    const dodoCustomerId = license.dodoCustomerId;
    if (!dodoCustomerId || typeof dodoCustomerId !== "string") {
      // Race: webhook hasn't landed yet, or this is a lifetime user with
      // no recurring billing to manage.
      return NextResponse.json(
        {
          error:
            "Customer portal not yet available — try again in a moment, or contact support if this persists.",
          reason: license.tier === "lifetime" ? "lifetime_no_billing" : "pending_webhook",
        },
        { status: 409 }
      );
    }

    // 3. Mint the portal session via Dodo.
    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[portal-session] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const baseUrl = getDodoApiBaseUrl();
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "";
    // Send the user back to the billing dashboard so they immediately see the
    // updated state. The `?from=portal` marker tells the dashboard to poll
    // for the inbound webhook (cancel / payment-method update / etc.) for a
    // few seconds before settling.
    const returnUrl = `${origin}/account/billing?from=portal`;

    const portalUrl = new URL(
      `${baseUrl}/customers/${encodeURIComponent(dodoCustomerId)}/customer-portal/session`
    );
    // The portal page redirects back to return_url after the user is done.
    portalUrl.searchParams.set("return_url", returnUrl);

    const resp = await fetch(portalUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.link) {
      console.error("[portal-session] Dodo error", {
        status: resp.status,
        message: data?.message,
        dodoCustomerId,
      });
      return NextResponse.json(
        {
          error: data?.message || "Failed to mint portal session",
        },
        { status: resp.status || 500 }
      );
    }

    return NextResponse.json({ success: true, link: data.link });
  } catch (err: any) {
    console.error("[portal-session] unexpected", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
