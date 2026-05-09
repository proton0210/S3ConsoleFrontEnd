import { NextRequest, NextResponse } from "next/server";
import {
  getProductId,
  getDodoApiBaseUrl,
  isLicenseTier,
  isSubscriptionTier,
  type LicenseTier,
} from "@/lib/dodo";

type CreateCheckoutBody = {
  /** New tier-based flow (preferred). */
  tier?: string;
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
    const { tier, email, name, metadata, productId: legacyProductId, quantity } = body;

    // Dodo's /subscriptions endpoint REQUIRES `customer`. The CustomerRequest
    // schema is an untagged enum: either { customer_id } or { email, name }.
    // Sending { email } alone, or omitting customer entirely, both 422.
    //
    // We derive a name from the email local-part when callers don't supply
    // one (e.g. Clerk users who signed up without setting first/last name).
    // The user can edit the name on Dodo's hosted checkout if it's wrong.
    let customer: { email: string; name: string } | undefined;
    if (email) {
      const derivedName =
        name?.trim() ||
        email.split("@")[0].replace(/[._-]+/g, " ").trim() ||
        "Customer";
      customer = { email, name: derivedName };
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

    // Resolve product ID + endpoint from either tier (new) or productId (legacy).
    let productId: string;
    let useSubscriptionEndpoint = false;
    let resolvedTier: LicenseTier | null = null;

    if (tier !== undefined) {
      if (!isLicenseTier(tier)) {
        return NextResponse.json(
          { error: `Invalid tier: ${tier}. Expected one of: monthly, yearly, lifetime.` },
          { status: 400 }
        );
      }
      resolvedTier = tier;
      try {
        productId = getProductId(tier);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      useSubscriptionEndpoint = isSubscriptionTier(tier);
    } else if (legacyProductId) {
      // Legacy seat-add flow (will be removed in Phase 11).
      productId = legacyProductId;
      useSubscriptionEndpoint = false;
    } else {
      return NextResponse.json(
        { error: "Missing tier (monthly|yearly|lifetime). Provide a tier in the request body." },
        { status: 400 }
      );
    }

    // /subscriptions requires customer (email + name). For lifetime via
    // /checkouts the customer object is optional. Fail fast with a clean
    // message rather than letting Dodo return an opaque 422.
    if (useSubscriptionEndpoint && !customer) {
      return NextResponse.json(
        {
          error:
            "Email is required for monthly and yearly plans. Please sign in or provide an email address.",
        },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl?.origin || "";
    const baseUrl = getDodoApiBaseUrl();

    // Webhook reads this metadata to correlate the event to a license row.
    // We always include the tier so that webhook handlers can distinguish lifetime
    // vs subscription regardless of which endpoint Dodo emitted from.
    const checkoutMetadata: Record<string, string> = {
      ...(metadata || {}),
      ...(resolvedTier ? { tier: resolvedTier } : {}),
    };

    let endpoint: string;
    let payload: Record<string, unknown>;

    if (useSubscriptionEndpoint) {
      // Monthly / yearly — Dodo subscription. Auto-renews until canceled.
      // The /subscriptions endpoint requires top-level `quantity` (unlike
      // /checkouts which nests quantity inside product_cart items). Omitting
      // it returns: "missing field `quantity`".
      endpoint = `${baseUrl}/subscriptions`;
      payload = {
        product_id: productId,
        quantity: Math.max(1, Number(quantity) || 1),
        return_url: `${origin}/payment-status`,
        ...(customer ? { customer } : {}),
        ...(Object.keys(checkoutMetadata).length > 0
          ? { metadata: checkoutMetadata }
          : {}),
      };
    } else {
      // Lifetime — one-time payment via /checkouts.
      endpoint = `${baseUrl}/checkouts`;
      payload = {
        product_cart: [
          {
            product_id: productId,
            quantity: Math.max(1, Number(quantity) || 1),
          },
        ],
        return_url: `${origin}/payment-status`,
        ...(customer ? { customer } : {}),
        ...(Object.keys(checkoutMetadata).length > 0
          ? { metadata: checkoutMetadata }
          : {}),
      };
    }

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
      // Subscriptions API returns checkout_url; one-time /checkouts also returns checkout_url.
      // Both also return their primary identifier (subscription_id vs session_id).
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
