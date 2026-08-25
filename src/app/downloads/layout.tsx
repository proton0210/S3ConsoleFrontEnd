import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = constructMetadata({
  title: "Download Serverless Buckets — AWS S3 Client for Mac, Windows & Linux",
  description:
    "Get Serverless Buckets for macOS and Linux, or install the Windows edition through Microsoft Store. Native AWS S3 desktop client with a 14-day full-feature trial.",
  canonical: "/downloads",
});

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
