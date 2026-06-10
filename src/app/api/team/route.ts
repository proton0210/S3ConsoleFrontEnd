import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDdbClientConfig } from "@/lib/dynamodb";

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(getDdbClientConfig())
);
const TABLE_NAME = "S3Console";

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
  const user = await currentUser();
  const ownerEmail = user?.primaryEmailAddress?.emailAddress;
  if (!ownerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.LICENSE_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: LICENSE_API_URL / LICENSE_API_KEY not set." },
      { status: 500 }
    );
  }

  const resp = await fetch(
    `${apiUrl}/team?ownerEmail=${encodeURIComponent(ownerEmail)}`,
    { headers: { "x-api-key": apiKey }, cache: "no-store" }
  );
  const data = await resp.json().catch(() => ({}));

  // Not an owner — are they a MEMBER of someone's team? Their own license
  // row says so (team-invite stamps tier + teamOwner; team-remove clears
  // teamOwner, so removed members correctly fall through to plain 404).
  if (resp.status === 404) {
    try {
      const { Item } = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { email: ownerEmail },
        })
      );
      if (
        Item?.tier === "team" &&
        typeof Item?.teamOwner === "string" &&
        Item.teamOwner &&
        Item.teamOwner !== ownerEmail
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

  return NextResponse.json(data, { status: resp.status });
}
