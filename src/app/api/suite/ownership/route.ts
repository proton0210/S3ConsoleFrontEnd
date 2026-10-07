/**
 * /api/suite/ownership — what the signed-in person owns of the OTHER app.
 *
 * Feeds /suite, the pricing banner, the billing card and /buy so a Tables
 * Lifetime owner sees the $49 upgrade (sold on Tables) and someone who owns
 * both apps sees "you own the Suite" instead of an offer. The Tables answer
 * comes from the Tables backend by VERIFIED email only (one boolean); it is
 * best-effort here (null when unavailable) — the checkout route re-checks and
 * fails closed. Signed-out callers get `suite: null`.
 */
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseForAccount } from "@/lib/license-api";
import { isSuiteProductId, isSuiteUpgradeProductId } from "@/lib/dodo";
import { partnerLifetimeOrNull } from "@/lib/partner-license";
import { currentPlanFromLicense, ownsLifetime, type SuiteOwnership } from "@/lib/plan-options";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ suite: null }, { headers: NO_STORE });
    const user = await currentUser();
    const address = user?.primaryEmailAddress;
    const email = address?.emailAddress?.trim();
    // Never reveal another app's ownership for an address nobody proved.
    if (!email || address?.verification?.status !== "verified") {
      return NextResponse.json({ suite: null }, { headers: NO_STORE });
    }
    const [license, partnerLifetime] = await Promise.all([
      getLicenseForAccount(email).catch(() => null),
      partnerLifetimeOrNull(email),
    ]);
    const row = license?.response.ok && (!license.data.clerkId || license.data.clerkId === userId) ? license.data : null;
    // The personal license alone (a Lifetime owner may also own a Team, which
    // useCurrentPlan reports as "team" — that must not hide their $49 upgrade).
    const herePlan = currentPlanFromLicense(row);
    const suite: SuiteOwnership & { herePlan: typeof herePlan } = {
      partnerLifetime,
      // A Suite or Suite-upgrade grant here implies Tables Lifetime too.
      viaSuite: ownsLifetime(herePlan) &&
        (isSuiteProductId(row?.productId) || isSuiteUpgradeProductId(row?.productId)),
      herePlan,
    };
    return NextResponse.json({ suite }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ suite: null }, { headers: NO_STORE });
  }
}
