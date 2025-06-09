import Script from "next/script";
import { siteConfig } from "@/lib/config";

interface StructuredDataProps {
  type?: "website" | "software" | "faq" | "article";
  data?: any;
}

export function StructuredData({ type = "website", data }: StructuredDataProps) {
  const baseUrl = siteConfig.url;
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "macOS, Windows",
    offers: {
      "@type": "Offer",
      price: "49.99",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/downloads`,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.creator,
      email: siteConfig.links.email,
      url: baseUrl,
    },
    keywords: siteConfig.keywords.join(", "),
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Cloud Storage Management",
    operatingSystem: ["macOS", "Windows"],
    offers: {
      "@type": "Offer",
      price: "49.99",
      priceCurrency: "USD",
      priceValidUntil: "2025-12-31",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "AWS S3 bucket management",
      "Secure presigned URL generation",
      "Multi-profile AWS account support",
      "Smart file preview",
      "Drag-and-drop file upload",
      "Bulk file operations",
      "Cross-platform support (Mac & Windows)",
    ],
    screenshot: `${baseUrl}/dashboard.png`,
    softwareVersion: "1.0",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.creator,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    email: siteConfig.links.email,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
      siteConfig.links.instagram,
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteConfig.faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: typeof faq.answer === 'string' ? faq.answer : faq.answer.props.children,
      },
    })),
  };

  let schema;
  switch (type) {
    case "software":
      schema = softwareSchema;
      break;
    case "faq":
      schema = faqSchema;
      break;
    case "article":
      schema = data;
      break;
    default:
      schema = websiteSchema;
  }

  return (
    <>
      <Script
        id={`structured-data-${type}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
    </>
  );
}