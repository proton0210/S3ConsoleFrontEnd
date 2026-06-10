import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * POST /api/team/remove — remove a member from the signed-in owner's team
 * and free the seat. Body: { memberEmail }
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  const ownerEmail = user?.primaryEmailAddress?.emailAddress;
  if (!ownerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberEmail } = (await req.json().catch(() => ({}))) as {
    memberEmail?: string;
  };
  if (!memberEmail) {
    return NextResponse.json({ error: "memberEmail is required" }, { status: 400 });
  }

  const apiUrl = process.env.LICENSE_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: LICENSE_API_URL / LICENSE_API_KEY not set." },
      { status: 500 }
    );
  }

  const resp = await fetch(`${apiUrl}/team/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ ownerEmail, memberEmail }),
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
