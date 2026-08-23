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
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseByEmail } from "@/lib/license-api";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Keep accepting the existing request body for released clients, but never
    // use its email to select an account. Identity comes from Clerk.
    await req.json().catch(() => ({}));
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "No primary email on authenticated account" },
        { status: 400 }
      );
    }

    const { response, data: license } = await getLicenseByEmail(email);
    if (response.status === 404) {
      // Webhook hasn't landed yet — return pending so the client retries.
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Awaiting payment confirmation from Dodo. This may take a few seconds.",
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: license.error || "License lookup failed" },
        { status: response.status },
      );
    }

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
  } catch (error: unknown) {
    console.error("[payment-success] Poller request failed.");
    return NextResponse.json(
      { success: false, error: errorMessage(error, "Unexpected error") },
      { status: 500 }
    );
  }
}
