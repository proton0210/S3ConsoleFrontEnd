import Capabilities from "@/components/sections/capabilities";
import CTA from "@/components/sections/cta";
import Demo from "@/components/sections/demo";
import FAQ from "@/components/sections/faq";
import Features from "@/components/sections/features";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import Pricing from "@/components/sections/pricing";
import Security from "@/components/sections/security";
import Workflow from "@/components/sections/workflow";
import { StructuredData } from "@/components/structured-data";
import { siteConfig } from "@/lib/config";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  // Keep the Serverless Creed product identity first and use the AWS mark only
  // in the factual relational phrase permitted by the AWS trademark guidance.
  title: `${siteConfig.name} — Desktop Client for Amazon S3`,
  description: siteConfig.description,
  canonical: "/",
});

export default function Home() {
  return (
    <main className="theme-scope min-h-screen overflow-x-clip">
      <StructuredData type="faq" />
      <Header />
      <Hero />
      <Features />
      <Demo />
      <Workflow />
      <Capabilities />
      <Security />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
