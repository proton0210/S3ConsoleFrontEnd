import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import TrustCenter from "@/components/trust-center";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Trust Center — Security, Privacy, and Architecture",
  description:
    "Serverless Buckets security architecture, direct-to-AWS data flow, privacy, subprocessors, recovery, vulnerability disclosure, release assurance, and current versions.",
  canonical: "/trust",
});

export default function TrustPage() {
  return (
    <>
      <Header />
      <TrustCenter product="buckets" />
      <Footer />
    </>
  );
}
