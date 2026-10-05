import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseForAccount, getTeamByOwner } from "@/lib/license-api";
import { teamSeatPriceForProduct } from "@/lib/dodo";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - no user ID" },
        { status: 401 },
      );
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "No primary email on account" },
        { status: 400 },
      );
    }

    const { response, data } = await getLicenseForAccount(email);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "License lookup failed" },
        { status: response.status },
      );
    }
    if (data.clerkId && data.clerkId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden — license belongs to a different account" },
        { status: 403 },
      );
    }

    const userData: Record<string, unknown> & { machines: unknown[]; teamSeatPriceUsd?: number | null } = {
      ...data,
      licenseCount: typeof data.licenseCount === "number" ? data.licenseCount : 2,
      machines: Array.isArray(data.machines) ? data.machines : [],
    };

    // Team owners: show the per-seat price their Team product actually
    // charges (teams on the retired $99 product keep that rate). Purely
    // informational — on a lookup failure the billing page shows no price.
    const isTeamOwner = data.tier === "team" && typeof data.teamOwner === "string" &&
      data.teamOwner.toLowerCase() === email.toLowerCase();
    if (isTeamOwner) {
      // Unknown until the team lookup reports its product: never show a guess.
      userData.teamSeatPriceUsd = null;
      try {
        const team = await getTeamByOwner(data.teamOwner, userId);
        if (team.response.ok) userData.teamSeatPriceUsd = teamSeatPriceForProduct(team.data.productId);
      } catch {
        // Leave the price unset.
      }
    }

    return NextResponse.json({
      success: true,
      userData,
      ...(userData.paid && userData.machines.length === 0
        ? {
            warning: "No machines registered yet. Please activate your license in the desktop app to register this machine.",
            requiresActivation: true,
          }
        : {}),
    });
  } catch (error) {
    console.error("[user-data] license service request failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to reach license service" },
      { status: 502 },
    );
  }
}
