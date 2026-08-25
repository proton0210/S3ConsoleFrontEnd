import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  title: "Trust Center — Security, Privacy, and Architecture",
  description:
    "Buckets by ServerlessCreed security architecture, data flow, recovery, vulnerability disclosure, release assurance, and current AWS assurance status.",
  alternates: { canonical: "/trust" },
};

export default function TrustPage() {
  return <LegalDocPage filename="trust.md" />;
}

