import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "AWS S3 Client for Mac, Windows & Linux — S3Console",
  description:
    "Looking for an AWS S3 client? S3Console is a native desktop S3 client for macOS, Windows, and Linux. AI code generation, presigned URLs, multi-profile SSO, and a visual bucket policy editor. 14-day free trial.",
  canonical: "/aws-s3-client",
});

export default function AwsS3ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
