/**
 * SEO landing page for "AWS S3 client" / "S3 client" search intent.
 *
 * Page structure follows the standard money-keyword landing pattern:
 *   1. H1 with the exact-match keyword.
 *   2. Above-the-fold CTA (download / pricing).
 *   3. "Why" section — 4-6 features with platform-specific screenshots.
 *   4. Comparison row vs. Cyberduck / S3 Browser / AWS Console.
 *   5. FAQ block — also emitted as FAQPage JSON-LD.
 *   6. Final CTA.
 *
 * Server component so metadata + content render in the initial HTML
 * payload (Googlebot doesn't always execute JS).
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
  FaCheck,
  FaTimes,
  FaBolt,
  FaShieldAlt,
  FaRobot,
  FaUserSecret,
  FaCog,
  FaDownload,
} from "react-icons/fa";

const FAQS = [
  {
    q: "What is an AWS S3 client?",
    a: "An AWS S3 client is a desktop application that lets you browse, upload, download, and manage files in Amazon S3 buckets without writing CLI commands or using the AWS web console. A good S3 client gives you a native GUI, drag-and-drop file transfer, multi-profile support for several AWS accounts, and tools like presigned URL generation and bucket policy editing.",
  },
  {
    q: "Is S3Console better than Cyberduck for S3?",
    a: "S3Console is purpose-built for AWS S3, while Cyberduck is a general-purpose FTP/SFTP/cloud client. That focus means S3Console has features Cyberduck doesn't — AWS SSO and IAM Identity Center login, AI code generation for the AWS SDK, an S3 cost estimator, and a visual bucket policy editor. If S3 is your daily driver, the workflow is faster on S3Console.",
  },
  {
    q: "Does S3Console work on Mac, Windows, and Linux?",
    a: "Yes — S3Console ships native installers for macOS (Intel and Apple Silicon), Windows 10/11, and Linux (Debian/Ubuntu .deb). All three builds share the same feature set, license key, and update cycle.",
  },
  {
    q: "Do I need AWS credentials to use S3Console?",
    a: "Yes, you need AWS credentials to connect to your S3 buckets — either an access key/secret pair, an AWS SSO session, or an existing AWS CLI profile. Credentials are stored locally on your machine and never sent to S3Console's servers. All S3 traffic goes directly between your computer and AWS.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every new install gets a fully-featured 14-day trial with no credit card required. The trial unlocks every feature on every supported platform. After the trial, you can subscribe ($9/month or $49/year) or buy a lifetime license ($99 one-time).",
  },
  {
    q: "Can I generate presigned S3 URLs with S3Console?",
    a: "Yes. S3Console has a built-in presigned URL generator — pick the object, set the expiration, optionally restrict to specific HTTP methods or IP ranges, and copy the URL. The generated URLs are standard AWS-signed URLs you can share with anyone, including users without AWS accounts.",
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
            The fastest AWS S3 client for Mac, Windows, and Linux
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mb-8">
            S3Console is a native desktop S3 client built for engineers who live
            in AWS. Browse buckets, generate presigned URLs, edit policies, and
            switch profiles in one place — without the AWS web console&apos;s lag
            or the CLI&apos;s ceremony.
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
            <span className="inline-flex items-center gap-1.5"><FaApple className="h-4 w-4" /> macOS (ARM &amp; Intel)</span>
            <span className="inline-flex items-center gap-1.5"><FaWindows className="h-4 w-4" /> Windows 10 &amp; 11</span>
            <span className="inline-flex items-center gap-1.5"><FaLinux className="h-4 w-4" /> Linux (.deb)</span>
            <span className="text-slate-400">·</span>
            <span>14-day trial · No credit card</span>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Why developers pick S3Console as their S3 client
          </h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Most S3 clients are FTP apps with an S3 backend bolted on. S3Console
            is built around how engineers actually work with AWS — multi-account
            SSO, real IAM understanding, and the small things that save you ten
            seconds, fifty times a day.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FaBolt,
                title: "Built for S3, not retrofitted from FTP",
                body: "Every screen, shortcut, and feature is designed for S3 semantics — versioning, storage classes, requester-pays, server-side encryption. No leftover SFTP cruft.",
              },
              {
                icon: FaUserSecret,
                title: "AWS SSO &amp; IAM Identity Center",
                body: "Sign in with your existing AWS SSO profile. Switch accounts and roles with a keystroke. No copy-pasting access keys, no expired credentials at the worst moment.",
              },
              {
                icon: FaShieldAlt,
                title: "Visual bucket policy &amp; CORS editor",
                body: "Stop writing JSON by hand. Build bucket policies and CORS rules with a typed UI that validates as you go and generates the exact JSON AWS expects.",
              },
              {
                icon: FaRobot,
                title: "AI code generation",
                body: "Right-click an object and copy the AWS SDK code to fetch, sign, or stream it — in JavaScript, Python, Go, or Java. Useful for one-off scripts and pasting into PRs.",
              },
              {
                icon: FaCog,
                title: "Multi-profile, multi-region",
                body: "Pin frequently-used profiles, jump between regions, and view objects across accounts in a single window. Ideal for multi-tenant or staging/prod splits.",
              },
              {
                icon: FaShieldAlt,
                title: "Local-only credentials",
                body: "Your AWS keys stay on your machine. S3Console never proxies traffic — every API call goes directly from your computer to AWS over TLS.",
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

        {/* Comparison */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            S3Console vs. other AWS S3 clients
          </h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Here&apos;s how S3Console stacks up against the most popular S3 clients
            and the AWS web console for daily use.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Feature</th>
                  <th className="px-4 py-3 font-semibold text-primary">S3Console</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">AWS Console</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Cyberduck</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">S3 Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Native macOS app", "yes", "no", "yes", "no"],
                  ["Native Windows app", "yes", "no", "yes", "yes"],
                  ["Native Linux app", "yes", "no", "yes", "no"],
                  ["AWS SSO / IAM Identity Center", "yes", "yes", "no", "no"],
                  ["Visual bucket policy editor", "yes", "json", "no", "no"],
                  ["AI code generation", "yes", "no", "no", "no"],
                  ["Presigned URL generator", "yes", "yes", "yes", "yes"],
                  ["S3 cost estimator", "yes", "yes", "no", "no"],
                  ["Multi-profile switcher", "yes", "no", "limited", "yes"],
                  ["Free tier", "14-day trial", "free", "free", "free (Win)"],
                ].map(([feature, ours, aws, cd, sb]) => (
                  <tr key={feature as string}>
                    <td className="px-4 py-3 text-slate-800">{feature}</td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={ours as string} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      <Cell value={aws as string} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      <Cell value={cd as string} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      <Cell value={sb as string} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Compared as of {new Date().getFullYear()}. Features evolve — please
            verify current capabilities on each vendor&apos;s site before deciding.
          </p>
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
            Try S3Console free for 14 days
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Full feature access on macOS, Windows, and Linux. No credit card.
            If S3Console doesn&apos;t replace whatever you&apos;re using today,
            uninstall it — we won&apos;t take it personally.
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

function Cell({ value }: { value: string }) {
  if (value === "yes") {
    return <FaCheck className="inline h-4 w-4 text-green-600" aria-label="Yes" />;
  }
  if (value === "no") {
    return <FaTimes className="inline h-4 w-4 text-slate-400" aria-label="No" />;
  }
  return <span className="text-xs text-slate-600">{value}</span>;
}
