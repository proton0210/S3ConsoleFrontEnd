/**
 * SEO landing page for "AWS S3 client" / "S3 client" search intent.
 *
 * Page structure follows the standard money-keyword landing pattern:
 *   1. H1 with the exact-match keyword.
 *   2. Above-the-fold CTA (download / pricing).
 *   3. "Why" section — 4-6 features with platform-specific screenshots.
 *   4. "What's included" checklist of core capabilities.
 *   5. FAQ block — also emitted as FAQPage JSON-LD.
 *   6. Final CTA.
 *
 * Server component so metadata + content render in the initial HTML
 * payload (Googlebot doesn't always execute JS).
 */
import Link from "next/link";
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
  FaCheck,
  FaBolt,
  FaShieldAlt,
  FaUserSecret,
  FaCog,
  FaDownload,
  FaCode,
} from "react-icons/fa";

const FAQS = [
  {
    q: "What is an AWS S3 client?",
    a: "An AWS S3 client is a desktop application that lets you browse, upload, download, and manage files in Amazon S3 buckets from a native desktop app. A good S3 client gives you a desktop GUI, drag-and-drop file transfer, multi-profile support for several AWS accounts, and tools like presigned URL generation and bucket policy editing.",
  },
  {
    q: "What can I do with Buckets by ServerlessCreed?",
    a: "Buckets by ServerlessCreed is purpose-built for AWS S3. Browse and transfer files with drag and drop, sign in with AWS SSO and IAM Identity Center, switch between profiles, generate presigned URLs, edit bucket policies visually, generate AWS SDK code, and estimate storage costs, all from one desktop app.",
  },
  {
    q: "Does Buckets by ServerlessCreed work on Mac, Windows, and Linux?",
    a: "Yes — Buckets by ServerlessCreed supports macOS, Windows 10/11, and Linux. The Windows edition is installed and updated through Microsoft Store; macOS and Linux use platform-specific packages. All platforms share the same product features and license.",
  },
  {
    q: "Do I need AWS credentials to use Buckets by ServerlessCreed?",
    a: "Yes, you need AWS credentials to connect to your S3 buckets — either an access key/secret pair, an AWS SSO session, or an existing AWS CLI profile. Credentials are stored locally on your machine and never sent to Buckets by ServerlessCreed's servers. All S3 traffic goes directly between your computer and AWS.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every new install gets a fully-featured 14-day trial with no credit card required. The trial unlocks every feature on every supported platform. After the trial, you can subscribe ($5/month or $49/year) or buy a lifetime license ($99 one-time).",
  },
  {
    q: "Can I generate presigned S3 URLs with Buckets by ServerlessCreed?",
    a: "Yes. Buckets by ServerlessCreed has a built-in presigned URL generator — pick the object, set the expiration, and copy the download URL. Temporary AWS credentials can expire before the selected link lifetime. The generated URLs are standard AWS-signed URLs you can share with anyone, including users without AWS accounts.",
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
      name: "AWS S3 Client",
      item: `${siteConfig.url}/aws-s3-client`,
    },
  ],
};

export default function AwsS3ClientPage() {
  return (
    <>
      <Header />
      <Script
        id="ld-faq-aws-s3-client"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="ld-bc-aws-s3-client"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">AWS S3 Client</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            A cross-platform AWS S3 client for Mac, Windows, and Linux
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mb-8">
            Buckets by ServerlessCreed is a cross-platform desktop S3 client built for engineers who live
            in AWS. Browse buckets, generate presigned URLs, edit policies, and
            switch profiles in one place, with every workflow a click away.
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
            <span className="inline-flex items-center gap-1.5"><FaApple className="h-4 w-4" /> macOS (Apple Silicon)</span>
            <span className="inline-flex items-center gap-1.5"><FaWindows className="h-4 w-4" /> Windows 10 &amp; 11</span>
            <span className="inline-flex items-center gap-1.5"><FaLinux className="h-4 w-4" /> Linux (.deb)</span>
            <span className="text-slate-400">·</span>
            <span>14-day trial · No credit card</span>
          </div>
        </section>

        {/* Real app screenshot */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <figure>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_100px_-40px_rgb(20_15_10/0.35)]">
            <div className="flex h-8 items-center gap-1.5 border-b border-slate-200 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <ProductShot name="searchall" priority themed={false} sizes="(max-width: 1200px) 100vw, 1150px" />
          </div>
          <figcaption className="mt-3 text-center text-sm text-slate-500">
            One search across every bucket in the account, grouped by bucket (sample data).
          </figcaption>
          </figure>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Why developers pick Buckets by ServerlessCreed as their S3 client
          </h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Buckets by ServerlessCreed is built around how engineers actually work with AWS — multi-account
            SSO, IAM-aware tools, and focused desktop workflows.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FaBolt,
                title: "Built for S3 from the ground up",
                body: "Every screen, shortcut, and feature is designed for S3 semantics — versioning, storage classes, requester-pays, server-side encryption.",
              },
              {
                icon: FaUserSecret,
                title: "AWS SSO &amp; IAM Identity Center",
                body: "Sign in with your existing AWS SSO profile. Keep each account in its own tab and switch in a click. Use short-lived credentials; expired sessions may require sign-in.",
              },
              {
                icon: FaShieldAlt,
                title: "Visual bucket policy &amp; CORS editor",
                body: "Stop writing JSON by hand. Build bucket policies and CORS rules with a typed UI that validates as you go, then review the generated JSON before you save.",
              },
              {
                icon: FaCode,
                title: "AWS SDK code generation",
                body: "Right-click an object and copy the AWS SDK code to fetch, sign, or stream it — in TypeScript, JavaScript, or Python. Useful for one-off scripts and pasting into PRs.",
              },
              {
                icon: FaCog,
                title: "Multi-profile, multi-region",
                body: "Pin frequently-used profiles, jump between regions, and view objects across accounts in a single window. Ideal for multi-tenant or staging/prod splits.",
              },
              {
                icon: FaShieldAlt,
                title: "Local-only credentials",
                body: "Your AWS keys stay on your machine. Buckets by ServerlessCreed never proxies traffic — every API call goes directly from your computer to AWS over TLS.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary/40 transition-colors"
              >
                <Icon className="h-5 w-5 text-primary mb-3" />
                <h3
                  className="text-lg font-semibold text-slate-900 mb-1.5"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                <p
                  className="text-sm text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* What's included */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Everything included in Buckets by ServerlessCreed
          </h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            One license unlocks every feature on every supported platform.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white p-6">
            {[
              "Desktop apps for macOS, Windows, and Linux",
              "AWS SSO / IAM Identity Center sign-in",
              "Multi-profile, multi-region switching",
              "Drag-and-drop uploads and downloads",
              "Presigned URL generator",
              "Visual bucket policy and CORS editor",
              "Code generation for S3 operations (TypeScript, JavaScript, Python, AWS CLI)",
              "S3 storage cost estimator",
              "Local-only credentials, direct to AWS",
              "14-day free trial, no credit card",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-800">
                <FaCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-primary/40 transition-colors"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-1 font-semibold text-slate-900">
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
            Try Buckets by ServerlessCreed free for 14 days
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Full feature access on macOS, Windows, and Linux. No credit card.
            Connect the AWS profiles you already have and try every feature on
            your own buckets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
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
