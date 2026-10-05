import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  title: "Terms and Conditions — Buckets by ServerlessCreed",
  description:
    "Buckets by ServerlessCreed Terms and Conditions: license, subscription, refunds, liability, and jurisdiction.",
};

export default function TermsPage() {
  return <LegalDocPage filename="terms.md" />;
}
