/**
 * /suite — landing page for the Tables + Buckets Suite ($149, both Lifetime
 * licenses in one payment). The destination for the home-page promo bar,
 * header/footer links, ads and the partner site's cross-links. Static and
 * indexable; plan-aware blocking (existing Lifetime owners) happens on /buy.
 */
import Footer from "@/components/sections/footer";
import Header from "@/components/sections/header";
import { SuiteLanding } from "@/components/sections/suite-landing";
import { siteConfig } from "@/lib/config";
import { SUITE_FAQS, SUITE_NAME, SUITE_PRICE_USD, SUITE_SAVINGS_USD } from "@/lib/suite-offer";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

const title = `${SUITE_NAME} — Buckets and Tables Lifetime for $${SUITE_PRICE_USD}`;
const description = `Own S3 and DynamoDB for good. The ${SUITE_NAME} gives you Buckets Lifetime and Tables Lifetime in one payment — $${SUITE_PRICE_USD} instead of $198, every feature, every future update, no renewals.`;

export const metadata: Metadata = constructMetadata({
  title,
  description,
  canonical: "/suite",
  image: `${siteConfig.url}/og?title=${encodeURIComponent(`${SUITE_NAME}: both Lifetime licenses, save $${SUITE_SAVINGS_USD}`)}`,
});

export default function SuitePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SUITE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SUITE_NAME,
    description,
    brand: { "@type": "Brand", name: siteConfig.publisherName },
    offers: {
      "@type": "Offer",
      price: String(SUITE_PRICE_USD),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/suite`,
    },
  };
  return (
    <div className="theme-scope min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Header />
      <main className="relative isolate overflow-x-clip">
        <SuiteLanding />
      </main>
      <Footer />
    </div>
  );
}
