import Script from "next/script";
import { siteConfig } from "@/lib/config";
import { isValidElement } from "react";

interface StructuredDataProps {
  type?: "website" | "software" | "faq" | "article";
  data?: unknown;
}

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function getTextContent(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(getTextContent).join("");
  }
  if (isValidElement<{ children?: unknown }>(value)) {
    return getTextContent(value.props.children);
  }
  return "";
}

export function StructuredData({ type = "website", data }: StructuredDataProps) {
  const baseUrl = siteConfig.url;
  
  // Multi-tier offers. priceValidUntil rolls one year forward each render so it
  // never silently goes stale (Google warns about expired offer dates).
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const validUntil = oneYearFromNow.toISOString().slice(0, 10);

  const offers = [
    {
      "@type": "Offer",
      name: "Monthly subscription",
      price: "9",
      priceCurrency: "USD",
      priceValidUntil: validUntil,
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/pricing`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "9",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
    },
    {
      "@type": "Offer",
      name: "Yearly subscription",
      price: "79",
      priceCurrency: "USD",
      priceValidUntil: validUntil,
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/pricing`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "79",
        priceCurrency: "USD",
        billingDuration: "P1Y",
      },
    },
    {
      "@type": "Offer",
      name: "Lifetime",
      price: "149",
      priceCurrency: "USD",
      priceValidUntil: validUntil,
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/pricing`,
    },
  ];

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: baseUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Windows, Linux",
    offers,
    publisher: {
      "@type": "Organization",
      name: siteConfig.publisher,
      email: siteConfig.links.email,
      url: baseUrl,
    },
    keywords: siteConfig.keywords.join(", "),
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    alternateName: ["S3 Console", "Client for Amazon S3", "S3 Desktop App"],
    description: siteConfig.description,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Cloud Storage Management",
    operatingSystem: ["macOS", "Windows", "Linux"],
    offers,
    featureList: [
      "Amazon S3 bucket management with a cross-platform desktop GUI",
      "AI-powered code generation for S3 operations",
      "Secure presigned URL generation with custom expiration",
      "Multi-profile AWS account support with SSO",
      "Object previews inside the app; content is retrieved from S3",
      "Drag-and-drop and bulk file operations",
      "Bucket policy generator with visual editor",
      "S3 cost estimation and access analyzer",
      "Cross-platform: macOS, Windows, Linux",
    ],
    screenshot: `${baseUrl}/dashboard.png`,
    softwareVersion: "2.7.4",
    downloadUrl: `${baseUrl}/downloads`,
    publisher: {
      "@type": "Organization",
      name: siteConfig.publisher,
      url: baseUrl,
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.publisher,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    email: siteConfig.links.email,
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
      siteConfig.links.instagram,
      siteConfig.links.linkedin,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.links.email,
      contactType: "Customer Service",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
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
        text: getTextContent(faq.answer).replace(/\s+/g, " ").trim(),
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
          __html: serializeJsonLd(schema),
        }}
      />
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationSchema),
        }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
