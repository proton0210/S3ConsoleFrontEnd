import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = constructMetadata({
  title: "Download S3Console — AWS S3 Client for Mac, Windows & Linux",
  description:
    "Download S3Console for free. Native AWS S3 desktop client for macOS, Windows, and Linux with a 14-day full-feature trial. No credit card required. Pricing from $9/month or $149 lifetime.",
  canonical: "/downloads",
});

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
