/**
 * Shared auth + ownership check for the self-serve billing routes.
 *
 * Resolves the signed-in Clerk user, loads their license row and confirms
 * the row belongs to them. Routes get either the account or a ready-made
 * error response, so every billing endpoint applies the same rules.
 */
import "server-only";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseForAccount, type LicenseApiData } from "@/lib/license-api";

export type BillingAccount = {
  userId: string;
  email: string;
  license: LicenseApiData;
};

export async function resolveBillingAccount(): Promise<
  { ok: true; account: BillingAccount } | { ok: false; response: NextResponse }
> {
  const fail = (error: string, status: number) => ({
    ok: false as const,
    response: NextResponse.json({ error }, { status }),
  });

  const { userId } = await auth();
  if (!userId) return fail("Unauthorized", 401);

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim() || "";
  if (!email) return fail("No primary email on authenticated account", 400);

  const { response, data: license } = await getLicenseForAccount(email);
  if (response.status === 404) return fail("License not found", 404);
  if (!response.ok) {
    return fail(license.error || "License lookup failed", response.status);
  }
  if (license.clerkId && license.clerkId !== userId) {
    return fail("License does not belong to authenticated user", 403);
  }

  return { ok: true, account: { userId, email, license } };
}
