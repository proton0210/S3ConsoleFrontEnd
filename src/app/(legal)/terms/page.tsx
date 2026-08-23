import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  title: "Terms and Conditions — Serverless Buckets",
  description:
    "Serverless Buckets Terms and Conditions: license, subscription, refunds, liability, and jurisdiction.",
};

export default function TermsPage() {
  return <LegalDocPage filename="terms.md" />;
}
