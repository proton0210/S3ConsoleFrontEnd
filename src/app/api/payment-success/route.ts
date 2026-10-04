/** Read-only confirmation: only webhook-provisioned rows for this purchase can succeed. */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseByEmail, getTeamByOwner } from "@/lib/license-api";
import { confirmedPurchaseTier, purchaseReference } from "@/lib/payment-confirmation";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const pending = () => json({ success: true, status: "pending", message: "Awaiting confirmation and license activation for this purchase." });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return json({ success: false, error: "Unauthorized" }, 401);
    // Ignore all client-supplied identity. Only the signed-in account is read.
    const purchase = purchaseReference(await req.json().catch(() => ({})));
    if (!purchase.checkoutAttemptId && !purchase.paymentId && !purchase.subscriptionId) {
      return json({ success: false, error: "Missing purchase reference. Open billing to check your license." }, 400);
    }
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    if (!email || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return json({ success: false, error: "A verified primary email is required" }, 400);
    }
    // Preserve legacy mixed-case rows while allowing normalized webhook keys.
    let result = await getLicenseByEmail(email);
    if (result.response.status === 404 && email !== email.toLowerCase()) {
      result = await getLicenseByEmail(email.toLowerCase());
    }
    const { response, data: license } = result;
    if (response.status === 404) return pending();
    if (!response.ok) return json({ success: false, error: "License lookup failed" }, response.status);
    if (license.clerkId && license.clerkId !== userId) {
      return json({ success: false, error: "License does not belong to authenticated user" }, 403);
    }
    let team = null;
    if (!purchase.expectedTier || purchase.expectedTier === "team") {
      const teamResult = await getTeamByOwner(email, userId);
      if (teamResult.response.ok) {
        team = teamResult.data;
        if (team.ownerClerkId && team.ownerClerkId !== userId) {
          return json({ success: false, error: "Team does not belong to authenticated user" }, 403);
        }
      }
      else if (teamResult.response.status !== 404) {
        return json({ success: false, error: "Team lookup failed" }, teamResult.response.status);
      }
    }
    const tier = confirmedPurchaseTier(license, team, purchase, email);
    if (!tier) return pending();
    return json({
      success: true, status: "paid",
      userData: {
        paid: true, onTrial: false, tier,
        licenseTier: license.tier,
        validUntil: tier === "team" ? team?.validUntil ?? null : license.validUntil ?? null,
        subscriptionStatus: tier === "team" ? team?.subscriptionStatus : license.subscriptionStatus,
        licenseCount: license.licenseCount,
        machines: Array.isArray(license.machines) ? license.machines : [],
        key: license.key,
      },
    });
  } catch {
    console.error("[payment-success] Confirmation request failed.");
    return json({ success: false, error: "Unable to check payment confirmation. Please retry." }, 500);
  }
}
