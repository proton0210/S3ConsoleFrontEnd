import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: "Download S3Console - AWS S3 Desktop App",
  description: "Download S3Console for Mac & Windows. Professional AWS S3 bucket manager with AI Code Generation, Presigned URLs, and Multi-Profile Support. One-time payment, lifetime access.",
  canonical: "/downloads",
});

