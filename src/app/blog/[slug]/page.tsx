/**
 * /blog/[slug] — single post page.
 *
 * Statically generated at build via generateStaticParams so each post lands
 * in the initial HTML payload. Emits BlogPosting JSON-LD (always) and a
 * VideoObject block when frontmatter declares a `videoId` so YouTube demos
 * become eligible for video rich results.
 */
import Script from "next/script";
import { notFound } from "next/navigation";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { getBlogPosts, getPost } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import { constructMetadata, formatDate } from "@/lib/utils";
import { Metadata } from "next";

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { metadata } = await getPost(slug);
    const url = `${siteConfig.url}/blog/${slug}`;
    return constructMetadata({
      title: metadata.title,
      description: metadata.summary,
      image: metadata.image,
      canonical: url,
      openGraph: {
        title: metadata.title,
        description: metadata.summary,
        url,
        siteName: siteConfig.name,
        type: "article",
        publishedTime: metadata.publishedAt,
        authors: [metadata.author || siteConfig.author],
        images: metadata.image
          ? [{ url: metadata.image, width: 1200, height: 630, alt: metadata.title }]
          : undefined,
        locale: "en_US",
      },
    });
  } catch {
    return constructMetadata({ noindex: true });
  }
}

export default async function BlogPostPage({ params }: RouteProps) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getPost>>;
  try {
    post = await getPost(slug);
  } catch {
    notFound();
  }

  const { source, metadata } = post;
  const url = `${siteConfig.url}/blog/${slug}`;
  const videoId = (metadata as { videoId?: string }).videoId;

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: metadata.title,
    description: metadata.summary,
    image: metadata.image ? [metadata.image] : undefined,
    datePublished: metadata.publishedAt,
    dateModified: metadata.publishedAt,
    author: {
      "@type": "Organization",
      name: metadata.author || siteConfig.author,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/favicon.ico`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const videoLd = videoId
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: metadata.title,
        description: metadata.summary,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        uploadDate: metadata.publishedAt,
        contentUrl: `https://youtu.be/${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }
    : null;

  return (
    <main>
      <Header />
      <Script
        id="post-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      {videoLd && (
        <Script
          id="post-video-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
        />
      )}

      <article className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 pb-20">
        <header className="mb-10">
          <p className="text-sm text-muted-foreground mb-3">
            <a
              href="/blog"
              className="hover:text-primary transition-colors"
            >
              ← All posts
            </a>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            {metadata.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={metadata.publishedAt}>
              {formatDate(metadata.publishedAt)}
            </time>
            <span aria-hidden>·</span>
            <span>{metadata.author || siteConfig.author}</span>
          </div>
        </header>

        {videoId && (
          <div className="mb-10 overflow-hidden rounded-xl border bg-black shadow-sm">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={metadata.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        )}

        <div
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h2:mt-12 prose-h2:text-2xl sm:prose-h2:text-3xl prose-h3:mt-8 prose-h3:text-xl prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-pre:rounded-lg prose-pre:border prose-pre:bg-muted/40 prose-code:before:hidden prose-code:after:hidden prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:font-medium"
          dangerouslySetInnerHTML={{ __html: source }}
        />

        <hr className="my-12 border-border" />

        <div className="rounded-xl border bg-muted/30 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Try S3Console free for 14 days
          </h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Native AWS S3 client for Mac, Windows, and Linux. Upload from URL,
            presigned links, multi-profile SSO, visual policies — all in one app.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/downloads"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Download S3Console
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              See pricing
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
