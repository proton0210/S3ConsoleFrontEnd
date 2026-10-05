import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getLicenseForAccount, getTeamByOwner } from "@/lib/license-api";
import { teamSeatPriceForProduct } from "@/lib/dodo";

/**
 * GET /api/team — team overview for the signed-in owner.
 *
 * Identity comes from the Clerk session (never from the request), then we
 * proxy to the backend `GET /team` Lambda which owns the business rules.
 * Env: LICENSE_API_URL (API Gateway base), LICENSE_API_KEY (x-api-key).
 *
 * When the user owns no team, we check their OWN license row before giving
 * up: an invited MEMBER (tier="team" + teamOwner) gets a `memberOf` payload
 * so the dashboard can show their license key and team info instead of a
 * confusing "buy a team" CTA.
 */
export async function GET() {
  try {
    const user = await currentUser();
    const ownerEmail = user?.primaryEmailAddress?.emailAddress;
    if (!ownerEmail || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { response: resp, data } = await getTeamByOwner(ownerEmail, user.id);

    if (resp.ok && data.ownerClerkId && data.ownerClerkId !== user.id) {
      return NextResponse.json({ error: "Team does not belong to authenticated user." }, { status: 403 });
    }

    // Not an owner — are they a MEMBER of someone's team? Their own license
    // row says so (team-invite stamps tier + teamOwner; team-remove clears
    // teamOwner, so removed members correctly fall through to plain 404).
    if (resp.status === 404) {
      try {
        const { response: licenseResponse, data: Item } =
          await getLicenseForAccount(ownerEmail);
        if (
          licenseResponse.ok &&
          (!Item.clerkId || Item.clerkId === user.id) &&
          Item?.tier === "team" &&
          typeof Item?.teamOwner === "string" &&
          Item.teamOwner &&
          Item.teamOwner.toLowerCase() !== ownerEmail.toLowerCase()
        ) {
          // "Active" mirrors the server's effective-status rules: paid, not
          // revoked, and inside the current cycle or its grace window. A bare
          // paid check would show "active" for canceled/expired teams (cancel
          // keeps paid=true by design).
          const now = Date.now();
          const inCycle =
            typeof Item.validUntil === "number" && now < Item.validUntil;
          const inGrace =
            typeof Item.gracePeriodUntil === "number" && now < Item.gracePeriodUntil;
          return NextResponse.json({
            memberOf: {
              ownerEmail: Item.teamOwner,
              licenseKey: typeof Item.key === "string" ? Item.key : null,
              active: Item.paid === true && Item.revoked !== true && (inCycle || inGrace),
              machineCount: Array.isArray(Item.machines) ? Item.machines.length : 0,
              licenseCount: typeof Item.licenseCount === "number" ? Item.licenseCount : 2,
            },
          });
        }
      } catch (err) {
        console.warn("[api/team] member-of lookup failed (non-fatal)", err);
      }
    }

    // Owners see the per-seat price their Team product actually charges (teams
    // on a retired product keep its rate); null when unknown.
    return NextResponse.json(
      resp.ok && data && typeof data === "object" && !Array.isArray(data)
        ? { ...data, seatPriceUsd: teamSeatPriceForProduct(data.productId) }
        : data,
      { status: resp.status },
    );
  } catch {
    return NextResponse.json({ error: "Unable to load your team. Please retry shortly." }, { status: 503 });
  }
}
