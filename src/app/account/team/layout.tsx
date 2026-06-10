import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

// Private user-only page; explicitly noindex so it doesn't compete with
// the public landing pages for ranking authority.
export const metadata: Metadata = constructMetadata({
  title: "Team Management — S3Console",
  description: "Manage your S3Console team seats and members.",
  canonical: "/account/team",
  noindex: true,
});

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
