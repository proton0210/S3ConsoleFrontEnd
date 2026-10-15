import Capabilities from "@/components/sections/capabilities";
import CTA from "@/components/sections/cta";
import FAQ from "@/components/sections/faq";
import Features from "@/components/sections/features";
import { FilmSection } from "@/components/film";
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import Hero from "@/components/sections/hero";
import Pricing from "@/components/sections/pricing";
import Ribbon from "@/components/sections/ribbon";
import Security from "@/components/sections/security";
import Tour from "@/components/sections/tour";
import WhatsNew from "@/components/sections/whats-new";
import Workflow from "@/components/sections/workflow";
import { MotionProvider } from "@/components/motion-provider";
import { StructuredData } from "@/components/structured-data";
import { siteConfig } from "@/lib/config";
import { FILM, FILM_EMBED_URL, FILM_WATCH_URL } from "@/lib/film";
import { absoluteUrl, constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  // Keep the Serverless Creed product identity first and use the AWS mark only
  // in the factual relational phrase permitted by the AWS trademark guidance.
  title: `${siteConfig.name} — Desktop Client for Amazon S3`,
  description: siteConfig.description,
  canonical: "/",
  image: absoluteUrl("/social/og-home.png"),
});

const filmSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: FILM.title,
  description: FILM.description,
  thumbnailUrl: [absoluteUrl(FILM.poster), `https://i.ytimg.com/vi/${FILM.youtubeId}/hqdefault.jpg`],
  uploadDate: FILM.uploadDate,
  duration: `PT${FILM.durationSeconds}S`,
  embedUrl: FILM_EMBED_URL,
  url: FILM_WATCH_URL,
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "ServerlessCreed", url: siteConfig.url },
};

export default function Home() {
  return (
    <MotionProvider>
      <main className="theme-scope min-h-screen overflow-x-clip">
        <StructuredData type="faq" />
        <StructuredData type="video" data={filmSchema} />
        <Header />
        <Hero />
        <Ribbon />
        <FilmSection />
        <Tour />
        <WhatsNew />
        <Features />
        <Workflow />
        <Capabilities />
        <Security />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </MotionProvider>
  );
}
