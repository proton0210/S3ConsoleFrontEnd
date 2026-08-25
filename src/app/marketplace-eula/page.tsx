import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  title: "AWS Marketplace EULA Addendum — Serverless Buckets",
  description:
    "Serverless Buckets addendum for future orders placed through an AWS Marketplace listing.",
  alternates: { canonical: "/marketplace-eula" },
};

export default function MarketplaceEulaPage() {
  return <LegalDocPage filename="marketplace-eula.md" />;
}
