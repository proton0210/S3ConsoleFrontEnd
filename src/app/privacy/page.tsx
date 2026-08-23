import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Serverless Buckets",
  description:
    "Serverless Buckets Privacy Policy: how we collect, use, and protect your personal information, including DPDP Act compliance.",
};

export default function PrivacyPage() {
  return <LegalDocPage filename="privacy.md" />;
}
