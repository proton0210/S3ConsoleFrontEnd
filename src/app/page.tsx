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
import UpcomingFeatures from "@/components/sections/upcoming-features";
import { StructuredData } from "@/components/structured-data";

export default function Home() {
  return (
    <main>
      <StructuredData type="faq" />
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <TestimonialsCarousel />
      <Features />
      <UpcomingFeatures />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
