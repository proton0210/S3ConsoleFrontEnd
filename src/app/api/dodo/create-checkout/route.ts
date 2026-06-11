import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  getProductId,
  getDodoApiBaseUrl,
  isLicenseTier,
  MAX_TEAM_SEATS,
  MIN_TEAM_SEATS,
  type LicenseTier,
} from "@/lib/dodo";

type CreateCheckoutBody = {
  /** New tier-based flow (preferred). */
  tier?: string;
  /** Seat count for tier="team" (min MIN_TEAM_SEATS). Ignored for other tiers. */
  seats?: number;
  /** Pre-fill the customer email at Dodo checkout (used by trial-to-paid + magic links). */
  email?: string;
  /** Pre-fill the customer name. Dodo's CustomerRequest needs both email AND name
   * together — sending email alone fails deserialization. */
  name?: string;
  /** Free-form metadata persisted on the Dodo subscription/payment. Webhook reads this. */
  metadata?: Record<string, string>;
  /**
   * Legacy fallback — direct product ID. Kept for backward compatibility with
   * existing seat-add buttons (Phase 11 will remove those callers, then this
   * branch can be deleted).
   */
  productId?: string;
  quantity?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body: CreateCheckoutBody = await req.json();
    const { tier, seats, email, name, metadata, productId: legacyProductId, quantity } = body;

    // Resolve the signed-in Clerk user ONCE — used for name fallback, email
    // fallback, and (critically) the authoritative accountEmail stamped into
    // checkout metadata below.
    let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
    try {
      clerkUser = await currentUser();
    } catch {
      // Unauthenticated checkout (magic-link flow) — fall through.
    }
    const clerkEmail =
      clerkUser?.primaryEmailAddress?.emailAddress || undefined;

    // Effective email: explicit body email (magic links pre-select the row the
    // license belongs to) → Clerk session email for signed-in buyers. A
    // malformed body email (whitespace, missing @, etc.) is treated as absent
    // rather than forwarded to Dodo, which would 422 the checkout.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const bodyEmail = email?.trim();
    const effectiveEmail =
      (bodyEmail && EMAIL_RE.test(bodyEmail) ? bodyEmail : undefined) ||
      clerkEmail;

    // Dodo's CustomerRequest schema is an untagged enum: either { customer_id }
    // or { email, name }. Sending { email } alone fails deserialization.
    //
    // Name resolution priority: explicit body.name → Clerk's currentUser →
    // email local-part → "Customer". The Clerk fallback makes the route
    // self-healing for callers that forget to pass a name.
    let customer: { email: string; name: string } | undefined;
    if (effectiveEmail) {
      let resolvedName =
        name?.trim() ||
        clerkUser?.fullName?.trim() ||
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
        "";
      if (!resolvedName) {
        resolvedName =
          effectiveEmail.split("@")[0].replace(/[._-]+/g, " ").trim() || "Customer";
      }
      customer = { email: effectiveEmail, name: resolvedName };
    }

    // Read API key from env. Phase 11 will swap this for getSecretJson() reading
    // from Secrets Manager via DODO_API_KEY_SECRET_ARN.
    const token = process.env.DODO_API_KEY;
    if (!token) {
      return NextResponse.json(
        { error: "Server misconfigured: DODO_API_KEY is not set." },
        { status: 500 }
      );
    }

    // Resolve product ID from either tier (new) or productId (legacy).
    let productId: string;
    let resolvedTier: LicenseTier | null = null;

    if (tier !== undefined) {
      if (!isLicenseTier(tier)) {
        return NextResponse.json(
          { error: `Invalid tier: ${tier}. Expected one of: monthly, yearly, lifetime, team.` },
          { status: 400 }
        );
      }
      if (
        tier === "team" &&
        (!Number.isInteger(seats) ||
          (seats as number) < MIN_TEAM_SEATS ||
          (seats as number) > MAX_TEAM_SEATS)
      ) {
        return NextResponse.json(
          {
            error: `Team checkout requires between ${MIN_TEAM_SEATS} and ${MAX_TEAM_SEATS} seats. For larger teams, contact vidit@serverlesscreed.com.`,
          },
          { status: 400 }
        );
      }
      // Team rows are keyed by the OWNER's verified Clerk email — a
      // body-supplied email is NOT enough, since an unauthenticated caller
      // could stamp someone else's address as the team owner. The buy page
      // forces sign-in for team, so this only rejects direct API callers.
      if (tier === "team" && !clerkEmail) {
        return NextResponse.json(
          { error: "Team checkout requires a signed-in account." },
          { status: 401 }
        );
      }
      resolvedTier = tier;
      try {
        productId = getProductId(tier);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    } else if (legacyProductId) {
      // Legacy seat-add flow (will be removed in Phase 11). Must be one of OUR
      // products: an arbitrary id would create a checkout for another product
      // in the shared Dodo account stamped with OUR metadata.app, which the
      // webhooks would then mis-route (cross-product license minting).
      const ownProducts = [
        process.env.S3CONSOLE_DODO_PRODUCT_ID_MONTHLY,
        process.env.S3CONSOLE_DODO_PRODUCT_ID_YEARLY,
        process.env.S3CONSOLE_DODO_PRODUCT_ID_LIFETIME,
        process.env.S3CONSOLE_DODO_PRODUCT_ID_TEAM,
      ].filter(Boolean);
      if (!ownProducts.includes(legacyProductId)) {
        return NextResponse.json(
          { error: "Unknown productId." },
          { status: 400 }
        );
      }
      productId = legacyProductId;
    } else {
      return NextResponse.json(
        { error: "Missing tier (monthly|yearly|lifetime). Provide a tier in the request body." },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl?.origin || "";
    const baseUrl = getDodoApiBaseUrl();

    // Webhook reads this metadata to correlate the event to a license row.
    // We always include the tier so that webhook handlers can distinguish lifetime
    // vs subscription regardless of which endpoint Dodo emitted from.
    //
    // accountEmail is the AUTHORITATIVE row key: Dodo's hosted checkout lets
    // the buyer edit the pre-filled email, and the webhook must not key the
    // license by whatever they typed there (it would orphan the license from
    // their dashboard/Clerk identity). Metadata survives onto the
    // subscription and all its payment events, so the webhook prefers it
    // over customer.email. For team, the Clerk session email wins outright —
    // it's the identity /account/team will query with.
    const accountEmail =
      resolvedTier === "team"
        ? clerkEmail || effectiveEmail
        : effectiveEmail;
    // The routing keys (app/tier/accountEmail) are derived server-side and
    // must never come from the client: a spoofed tier:"team" would mint a
    // phantom team row in the webhook, and a spoofed accountEmail would key
    // someone else's row. Strip them from client metadata before merging.
    const {
      app: _app,
      tier: _tier,
      accountEmail: _accountEmail,
      ...clientMetadata
    } = metadata || {};
    const checkoutMetadata: Record<string, string> = {
      ...clientMetadata,
      ...(resolvedTier ? { tier: resolvedTier } : {}),
      ...(accountEmail ? { accountEmail } : {}),
      // Product marker — the Dodo account is shared across products and every
      // webhook endpoint receives every event; webhooks use this to drop the
      // other products' events. Keep last so client metadata can't spoof it.
      app: "s3console",
    };

    // Both subscription (monthly/yearly) and one-time (lifetime) flows go through
    // /checkouts. The product type (subscription vs one-time) is set on the product
    // in Dodo's dashboard, so the same endpoint handles both. /checkouts collects
    // billing address on the hosted checkout page; the direct /subscriptions REST
    // endpoint instead requires billing to be supplied up-front in the request body.
    // Team tier is per-seat: the Dodo line-item quantity IS the seat count.
    // The webhook reads it back via resolveSeatCount() to set seatsPurchased.
    const resolvedQuantity =
      resolvedTier === "team"
        ? (seats as number)
        : Math.max(1, Number(quantity) || 1);

    const endpoint = `${baseUrl}/checkouts`;
    const payload: Record<string, unknown> = {
      product_cart: [
        {
          product_id: productId,
          quantity: resolvedQuantity,
        },
      ],
      return_url: `${origin}/payment-status`,
      ...(customer ? { customer } : {}),
      ...(Object.keys(checkoutMetadata).length > 0
        ? { metadata: checkoutMetadata }
        : {}),
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Log server-side for diagnostics; don't echo Dodo's internal error structure
      // back to the client beyond a high-level message.
      console.error("[create-checkout] Dodo error", {
        status: resp.status,
        endpoint,
        productId,
        tier: resolvedTier,
        message: data?.message,
      });
      return NextResponse.json(
        {
          error: data?.message || "Failed to create checkout session",
        },
        { status: resp.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: data?.checkout_url,
      session_id: data?.session_id,
      subscription_id: data?.subscription_id,
      tier: resolvedTier,
    });
  } catch (err: any) {
    console.error("[create-checkout] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error creating checkout" },
      { status: 500 }
    );
  }
}
