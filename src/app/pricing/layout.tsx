import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Pricing — S3Console AWS S3 Client (from $9/month, $149 lifetime)",
  description:
    "Simple pricing for S3Console, the AWS S3 desktop client for Mac, Windows, and Linux. $9/month, $79/year, or $149 one-time lifetime. 14-day free trial, no credit card.",
  canonical: "/pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
