import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "S3Console vs Cyberduck — The best Cyberduck alternative for AWS S3",
  description:
    "Looking for a Cyberduck alternative built for AWS S3? S3Console is a native S3 client for Mac, Windows, and Linux with AWS SSO, AI code generation, multi-profile support, and a visual policy editor — features Cyberduck doesn't have.",
  canonical: "/vs/cyberduck",
});

export default function VsCyberduckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
