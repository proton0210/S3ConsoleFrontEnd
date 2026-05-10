import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

// Private user-only page; explicitly noindex so it doesn't compete with
// the public landing pages for ranking authority.
export const metadata: Metadata = constructMetadata({
  title: "Billing & Subscription — S3Console",
  description: "Manage your S3Console subscription, payment method, and invoices.",
  canonical: "/account/billing",
  noindex: true,
  nofollow: true,
});

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
