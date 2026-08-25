import type { Metadata } from "next";
import MarketplaceRegistrationForm from "./marketplace-registration-form";

export const metadata: Metadata = {
  title: "Complete AWS Marketplace registration",
  robots: { index: false, follow: false },
};

export default async function MarketplaceCompletePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">AWS Marketplace</p>
        <h1 className="mt-2 text-3xl font-bold">Complete Serverless Buckets registration</h1>
        <p className="mt-3 text-muted-foreground">
          Link this purchase to your authenticated ServerlessCreed account. The AWS one-time registration token has already been consumed server-side and is not stored in your browser.
        </p>
      </div>
      <MarketplaceRegistrationForm initialError={error} />
    </main>
  );
}

