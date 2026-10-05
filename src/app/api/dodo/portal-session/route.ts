import { isInvoicePortalUrl, isInvoiceProduct } from "@/lib/invoice-access";
/**
 * Dodo customer-portal session minter.
 *
 * Mints a single-use session URL that takes the customer to Dodo's hosted
 * portal where they can:
 *   - Update payment method
 *   - Cancel subscription
 *   - View invoice history
 *   - Retrieve license keys
 *
 * Auth: requires the requesting user's email + verified Clerk session.
 *       The license row's `dodoCustomerId` is the Dodo customer ID (captured
 *       by the webhook on first subscription event).
 *
 * Reference: POST /customers/{customer_id}/customer-portal/session
 *            Bearer DODO_API_KEY → returns { link: "https://..." }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDodoApiBaseUrl, getProductAppOrigin } from "@/lib/dodo";
import { getLicenseForAccount, getTeamByOwner } from "@/lib/license-api";

function portalJson(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return NextResponse.json(body, { ...init, headers: { ...init.headers, "Cache-Control": "no-store" } });
}
export async function POST(req: NextRequest) {
  try {
    // 1. Auth — only the user themselves can mint a portal link for their account.
    const { userId } = await auth();
    if (!userId) {
      return portalJson({ error: "Unauthorized" }, { status: 401 });
    }

    // The existing browser body may still contain an email, but it is never an
    // authorization input. Select the billing row from the Clerk account.
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim() || "";
    if (!email || user?.primaryEmailAddress?.verification?.status !== "verified") {
      return portalJson(
        { error: "No primary email on authenticated account" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body?.scope !== undefined && body.scope !== "personal" && body.scope !== "team") return portalJson({ error: "Choose personal or team billing." }, { status: 400 });
    const forTeam = body?.scope === "team";
    // Team owners can retain a personal Lifetime license with a different
    // Dodo customer. Resolve the billing entity explicitly from the session.

    const { response: licenseResponse, data: accountLicense } =
      await (forTeam ? getTeamByOwner(email, userId) : getLicenseForAccount(email));
    let license = accountLicense;
    if (licenseResponse.status === 404) {
      return portalJson(
        { error: "License not found for this email" },
        { status: 404 }
      );
    }

    if (!licenseResponse.ok) {
      return portalJson(
        { error: license.error || "License lookup failed" },
        { status: licenseResponse.status },
      );
    }

    // Defense-in-depth: confirm the requesting Clerk user owns this license row.
    if (!isInvoiceProduct(license) || (!forTeam && license.email && license.email.toLowerCase() !== email.toLowerCase()) || (license.clerkId && license.clerkId !== userId) || (forTeam && (license.ownerEmail?.toLowerCase() !== email.toLowerCase() || (license.ownerClerkId && license.ownerClerkId !== userId)))) {
      return portalJson(
        { error: "License does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    if (!forTeam && license.teamOwner && license.teamOwner.toLowerCase() !== email.toLowerCase()) {
      return portalJson({ error: "Team billing is managed by your team owner." }, { status: 403 });
    }
    if (!forTeam && license.tier === "team") {
      const team = await getTeamByOwner(email, userId);
      if (!team.response.ok) return portalJson({ error: "Team billing is still synchronizing. Please retry." }, { status: 409 });
      if (!isInvoiceProduct(team.data) || team.data.ownerEmail?.toLowerCase() !== email.toLowerCase() || (team.data.ownerClerkId && team.data.ownerClerkId !== userId)) {
        return portalJson({ error: "Only the team owner can open team billing." }, { status: 403 });
      }
      // Never retain a seat row's inherited customer when canonical TEAM lacks one.
      license = { ...license, ...team.data, dodoCustomerId: team.data.dodoCustomerId };
    }
    const dodoCustomerId = license.dodoCustomerId;
    if (!dodoCustomerId || typeof dodoCustomerId !== "string") {
      // Race: webhook hasn't landed yet, or this is a lifetime user with
      // no recurring billing to manage.
      return portalJson(
        {
          error:
            "Customer portal not yet available — try again in a moment, or contact support if this persists.",
          reason: license.tier === "lifetime" ? "lifetime_no_billing" : "pending_webhook",
        },
        { status: 409 }
      );
    }

    // 3. Mint the portal session via Dodo.
    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[portal-session] DODO_API_KEY not set");
      return portalJson({ error: "Server misconfigured" }, { status: 500 });
    }

    const baseUrl = getDodoApiBaseUrl();
    // Send the user back to the billing dashboard so they immediately see the
    // updated state. The `?from=portal` marker tells the dashboard to poll
    // for the inbound webhook (cancel / payment-method update / etc.) for a
    // few seconds before settling.
    const returnUrl = new URL(
      body?.returnTo === "invoices" ? "/account/invoices?from=portal" : forTeam ? "/account/team?from=portal" : "/account/billing?from=portal",
      getProductAppOrigin(req.nextUrl.origin)
    ).toString();

    const portalUrl = new URL(
      `${baseUrl}/customers/${encodeURIComponent(dodoCustomerId)}/customer-portal/session`
    );
    // The portal page redirects back to return_url after the user is done.
    portalUrl.searchParams.set("return_url", returnUrl);
    portalUrl.searchParams.set("send_email", "false");

    const resp = await fetch(portalUrl.toString(), {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !isInvoicePortalUrl(data?.link)) {
      console.error("[portal-session] Dodo error", {
        status: resp.status,
      });
      return portalJson(
        {
          error: "Could not open the billing portal. Please retry.",
        },
        { status: resp.status >= 400 ? resp.status : 502 }
      );
    }

    return portalJson({ success: true, link: data.link }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[portal-session] Unexpected request failure.");
    return portalJson(
      { error: "Billing is temporarily unavailable. Please retry." },
      { status: 500 }
    );
  }
}
