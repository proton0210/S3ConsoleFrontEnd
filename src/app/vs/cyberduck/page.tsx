/**
 * Comparison / alternative page targeting "Cyberduck alternative" + "Buckets by ServerlessCreed
 * vs Cyberduck" search intent. These are very high-buyer-intent queries —
 * someone typing "Cyberduck alternative" is actively shopping.
 *
 * Tone: factual and respectful. Don't trash Cyberduck — it's a perfectly fine
 * general-purpose tool. We just position Buckets by ServerlessCreed as the better fit when AWS
 * S3 is your daily driver.
 */
import Link from "next/link";
import Script from "next/script";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { FaCheck, FaTimes, FaDownload, FaArrowRight } from "react-icons/fa";

const FAQS = [
  {
    q: "Is Buckets by ServerlessCreed a good Cyberduck alternative?",
    a: "Buckets may be a good fit if you regularly manage S3 across AWS accounts and want transfers, policies, recovery, and SDK snippets in one app. Cyberduck is a general-purpose file transfer client with S3 support, including IAM Identity Center in version 9.5 and later. Try the workflows you use most before choosing.",
  },
  {
    q: "How does the Buckets workflow differ from Cyberduck?",
    a: "Buckets brings S3 administration, SDK code generation, cost estimation, and account switching into a desktop workspace. Both products support S3 authentication and transfers; Cyberduck also documents version recovery and CORS configuration. The difference to evaluate is how the complete workflow fits your work.",
  },
  {
    q: "Is Cyberduck still better for non-S3 cloud storage?",
    a: "Yes. If you regularly use FTP, SFTP, WebDAV, Backblaze B2, Google Cloud Storage, OneDrive, or Dropbox alongside S3, Cyberduck's broader protocol support is useful. You can keep Cyberduck for those protocols and use Buckets by ServerlessCreed as a dedicated S3 tool.",
  },
  {
    q: "Is Buckets by ServerlessCreed free like Cyberduck?",
    a: "Cyberduck is donationware — free to download, with donations and paid store versions. Buckets by ServerlessCreed offers a 14-day free trial with full feature access, then $9/month, $79/year, or $149 one-time for lifetime access. The trial doesn't require a credit card.",
  },
  {
    q: "How do I migrate from Cyberduck to Buckets by ServerlessCreed?",
    a: "Your objects stay in S3. Install Buckets, select an existing AWS CLI profile or sign in through IAM Identity Center, and choose your account and region. Access depends on that profile's IAM permissions, and an expired session may require sign-in.",
  },
  {
    q: "Which desktop platforms do Buckets and Cyberduck support?",
    a: "Buckets offers desktop packages for macOS, Windows, and Linux. The download page directs Windows users to Microsoft Store. Cyberduck offers its desktop app on macOS and Windows; its separate command-line tool is also available on Linux.",
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
      name: "Buckets by ServerlessCreed vs Cyberduck",
      item: `${siteConfig.url}/vs/cyberduck`,
    },
  ],
};

const COMPARISON_ROWS: { feature: string; ours: string; cd: string; note?: string }[] = [
  { feature: "Built specifically for AWS S3", ours: "yes", cd: "no", note: "Cyberduck supports 10+ protocols; S3 is one of them" },
  { feature: "macOS desktop app", ours: "yes", cd: "yes" },
  { feature: "Windows desktop app", ours: "yes", cd: "yes" },
  { feature: "Linux desktop app", ours: "yes", cd: "no", note: "Cyberduck has a separate command-line tool for Linux" },
  { feature: "AWS SSO / IAM Identity Center login", ours: "yes", cd: "9.5+", note: "Cyberduck also supports credentials managed through the AWS CLI" },
  { feature: "Multi-profile session manager", ours: "yes", cd: "limited" },
  { feature: "AI code generation (SDK snippets)", ours: "yes", cd: "no" },
  { feature: "Visual bucket policy editor", ours: "yes", cd: "no" },
  { feature: "CORS configuration", ours: "yes", cd: "yes" },
  { feature: "S3 cost estimator", ours: "yes", cd: "no" },
  { feature: "Presigned URL generator", ours: "yes", cd: "yes" },
  { feature: "File preview", ours: "In app", cd: "Quick Look" },
  { feature: "Drag-and-drop transfers", ours: "yes", cd: "yes" },
  { feature: "Versioning UI", ours: "yes", cd: "yes" },
  { feature: "Other protocols (FTP/SFTP/WebDAV)", ours: "no", cd: "yes" },
  { feature: "Free", ours: "14-day trial", cd: "donationware" },
];

export default function VsCyberduckPage() {
  return (
    <>
      <Header />
      <Script
        id="ld-faq-vs-cyberduck"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="ld-bc-vs-cyberduck"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <nav className="text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">Buckets by ServerlessCreed vs Cyberduck</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Buckets by ServerlessCreed vs. Cyberduck
          </h1>
          <p className="text-xl text-slate-700 mb-2">
            A focused Cyberduck alternative for AWS S3 workflows.
          </p>
          <p className="text-base text-slate-600 max-w-3xl mb-8">
            Cyberduck is a general-purpose file transfer client. Buckets by
            ServerlessCreed focuses on S3 administration with AWS SSO, policy
            editing, SDK code generation, and cost-estimation workflows.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                <FaDownload className="mr-2 h-4 w-4" />
                Try Buckets by ServerlessCreed free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                See pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick verdict */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Pick Buckets by ServerlessCreed if…
              </p>
              <ul className="space-y-2 text-sm text-slate-800">
                {[
                  "AWS S3 is your daily-driver storage.",
                  "You want S3 administration and account switching in one workspace.",
                  "You manage multiple AWS accounts/profiles.",
                  "You write AWS SDK code and want generated snippets.",
                  "You edit bucket policies and CORS rules regularly.",
                  "You care about S3 cost visibility.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <FaCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Stay on Cyberduck if…
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                {[
                  "Most of your transfers are FTP, SFTP, or WebDAV.",
                  "You use B2, GCS, OneDrive, or Dropbox alongside S3.",
                  "Your current S3 transfer and authentication workflow already fits.",
                  "You're happy with the AWS web console for admin tasks.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <FaCheck className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-4 italic">
                The two apps can also be used together: Cyberduck for protocol
                breadth and Buckets by ServerlessCreed for S3-focused workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed comparison table */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Feature-by-feature: Buckets by ServerlessCreed vs Cyberduck
          </h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Authentication and platform details reviewed September 5, 2026. See the{" "}
            <a href="https://docs.cyberduck.io/protocols/s3/" className="underline">Cyberduck S3 documentation</a>{" "}
            for supported authentication, versioning, and configuration workflows.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Feature</th>
                  <th className="px-4 py-3 font-semibold text-primary text-center">Buckets by ServerlessCreed</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-center">Cyberduck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 text-slate-800">
                      {row.feature}
                      {row.note && (
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {row.note}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Cell value={row.ours} />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      <Cell value={row.cd} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Migration */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            No data migration is required
          </h2>
          <ol className="space-y-4 text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">1</span>
              <span>
                <strong className="text-slate-900">Install Buckets by ServerlessCreed.</strong>{" "}
                <Link href="/downloads" className="text-primary hover:underline">
                  Download
                </Link>{" "}
                the build for your OS — macOS, Windows, or Linux. The trial
                starts when you launch the app.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">2</span>
              <span>
                <strong className="text-slate-900">Sign in to AWS.</strong>{" "}
                Buckets by ServerlessCreed reads your existing <code className="text-xs bg-slate-100 px-1 rounded">~/.aws/credentials</code>{" "}
                and AWS SSO config. If you used access keys in Cyberduck, paste
                them once and save the profile.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">3</span>
              <span>
                <strong className="text-slate-900">That&apos;s it.</strong> Your
                buckets show up immediately. No data migration — Buckets by ServerlessCreed
                doesn&apos;t move or copy anything; it&apos;s just a new
                interface to the same S3 buckets you already have.
              </span>
            </li>
          </ol>
        </section>

        {/* Other alternatives cross-link */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Looking at other S3 clients too?
            </h2>
            <p className="text-slate-700 mb-4">
              We compare Buckets by ServerlessCreed to AWS Console, S3 Browser, and others on the{" "}
              <Link href="/aws-s3-client" className="text-primary hover:underline font-medium">
                AWS S3 client overview page
              </Link>
              .
            </p>
            <Link
              href="/aws-s3-client"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              See full comparison <FaArrowRight className="h-3 w-3" />
            </Link>
          </div>
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
            Try Buckets by ServerlessCreed alongside Cyberduck for two weeks
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            14 days, full features, no card. Run both apps and see which one
            you reach for. We&apos;ll respect whichever you choose.
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

function Cell({ value }: { value: string }) {
  if (value === "yes") {
    return <FaCheck className="inline h-4 w-4 text-green-600" aria-label="Yes" />;
  }
  if (value === "no") {
    return <FaTimes className="inline h-4 w-4 text-slate-400" aria-label="No" />;
  }
  return <span className="text-xs text-slate-600">{value}</span>;
}
