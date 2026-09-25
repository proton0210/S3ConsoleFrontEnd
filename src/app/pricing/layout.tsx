import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Pricing — Buckets by ServerlessCreed AWS S3 Client (from $5/month, $99 lifetime)",
  description:
    "Simple pricing for Buckets by ServerlessCreed, the AWS S3 desktop client for Mac, Windows, and Linux. $5/month, $49/year, or $99 one-time lifetime. 14-day free trial, no credit card.",
  canonical: "/pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
