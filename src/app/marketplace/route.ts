import { NextResponse } from "next/server";

const COOKIE_NAME = "buckets_marketplace_onboarding";

function completionUrl(request: Request, error?: string) {
  const url = new URL("/marketplace/complete", request.url);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function GET(request: Request) {
  return NextResponse.redirect(completionUrl(request, "registration_required"), 303);
}

export async function POST(request: Request) {
  const controlPlaneUrl = process.env.CONTROL_PLANE_V2_API_URL?.replace(/\/+$/, "");
  if (!controlPlaneUrl) {
    console.error("Marketplace fulfillment is not configured");
    return NextResponse.redirect(completionUrl(request, "temporarily_unavailable"), 303);
  }
  const form = await request.formData().catch(() => null);
  const registrationToken = form?.get("x-amzn-marketplace-token");
  if (typeof registrationToken !== "string" || registrationToken.length < 20 || registrationToken.length > 4096) {
    return NextResponse.redirect(completionUrl(request, "invalid_registration"), 303);
  }
  try {
    const upstream = await fetch(`${controlPlaneUrl}/v2/marketplace/fulfillment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await upstream.json().catch(() => null)) as { onboardingToken?: unknown } | null;
    if (!upstream.ok || typeof result?.onboardingToken !== "string" || result.onboardingToken.length < 32) {
      console.warn(`Marketplace fulfillment failed with status ${upstream.status}`);
      return NextResponse.redirect(completionUrl(request, "invalid_or_inactive_purchase"), 303);
    }
    const response = NextResponse.redirect(completionUrl(request), 303);
    response.cookies.set(COOKIE_NAME, result.onboardingToken, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 60,
    });
    return response;
  } catch {
    console.error("Marketplace fulfillment service could not be reached");
    return NextResponse.redirect(completionUrl(request, "temporarily_unavailable"), 303);
  }
}

