import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

// Magic-link checkout redirect — no SEO value. Block from index.
export const metadata: Metadata = constructMetadata({
  title: "Checkout — S3Console",
  canonical: "/buy",
  noindex: true,
  nofollow: true,
});

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
