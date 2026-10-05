/**
 * SEO landing page for "AWS S3 GUI" / "S3 GUI" / "S3 GUI Mac" search intent.
 *
 * Sister page to /aws-s3-client — same product, different keyword anchor.
 * The two are interlinked but the H1, FAQ, and copy emphasize the visual
 * interface angle that "GUI" searchers care about.
 */
import Link from "next/link";
import { TEAM_SEAT_PRICE_USD } from "@/lib/reddit";
import { ProductShot } from "@/components/product-shot";
import Script from "next/script";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import {
  FaApple,
  FaWindows,
  FaLinux,
  FaDownload,
  FaMousePointer,
  FaEye,
  FaListUl,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";

const FAQS = [
  {
    q: "What is an AWS S3 GUI for Mac?",
    a: "Buckets by ServerlessCreed is a macOS S3 desktop client built for Apple Silicon Macs. It supports drag-and-drop uploads, side-by-side bucket browsing, AWS SSO login, multi-profile switching, and a visual bucket policy editor. It is purpose-built for S3, so every screen is designed around buckets, objects, and AWS accounts.",
  },
  {
    q: "Does AWS provide an official S3 GUI?",
    a: "AWS provides the S3 console, a web-based GUI in the AWS Management Console. It supports common bucket and object-management tasks. Buckets by ServerlessCreed gives you a native desktop experience with local workflows, multi-profile switching, and file previews.",
  },
  {
    q: "Can I preview files inside Buckets by ServerlessCreed?",
    a: "Yes. Buckets displays supported images and text inside the app. Previewing retrieves content from S3 and can incur request, retrieval, and transfer charges. Available previews depend on file type and size.",
  },
  {
    q: "Does Buckets by ServerlessCreed support drag-and-drop?",
    a: "Yes — drag files from Finder/Explorer/Nautilus straight into a bucket to upload, drag from Buckets by ServerlessCreed to your desktop to download, or drag between buckets to copy across accounts and regions.",
  },
  {
    q: "Is Buckets by ServerlessCreed free?",
    a: `Buckets by ServerlessCreed offers a 14-day free trial with full feature access on every platform. After the trial, choose Monthly ($5), Yearly ($49), Lifetime ($99 one-time) or Team ($${TEAM_SEAT_PRICE_USD} per seat per year).`,
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    {
      "@type": "ListItem",
      position: 2,
      name: "AWS S3 GUI",
      item: `${siteConfig.url}/aws-s3-gui`,
    },
  ],
};

export default function AwsS3GuiPage() {
  return (
    <>
      <Header />
      <Script
        id="ld-faq-aws-s3-gui"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="ld-bc-aws-s3-gui"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground/80">AWS S3 GUI</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            A cross-platform AWS S3 GUI for Mac, Windows, and Linux
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-8">
            Buckets by ServerlessCreed is a desktop S3 GUI for engineers who&apos;d rather click
            than memorize CLI flags. Browse, preview, upload, and manage S3
            objects with the keyboard shortcuts and drag-and-drop you expect
            from an installed desktop app — on macOS, Windows, and Linux.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <FaDownload className="mr-2 h-4 w-4" />
                Download free trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><FaApple className="h-4 w-4" /> macOS</span>
            <span className="inline-flex items-center gap-1.5"><FaWindows className="h-4 w-4" /> Windows</span>
            <span className="inline-flex items-center gap-1.5"><FaLinux className="h-4 w-4" /> Linux</span>
            <span className="text-muted-foreground/70">·</span>
            <span>14-day trial · No credit card</span>
          </div>
        </section>

        {/* Real app screenshot */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <figure>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_40px_100px_-40px_rgb(20_15_10/0.35)]">
            <div className="flex h-8 items-center gap-1.5 border-b border-border px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <ProductShot name="workspace" priority themed={false} sizes="(max-width: 1200px) 100vw, 1150px" />
          </div>
          <figcaption className="mt-3 text-center text-sm text-muted-foreground">
            The Buckets desktop app with three AWS accounts open in tabs and the object inspector beside the file list (sample data).
          </figcaption>
          </figure>
        </section>

        {/* What you get */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Everything an S3 GUI should do — and more
          </h2>
          <p className="text-muted-foreground mb-10 max-w-3xl">
            If you live in S3, you deserve an interface that respects your time.
            Buckets keeps every everyday task one click away.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FaMousePointer,
                title: "Drag and drop, the way you expect",
                body: "Drag files from your OS into a bucket. Drag between buckets to copy across accounts. Drag out to download. No staging area, no re-uploads.",
              },
              {
                icon: FaEye,
                title: "Inline preview for objects",
                body: "Preview supported images and text inside the app. Previews retrieve content from S3; available formats and size limits depend on the viewer.",
              },
              {
                icon: FaListUl,
                title: "Multi-bucket, multi-region tabs",
                body: "Open buckets in side-by-side tabs across accounts and regions. Hop between staging and prod without losing context.",
              },
              {
                icon: FaSearch,
                title: "Fast key search and filters",
                body: "Search prefixes, filter by storage class or last-modified, and sort huge listings in one smooth view.",
              },
              {
                icon: FaShieldAlt,
                title: "Visual permissions",
                body: "Inspect and edit bucket policies, ACLs, and CORS rules with a typed UI. Review the rule before you save.",
              },
              {
                icon: FaMousePointer,
                title: "Keyboard-first workflow",
                body: "A command palette (Ctrl K, or ⌘K on Mac) puts common actions a few keystrokes away: jump to a bucket, copy an S3 URI or ARN, or open a policy editor.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <Icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                  {title}
                </h3>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Cross-link to /aws-s3-client */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl bg-muted/60 border border-border p-8 md:p-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Looking for the developer-focused angle?
            </h2>
            <p className="text-foreground/80 mb-4">
              Buckets by ServerlessCreed doubles as a full{" "}
              <Link href="/aws-s3-client" className="text-primary hover:underline font-medium">
                AWS S3 client
              </Link>{" "}
              with SDK and CLI code generation, AWS SSO, multi-profile support, and an S3
              cost estimator. The same app, more depth.
            </p>
            <Link
              href="/aws-s3-client"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Read more about the S3 client features →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            S3 GUI questions, answered
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-1 font-semibold text-foreground">
                  <span>{f.q}</span>
                  <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-foreground/80 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            See it for yourself
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Free 14-day trial on Mac, Windows, and Linux. Full feature access.
            No credit card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <FaDownload className="mr-2 h-4 w-4" />
                Download Buckets by ServerlessCreed
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
