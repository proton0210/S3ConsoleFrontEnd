import Comparison from "@/components/sections/comparison";
import CTA from "@/components/sections/cta";
import FAQ from "@/components/sections/faq";
import Features from "@/components/sections/features";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import HowItWorks from "@/components/sections/how-it-works";
import Pricing from "@/components/sections/pricing";
import Problem from "@/components/sections/problem";
import Solution from "@/components/sections/solution";
import TestimonialsCarousel from "@/components/sections/testimonials-carousel";
import { StructuredData } from "@/components/structured-data";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "S3Console - AWS S3 Desktop App for Mac & Windows",
  description:
    "Professional AWS S3 bucket manager with intuitive GUI. Features AI Code Generation, Presigned URLs, Multi-Profile Support, and Advanced Access Control. Download for Mac & Windows.",
});

export default function Home() {
  return (
    <main>
      <StructuredData type="faq" />
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <Comparison />
      <HowItWorks />
      <TestimonialsCarousel />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
