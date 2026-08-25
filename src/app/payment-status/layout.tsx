import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Payment Status — Buckets by ServerlessCreed",
  canonical: "/payment-status",
  noindex: true,
  nofollow: true,
});

export default function PaymentStatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
