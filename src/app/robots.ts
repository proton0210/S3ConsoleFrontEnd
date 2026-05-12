import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  // Disallow:
  //   /api/, /_next/   — internal
  //   /sign-in, /sign-up — auth, no SEO value
  //   /account/        — private user pages
  //   /buy, /payment-status, /downloads/cancel — transactional, noindex'd
  // Aggressive scrapers (Ahrefs/Semrush/etc) blocked at the bot level —
  // they're useful only to competitors and burn crawl budget.
  const sharedDisallow = [
    "/api/",
    "/_next/",
    "/sign-in",
    "/sign-up",
    "/account/",
    "/buy",
    "/payment-status",
    "/downloads/cancel",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: sharedDisallow },
      { userAgent: "Googlebot", allow: "/", disallow: sharedDisallow },
      { userAgent: "Bingbot", allow: "/", disallow: sharedDisallow },
      // GPTBot/ChatGPT/Perplexity etc — allow them. They surface us in answers.
      { userAgent: "GPTBot", allow: "/", disallow: sharedDisallow },
      { userAgent: "PerplexityBot", allow: "/", disallow: sharedDisallow },
      { userAgent: "ClaudeBot", allow: "/", disallow: sharedDisallow },
      // SEO/scraping competitors — block, they only help rivals.
      { userAgent: "AhrefsBot", disallow: "/" },
      { userAgent: "SemrushBot", disallow: "/" },
      { userAgent: "DotBot", disallow: "/" },
      { userAgent: "MJ12bot", disallow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
