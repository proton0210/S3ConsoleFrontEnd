import Comparison from "@/components/sections/comparison";
import CTA from "@/components/sections/cta";
import FAQ from "@/components/sections/faq";
import Features from "@/components/sections/features";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import Pricing from "@/components/sections/pricing";
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
    <main>
      <StructuredData type="faq" />
      <Header />
      <Hero />
      <Features />
      <Comparison />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
