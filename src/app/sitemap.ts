import { MetadataRoute } from "next";

/**
 * Sitemap drives Google's crawl prioritization. Rules:
 *   - Only PUBLIC, indexable pages go here. Private pages (/account/billing) and
 *     transactional ones (/buy, /payment-status) are noindex'd via their own
 *     layout metadata and intentionally excluded.
 *   - Priority is relative — homepage 1.0, money pages 0.9, content 0.8,
 *     legal/policy 0.4. Auth pages excluded; they have no SEO value.
 *   - changeFrequency is a hint, not a guarantee. Daily for the homepage
 *     because hero copy + testimonials shift; monthly for stable content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://s3console.com";
  const now = new Date();

  return [
    // Money pages (highest priority)
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // SEO landing pages — buyer-intent keywords
    {
      url: `${baseUrl}/aws-s3-client`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/aws-s3-gui`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vs/cyberduck`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },

    // Legal / policy
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/eula`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
