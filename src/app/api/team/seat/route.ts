import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * POST /api/team/seat — suspend, reinstate, or issue a new key for one seat
 * on the signed-in owner's team. Body: { memberEmail, action }
 *
 * ownerEmail always comes from the Clerk session, so a caller can only
 * manage their own team. Membership and ownership are enforced by the
 * backend POST /team/seat Lambda.
 */
const SEAT_ACTIONS = ["revoke", "reinstate", "rotate"] as const;

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const ownerEmail = user?.primaryEmailAddress?.emailAddress;
  if (!ownerEmail || user?.primaryEmailAddress?.verification?.status !== "verified") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { memberEmail?: unknown; action?: unknown };
  const memberEmail = typeof body.memberEmail === "string" ? body.memberEmail.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)) {
    return NextResponse.json({ error: "A valid memberEmail is required" }, { status: 400 });
  }
  const action = body.action;
  if (!SEAT_ACTIONS.includes(action as (typeof SEAT_ACTIONS)[number])) {
    return NextResponse.json({ error: `action must be one of ${SEAT_ACTIONS.join(", ")}` }, { status: 400 });
  }

  const apiUrl = process.env.LICENSE_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: LICENSE_API_URL / LICENSE_API_KEY not set." },
      { status: 500 }
    );
  }

  const resp = await fetch(`${apiUrl}/team/seat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ ownerEmail, ownerSubject: user.id, memberEmail, action }),
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
