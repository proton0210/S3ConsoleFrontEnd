/**
 * SEO landing page for "AWS S3 GUI" / "S3 GUI" / "S3 GUI Mac" search intent.
 *
 * Sister page to /aws-s3-client — same product, different keyword anchor.
 * The two are interlinked but the H1, FAQ, and copy emphasize the visual
 * interface angle that "GUI" searchers care about.
 */
import Link from "next/link";
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
    q: "What is the best AWS S3 GUI for Mac?",
    a: "S3Console is a native macOS S3 GUI built for both Apple Silicon and Intel Macs. It supports drag-and-drop uploads, side-by-side bucket browsing, AWS SSO login, multi-profile switching, and a visual bucket policy editor. Cyberduck and Transmit also have S3 support, but they're general-purpose file transfer apps; S3Console is purpose-built for S3.",
  },
  {
    q: "Does AWS provide an official S3 GUI?",
    a: "AWS provides the S3 console — a web-based GUI in the AWS Management Console. It works for occasional tasks but has noticeable lag, no offline capability, and no support for desktop conveniences like drag-and-drop, multiple windows, or local file previews. A native desktop S3 GUI like S3Console is significantly faster for day-to-day work.",
  },
  {
    q: "Can I preview files in S3Console without downloading them?",
    a: "Yes. S3Console renders previews of common file types (images, PDFs, JSON, CSV, log files, code files) directly in the app using S3 ranged GETs — only the bytes needed for the preview are downloaded, so it's fast even for large files.",
  },
  {
    q: "Does S3Console support drag-and-drop?",
    a: "Yes — drag files from Finder/Explorer/Nautilus straight into a bucket to upload, drag from S3Console to your desktop to download, or drag between buckets to copy across accounts and regions.",
  },
  {
    q: "Is S3Console free?",
    a: "S3Console offers a 14-day free trial with full feature access on every platform. After the trial, plans start at $9/month or $99 one-time for lifetime access.",
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

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">AWS S3 GUI</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            A real AWS S3 GUI — fast, native, cross-platform
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mb-8">
            S3Console is a desktop S3 GUI for engineers who&apos;d rather click
            than memorize CLI flags. Browse, preview, upload, and manage S3
            objects with the keyboard shortcuts and drag-and-drop you expect
            from a native app — on macOS, Windows, and Linux.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
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

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><FaApple className="h-4 w-4" /> macOS</span>
            <span className="inline-flex items-center gap-1.5"><FaWindows className="h-4 w-4" /> Windows</span>
            <span className="inline-flex items-center gap-1.5"><FaLinux className="h-4 w-4" /> Linux</span>
            <span className="text-slate-400">·</span>
            <span>14-day trial · No credit card</span>
          </div>
        </section>

        {/* What you get */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Everything an S3 GUI should do — and more
          </h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            The AWS web console is fine for clicks-per-week usage. If you live
            in S3, you need an interface that respects your time.
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
                body: "Images, PDFs, JSON, CSV, code, logs — previewed directly without a full download. Range requests fetch only the bytes you actually see.",
              },
              {
                icon: FaListUl,
                title: "Multi-bucket, multi-region tabs",
                body: "Open buckets in side-by-side tabs across accounts and regions. Hop between staging and prod without losing context.",
              },
              {
                icon: FaSearch,
                title: "Fast key search and filters",
                body: "Search prefixes, filter by storage class or last-modified, and sort huge listings without the AWS console&apos;s pagination dance.",
              },
              {
                icon: FaShieldAlt,
                title: "Visual permissions",
                body: "Inspect and edit bucket policies, ACLs, and CORS rules with a typed UI. See exactly what each rule does before you save.",
              },
              {
                icon: FaMousePointer,
                title: "Keyboard-first workflow",
                body: "Every common action has a shortcut. Open, copy URL, generate presigned link, and switch profile without ever touching the mouse.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary/40 transition-colors"
              >
                <Icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  {title}
                </h3>
                <p
                  className="text-sm text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Cross-link to /aws-s3-client */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Looking for the developer-focused angle?
            </h2>
            <p className="text-slate-700 mb-4">
              S3Console doubles as a full{" "}
              <Link href="/aws-s3-client" className="text-primary hover:underline font-medium">
                AWS S3 client
              </Link>{" "}
              with AI code generation, AWS SSO, multi-profile support, and an S3
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
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            S3 GUI questions, answered
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-primary/40 transition-colors"
              >
                <summary className="cursor-pointer font-semibold text-slate-900 list-none flex items-start justify-between gap-4">
                  <span>{f.q}</span>
                  <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-slate-700 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            See it for yourself
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Free 14-day trial on Mac, Windows, and Linux. Full feature access.
            No credit card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                <FaDownload className="mr-2 h-4 w-4" />
                Download S3Console
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
