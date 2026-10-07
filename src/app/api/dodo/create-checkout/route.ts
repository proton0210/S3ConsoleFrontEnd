import { purchaseGeneration, runBillingOperation } from "@/lib/billing-operation";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getProductId,
  getPurchasableProductIds,
  getDodoApiBaseUrl,
  getCheckoutReturnUrl,
  getTierForProductId,
  getSuiteProductId,
  getSuiteUpgradeProductId,
  isCheckoutTier,
  MAX_TEAM_SEATS,
  MIN_TEAM_SEATS,
  type LicenseTier,
} from "@/lib/dodo";
import { isMaintenanceMode } from "@/lib/maintenance";
import { getLicenseForAccount, getTeamByOwner } from "@/lib/license-api";
import {
  checkoutAllowed,
  checkoutBlockedHref,
  checkoutBlockedMessage,
  currentPlanFromLicense,
  suitePartnerBlock,
  TEAM_URL,
  type CheckoutTarget,
} from "@/lib/plan-options";
import {
  SUITE_APP_ID,
  SUITE_BUNDLE_ID,
  SUITE_CHECKOUT_TIER,
  SUITE_ORIGIN_APP,
  SUITE_RETURN_PARAM,
  SUITE_UPGRADE_BUNDLE_ID,
  SUITE_UPGRADE_CHECKOUT_TIER,
  SUITE_UPGRADE_RETURN_PARAM,
  SUITE_UPGRADE_TARGET_APP,
} from "@/lib/suite-offer";
import { partnerLookupConfigured, partnerOwnsLifetime } from "@/lib/partner-license";

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

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
export async function POST(req: NextRequest) {
  if (isMaintenanceMode()) {
    return NextResponse.json(
      {
        error:
          "Purchases are temporarily paused during scheduled authentication maintenance. Please try again shortly.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "900",
        },
      }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to start checkout." },
        { status: 401 }
      );
    }

    const body: CreateCheckoutBody = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
    }
    const { tier, seats, email, name, metadata, productId: legacyProductId, quantity } = body;

    // Resolve the signed-in Clerk user ONCE — used for name fallback, email
    // fallback, and (critically) the authoritative accountEmail stamped into
    // checkout metadata below.
    const clerkUser = await currentUser();
    const clerkEmail =
      clerkUser?.primaryEmailAddress?.emailAddress || undefined;
    if (!clerkEmail || clerkUser?.primaryEmailAddress?.verification?.status !== "verified") {
      return NextResponse.json(
        { error: "A verified account email is required to start checkout." },
        { status: 400 }
      );
    }

    // The body email controls only the Dodo receipt/customer prefill. Account
    // ownership always comes from the authenticated Clerk subject/email below.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const bodyEmail = typeof email === "string" ? email.trim() : undefined;
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
        (typeof name === "string" ? name.trim() : "") ||
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
    // The Tables + Buckets Suite: one Dodo product that grants Lifetime here
    // AND on Tables. Everything below treats it as a Lifetime purchase; only
    // the product and the metadata markers differ.
    const isSuite = tier === SUITE_CHECKOUT_TIER;
    // The Suite upgrade: a Buckets Lifetime owner adds Tables Lifetime for the
    // upgrade price. It grants nothing HERE — the payment is routed to the
    // Tables webhook by metadata.app — so it is a Lifetime-shaped one-time
    // checkout whose only eligibility rule is "owns Buckets Lifetime".
    const isSuiteUpgrade = tier === SUITE_UPGRADE_CHECKOUT_TIER;

    if (tier !== undefined) {
      if (!isCheckoutTier(tier)) {
        return NextResponse.json(
          { error: `Invalid tier: ${tier}. Expected one of: monthly, yearly, lifetime, team, suite, suite-upgrade.` },
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
            error: `Team checkout requires between ${MIN_TEAM_SEATS} and ${MAX_TEAM_SEATS} seats. For larger teams, contact buckets@serverlesscreed.com.`,
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
      resolvedTier = isSuite || isSuiteUpgrade ? "lifetime" : tier;
      try {
        productId = isSuite ? getSuiteProductId() : isSuiteUpgrade ? getSuiteUpgradeProductId() : getProductId(tier);
      } catch (error: unknown) {
        return NextResponse.json(
          { error: errorMessage(error, "Product is not configured") },
          { status: 500 }
        );
      }
    } else if (legacyProductId) {
      // Legacy seat-add flow (will be removed in Phase 11). Must be one of OUR
      // products: an arbitrary id would create a checkout for another product
      // in the shared Dodo account stamped with OUR metadata.app, which the
      // webhooks would then mis-route (cross-product license minting).
      // Retired products (e.g. the old $99 Team product) are not for sale.
      const ownProducts = getPurchasableProductIds();
      if (!ownProducts.includes(legacyProductId)) {
        return NextResponse.json(
          { error: "Unknown productId." },
          { status: 400 }
        );
      }
      productId = legacyProductId;
      resolvedTier = getTierForProductId(productId);
    } else {
      return NextResponse.json(
        { error: "Missing tier (monthly|yearly|lifetime). Provide a tier in the request body." },
        { status: 400 }
      );
    }

    // Legacy product IDs must obey exactly the same quantity/plan rules.
    const purchaseTier = resolvedTier;
    // What the plan policy judges: the Suite has its own copy for Lifetime owners.
    const policyTarget: CheckoutTarget | null = isSuite ? SUITE_CHECKOUT_TIER : isSuiteUpgrade ? SUITE_UPGRADE_CHECKOUT_TIER : purchaseTier;
    const resolvedQuantity = purchaseTier === "team" ? (seats ?? quantity) : 1;
    if (!purchaseTier || (purchaseTier === "team" &&
      (!Number.isInteger(resolvedQuantity) || Number(resolvedQuantity) < MIN_TEAM_SEATS || Number(resolvedQuantity) > MAX_TEAM_SEATS))) {
      return NextResponse.json({ error: `Team checkout requires between ${MIN_TEAM_SEATS} and ${MAX_TEAM_SEATS} seats.` }, { status: 400 });
    }
    if (purchaseTier !== "team" && quantity !== undefined && quantity !== 1) {
      return NextResponse.json({ error: "Individual plans include one license. Use a Team plan for multiple seats." }, { status: 400 });
    }

    // A failed lookup is not evidence that this account has no plan. Fail
    // closed so an outage cannot sell a second subscription or erase Lifetime.
    let generation: unknown;
    const verifyCurrentPlan = async () => {
    try {
      const { response: licenseResponse, data: license } = await getLicenseForAccount(clerkEmail);
      if (licenseResponse.ok) {
        if (license.clerkId && license.clerkId !== userId) {
          return NextResponse.json({ error: "License does not belong to authenticated user." }, { status: 403 });
        }
      } else if (licenseResponse.status !== 404) {
        return NextResponse.json({ error: "Unable to verify your current plan. Please retry shortly." }, { status: 503 });
      }
      // No row at all is "none": every plan may be bought, except the Suite
      // upgrade, which is priced for existing Buckets Lifetime owners.
      const current = licenseResponse.ok ? currentPlanFromLicense(license) : "none";
      // The Suite and the Suite upgrade both sell a Tables Lifetime. Ask the
      // Tables backend first: someone who already owns it would pay for it
      // again (the Tables webhook keeps their original purchase). Fails closed
      // — a failed lookup throws into the 503 below, never a $49 charge for
      // nothing. Skipped only where unconfigured (local dev; validate-env
      // requires it for every hosted build).
      if ((isSuite || isSuiteUpgrade) && partnerLookupConfigured()) {
        const partnerBlock = suitePartnerBlock(current, policyTarget!, await partnerOwnsLifetime(clerkEmail));
        if (partnerBlock) {
          return NextResponse.json({
            error: partnerBlock.message,
            code: partnerBlock.code,
            currentPlan: current,
            manageUrl: partnerBlock.href,
            cta: partnerBlock.cta,
          }, { status: 409 });
        }
      }
      if (!checkoutAllowed(current, policyTarget!)) {
        return NextResponse.json({
          error: checkoutBlockedMessage(current, policyTarget!),
          code: isSuiteUpgrade ? "lifetime_required" : "plan_already_owned",
          currentPlan: current,
          manageUrl: checkoutBlockedHref(current, policyTarget!),
        }, { status: 409 });
      }
      // Team ownership is separate from the personal license. An owner may
      // retain Lifetime, so checking only that row would allow duplicate teams.
      const { response: teamResponse, data: team } = await getTeamByOwner(clerkEmail, userId);
      if (teamResponse.ok && team.ownerClerkId && team.ownerClerkId !== userId) {
        return NextResponse.json({ error: "Team does not belong to authenticated user." }, { status: 403 });
      }
      // The Suite upgrade sells a TABLES Lifetime to someone whose personal
      // Buckets Lifetime was verified above; owning a Buckets Team as well
      // does not change that, so only other purchases stop at an owned team.
      if (!isSuiteUpgrade && teamResponse.ok && team.subscriptionId &&
        !["canceled", "cancelled", "expired", "failed"].includes(team.subscriptionStatus)) {
        return NextResponse.json({ error: "Your account already owns a Team subscription. Manage it from your Team page.", manageUrl: TEAM_URL }, { status: 409 });
      }
      if (!teamResponse.ok && teamResponse.status !== 404) {
        return NextResponse.json({ error: "Unable to verify your team plan. Please retry shortly." }, { status: 503 });
      }
      generation = purchaseGeneration(license, team);
    } catch {
      return NextResponse.json({ error: "Unable to verify your current plan. Please retry shortly." }, { status: 503 });
    }
    return null;
    };
    const initialBlock = await verifyCurrentPlan();
    if (initialBlock) return initialBlock;

    const baseUrl = getDodoApiBaseUrl();

    // Webhook reads this metadata to correlate the event to a license row.
    // We always include the tier so that webhook handlers can distinguish lifetime
    // vs subscription regardless of which endpoint Dodo emitted from.
    //
    // accountEmail is the legacy compatibility row key: Dodo's hosted checkout lets
    // the buyer edit the pre-filled email, and the webhook must not key the
    // license by whatever they typed there (it would orphan the license from
    // their dashboard/Clerk identity). Metadata survives onto the
    // subscription and all its payment events, so the webhook prefers it
    // over customer.email. For team, the Clerk session email wins outright —
    // it's the identity /account/team will query with.
    const accountEmail = clerkEmail;
    // The routing keys (app/tier/accountEmail) are derived server-side and
    // must never come from the client: a spoofed tier:"team" would mint a
    // phantom team row in the webhook, and a spoofed accountEmail would key
    // someone else's row. Strip them from client metadata before merging.
    const protectedMetadataKeys = new Set([
      "app",
      "tier",
      "bundle",
      "originApp",
      "accountEmail",
      "accountSubject",
      // Legacy alias of accountSubject still read by the webhooks.
      "clerkId",
      "checkoutAttemptId",
      "billingOperationId",
    ]);
    const clientMetadata = Object.fromEntries(
      Object.entries(metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}).filter(
        ([key, value]) => !protectedMetadataKeys.has(key) && typeof value === "string"
      )
    );
    return runBillingOperation({
      subject: userId, email: clerkEmail, resource: "checkout",
      intent: { productId, quantity: resolvedQuantity, ...(isSuite ? { bundle: SUITE_BUNDLE_ID } : isSuiteUpgrade ? { bundle: SUITE_UPGRADE_BUNDLE_ID } : {}) }, generation,
      expected: { productId, quantity: Number(resolvedQuantity) },
    }, async ({ operationId: checkoutAttemptId, mutate }) => {
    // A request may have waited while another checkout purchased a plan.
    // Recheck under ownership, including TEAM authority before owner fan-out.
    const currentBlock = await verifyCurrentPlan();
    if (currentBlock) return currentBlock;
    const checkoutMetadata: Record<string, string> = {
      ...clientMetadata,
      ...(resolvedTier ? { tier: resolvedTier } : {}),
      ...(accountEmail ? { accountEmail } : {}),
      accountSubject: userId,
      checkoutAttemptId,
      // Product marker — the Dodo account is shared across products and every
      // webhook endpoint receives every event; webhooks use this to drop the
      // other products' events. Keep last so client metadata can't spoof it.
      // A Suite purchase is claimed by BOTH webhooks (app=serverless-suite);
      // originApp tells the Tables webhook that accountSubject is a Buckets
      // Clerk id it must not bind to its row (separate Clerk instances).
      // A Suite upgrade is claimed ONLY by the Tables webhook (app is the
      // Tables marker); originApp tells it the subject is a Buckets Clerk id
      // and lets the Buckets webhook refuse the event even if misrouted.
      ...(isSuite
        ? { app: SUITE_APP_ID, bundle: SUITE_BUNDLE_ID, originApp: SUITE_ORIGIN_APP }
        : isSuiteUpgrade
          ? { app: SUITE_UPGRADE_TARGET_APP, bundle: SUITE_UPGRADE_BUNDLE_ID, originApp: SUITE_ORIGIN_APP }
          : { app: "serverless-buckets" }),
    };

    // Both subscription (monthly/yearly) and one-time (lifetime) flows go through
    // /checkouts. The product type (subscription vs one-time) is set on the product
    // in Dodo's dashboard, so the same endpoint handles both. /checkouts collects
    // billing address on the hosted checkout page; the direct /subscriptions REST
    // endpoint instead requires billing to be supplied up-front in the request body.
    // Team tier is per-seat: the Dodo line-item quantity IS the seat count.
    // The webhook reads it back via resolveSeatCount() to set seatsPurchased.
    const returnUrl = new URL(getCheckoutReturnUrl(req.nextUrl?.origin));
    returnUrl.searchParams.set("checkout_attempt_id", checkoutAttemptId);
    returnUrl.searchParams.set("expected_tier", purchaseTier);
    // The status page confirms the Buckets row (expected_tier=lifetime) and
    // explains where the Tables license is.
    if (isSuite) returnUrl.searchParams.set("bundle", SUITE_RETURN_PARAM);
    // A Suite upgrade never writes the Buckets row, so the status page cannot
    // confirm it by polling: it reports Dodo's own status and points to Tables.
    if (isSuiteUpgrade) returnUrl.searchParams.set("bundle", SUITE_UPGRADE_RETURN_PARAM);

    const endpoint = `${baseUrl}/checkouts`;
    const payload: Record<string, unknown> = {
      product_cart: [
        {
          product_id: productId,
          quantity: resolvedQuantity,
        },
      ],
      return_url: returnUrl.toString(),
      ...(customer ? { customer } : {}),
      ...(Object.keys(checkoutMetadata).length > 0
        ? { metadata: checkoutMetadata }
        : {}),
    };

    const resp = await mutate(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.checkout_url) {
      // Log server-side for diagnostics; don't echo Dodo's internal error structure
      // back to the client beyond a high-level message.
      console.error("[create-checkout] Dodo error", {
        status: resp.status,
      });
      return NextResponse.json(
        {
          error: data?.message || "Failed to create checkout session",
        },
        { status: resp.ok ? 502 : resp.status }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: data?.checkout_url,
      session_id: data?.session_id,
      subscription_id: data?.subscription_id,
      tier: resolvedTier,
      ...(isSuite ? { bundle: SUITE_BUNDLE_ID } : isSuiteUpgrade ? { bundle: SUITE_UPGRADE_BUNDLE_ID } : {}),
    });
    });
  } catch (error: unknown) {
    console.error("[create-checkout] Unexpected request failure.");
    return NextResponse.json(
      { error: errorMessage(error, "Unexpected error creating checkout") },
      { status: 500 }
    );
  }
}
