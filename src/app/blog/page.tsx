/**
 * /blog — index of all posts.
 *
 * Server component so post metadata + cards render in the initial HTML.
 * Emits Blog JSON-LD listing every post so Google can model the collection.
 */
import Script from "next/script";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import BlogCard from "@/components/blog-card";
import { getBlogPosts } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "S3Console Blog — AWS S3 Guides, Tips & Product Updates",
  description:
    "Practical guides for working with Amazon S3: streaming uploads, presigned URLs, multi-profile workflows, performance, and the inside scoop on S3Console releases.",
  canonical: `${siteConfig.url}/blog`,
});

export default async function BlogIndexPage() {
  const posts = (await getBlogPosts()).sort((a, b) => {
    const ad = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bd = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bd - ad;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} Blog`,
    url: `${siteConfig.url}/blog`,
    description:
      "Guides and product updates from the team behind S3Console — the fastest AWS S3 client for Mac, Windows, and Linux.",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${siteConfig.url}/blog/${p.slug}`,
      datePublished: p.publishedAt,
      author: { "@type": "Organization", name: p.author || siteConfig.author },
      image: p.image,
    })),
  };

  return (
    <main>
      <Header />
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
          The S3Console Blog
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
          Guides, deep-dives, and product updates
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Hands-on writing for developers who live in AWS — streaming uploads,
          presigned URLs, multi-profile workflows, and the engineering behind
          S3Console.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, i) => (
              <BlogCard key={post.slug} data={post} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
