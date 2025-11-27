import Section from "@/components/section";
import Header from "@/components/sections/header";
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
          <p className="text-lg">Payment was canceled. You can try again anytime.</p>
        </Section>
      </main>
    </>
  );
}
