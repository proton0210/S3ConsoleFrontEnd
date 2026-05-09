/**
 * payment-success — read-only poller.
 *
 * **Phase 7 demotion:** this route used to write paid=true to DynamoDB on
 * post-checkout redirect. That was fragile (loses the update if the user
 * closes the tab) and racy with the Dodo webhook handler. Now the webhook is
 * the single writer; this endpoint just polls the license row until paid=true
 * or 30s elapses.
 *
 * The browser's /payment-status page hits this in a polling loop.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { getDdbClientConfig } from "@/lib/dynamodb";

const TABLE_NAME = "S3Console";

const client = new DynamoDBClient(getDdbClientConfig());

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email: string | undefined = typeof body?.email === "string" ? body.email : undefined;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const { Item } = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ email }),
      })
    );

    if (!Item) {
      // Webhook hasn't landed yet — return pending so the client retries.
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Awaiting payment confirmation from Dodo. This may take a few seconds.",
      });
    }

    const license = unmarshall(Item);

    // Defense-in-depth: if a clerkId is on the row, ensure it matches the caller.
    if (license.clerkId && license.clerkId !== userId) {
      return NextResponse.json(
        { success: false, error: "License does not belong to authenticated user" },
        { status: 403 }
      );
    }

    if (license.paid === true) {
      return NextResponse.json({
        success: true,
        status: "paid",
        userData: {
          paid: true,
          onTrial: false,
          tier: license.tier,
          validUntil: license.validUntil ?? null,
          subscriptionStatus: license.subscriptionStatus,
          licenseCount: license.licenseCount,
          machines: Array.isArray(license.machines) ? license.machines : [],
          // Surface the new license key so the redirect page can display it.
          key: license.key,
        },
      });
    }

    // Still on trial / unpaid — the webhook hasn't arrived yet (or never will).
    return NextResponse.json({
      success: true,
      status: "pending",
      message: "Payment not yet confirmed. The browser will keep polling for ~30s.",
    });
  } catch (err: any) {
    console.error("[payment-success] poller error", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
