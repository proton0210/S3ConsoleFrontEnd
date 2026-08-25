import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AWS Marketplace subscription",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface MarketplaceStatus {
  subscriptionStatus?: string;
  plan?: string | null;
  seats?: number | null;
  validUntil?: string | null;
  agreementCount?: number;
}

export default async function MarketplaceAccountPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account/marketplace");

  const controlPlaneUrl = process.env.CONTROL_PLANE_V2_API_URL?.replace(/\/+$/, "");
  const template = process.env.CONTROL_PLANE_TOKEN_TEMPLATE?.trim();
  const token = await getToken(template ? { template } : undefined);
  let status: MarketplaceStatus | null = null;
  let notLinked = false;
  let unavailable = !controlPlaneUrl || !token;

  if (!unavailable) {
    try {
      const response = await fetch(`${controlPlaneUrl}/v2/marketplace/status`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      notLinked = response.status === 404;
      if (response.ok) status = (await response.json()) as MarketplaceStatus;
      else if (!notLinked) unavailable = true;
    } catch {
      unavailable = true;
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">AWS Marketplace</p>
        <h1 className="mt-2 text-3xl font-bold">Serverless Buckets subscription</h1>
        <p className="mt-3 text-muted-foreground">
          View the Marketplace entitlement linked to your signed-in ServerlessCreed account.
        </p>
      </div>
      <section className="rounded-xl border p-6 space-y-4">
        {status ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Status</dt><dd className="font-semibold">{status.subscriptionStatus || "unknown"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Plan</dt><dd className="font-semibold">{status.plan || "Pending"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Seats</dt><dd className="font-semibold">{status.seats ?? "—"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Linked agreements</dt><dd className="font-semibold">{status.agreementCount ?? 0}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Valid until</dt><dd className="font-semibold">{status.validUntil ? new Date(status.validUntil).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" }) : "Determined by your AWS Marketplace agreement"}</dd></div>
          </dl>
        ) : notLinked ? (
          <p>No AWS Marketplace agreement is linked to this account. Return to your AWS Marketplace order and choose <strong>Set up your account</strong>.</p>
        ) : (
          <p>Subscription status is temporarily unavailable. Your agreement remains managed by AWS Marketplace; retry shortly or contact support.</p>
        )}
      </section>
      <div className="flex flex-wrap gap-3">
        <a className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/downloads">Downloads</a>
        <a className="rounded-md border px-4 py-2" href="mailto:vidit@serverlesscreed.com">Support</a>
      </div>
    </main>
  );
}
