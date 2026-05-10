import Link from "next/link";
import Section from "@/components/section";
import Header from "@/components/sections/header";
import { Button } from "@/components/ui/button";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: "Payment Canceled - S3Console",
  description: "Your payment was canceled. You can try purchasing S3Console again anytime.",
  canonical: "/downloads/cancel",
  noindex: true,
});

export default function CancelPage() {
  return (
    <>
      <Header />
      <main>
        <Section title="Payment Canceled" className="py-20 text-center">
          <p className="text-lg text-slate-700">
            Payment was canceled. You can try again anytime.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/pricing">
              <Button size="lg">See plans &amp; pricing</Button>
            </Link>
            <Link href="/downloads">
              <Button size="lg" variant="outline">
                Back to Downloads
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-primary underline">
              &larr; Back to Home
            </Link>
          </div>
        </Section>
      </main>
    </>
  );
}
