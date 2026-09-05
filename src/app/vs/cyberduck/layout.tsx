import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Buckets by ServerlessCreed vs Cyberduck for AWS S3",
  description:
    "Looking for a Cyberduck alternative built for AWS S3? Buckets by ServerlessCreed is a cross-platform S3 client for Mac, Windows, and Linux with integrated S3 administration workflows. Compare authentication, platforms, transfers, and pricing to find the right fit.",
  canonical: "/vs/cyberduck",
});

export default function VsCyberduckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
