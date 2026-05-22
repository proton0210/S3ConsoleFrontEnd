import type { Metadata } from "next";
import LegalDocPage from "@/components/legal/LegalDocPage";

export const metadata: Metadata = {
  title: "End-User License Agreement — S3Console",
  description:
    "S3Console End-User License Agreement (EULA): software-use rights, restrictions, activation, and intellectual property.",
};

export default function EulaPage() {
  return <LegalDocPage filename="eula.md" />;
}
