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
  // Title-tag rule of thumb: lead with the primary keyword, brand last, ~60 chars.
  // Description ~150-160 chars, includes secondary keywords + CTA hook.
  title: "AWS S3 Client for Mac, Windows & Linux | S3Console",
  description:
    "The fastest AWS S3 client for Mac, Windows, and Linux. A native S3 desktop GUI with AI code generation, presigned URLs, multi-profile SSO, and a visual bucket policy editor. Free 14-day trial.",
  canonical: "/",
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
