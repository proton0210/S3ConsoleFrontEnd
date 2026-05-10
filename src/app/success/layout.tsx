import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Payment Successful — S3Console",
  canonical: "/success",
  noindex: true,
  nofollow: true,
});

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
