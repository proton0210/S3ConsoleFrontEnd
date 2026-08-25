import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const controlPlaneUrl = process.env.CONTROL_PLANE_V2_API_URL?.replace(/\/+$/, "");
  if (!controlPlaneUrl) {
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  }
  const template = process.env.CONTROL_PLANE_TOKEN_TEMPLATE?.trim();
  const token = await getToken(template ? { template } : undefined);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const upstream = await fetch(`${controlPlaneUrl}/v2/marketplace/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await upstream.json().catch(() => ({ error: "invalid_response" }));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 502 });
  }
}
