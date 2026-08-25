import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "buckets_marketplace_onboarding";

export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const user = await currentUser();
  const accountEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  if (!accountEmail || typeof body?.email !== "string" || body.email.trim().toLowerCase() !== accountEmail) {
    return NextResponse.json({ error: "Use the verified email address linked to your signed-in account." }, { status: 400 });
  }
  const cookieStore = await cookies();
  const onboardingToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!onboardingToken) {
    return NextResponse.json(
      { error: "The Marketplace registration session is missing or expired. Return to AWS Marketplace and choose Set up your account again." },
      { status: 410 },
    );
  }
  const controlPlaneUrl = process.env.CONTROL_PLANE_V2_API_URL?.replace(/\/+$/, "");
  if (!controlPlaneUrl) return NextResponse.json({ error: "Marketplace registration is temporarily unavailable." }, { status: 503 });
  const template = process.env.CONTROL_PLANE_TOKEN_TEMPLATE?.trim();
  const token = await getToken(template ? { template } : undefined);
  if (!token) return NextResponse.json({ error: "Unable to verify your session." }, { status: 401 });
  try {
    const upstream = await fetch(`${controlPlaneUrl}/v2/marketplace/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingToken, email: accountEmail }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await upstream.json().catch(() => null)) as Record<string, unknown> | null;
    const response = NextResponse.json(
      upstream.ok ? result : { error: "Unable to link this Marketplace purchase." },
      { status: upstream.status },
    );
    if (upstream.ok || upstream.status === 409 || upstream.status === 410) response.cookies.delete(COOKIE_NAME);
    return response;
  } catch {
    return NextResponse.json({ error: "Marketplace registration is temporarily unavailable." }, { status: 502 });
  }
}
