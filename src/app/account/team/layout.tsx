import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

// Private user-only page; explicitly noindex so it doesn't compete with
// the public landing pages for ranking authority.
export const metadata: Metadata = constructMetadata({
  title: "Team Management — Buckets by ServerlessCreed",
  description: "Manage your Buckets by ServerlessCreed team seats and members.",
  canonical: "/account/team",
  noindex: true,
});

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
