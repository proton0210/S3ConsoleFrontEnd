/**
 * Comparison / alternative page targeting "Cyberduck alternative" + "S3Console
 * vs Cyberduck" search intent. These are very high-buyer-intent queries —
 * someone typing "Cyberduck alternative" is actively shopping.
 *
 * Tone: factual and respectful. Don't trash Cyberduck — it's a perfectly fine
 * general-purpose tool. We just position S3Console as the better fit when AWS
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
    q: "Is S3Console a good Cyberduck alternative?",
    a: "Yes — if AWS S3 is your primary use case. Cyberduck is a great general-purpose file transfer client (FTP, SFTP, WebDAV, S3, B2, GCS, OneDrive, etc.), but its S3 support is one tab among many. S3Console is purpose-built for S3 and includes features Cyberduck doesn't: AWS SSO/IAM Identity Center login, AI code generation for the AWS SDK, a visual bucket policy editor, S3 cost estimation, and multi-profile session management.",
  },
  {
    q: "What does S3Console have that Cyberduck doesn't?",
    a: "AWS SSO and IAM Identity Center login (no copy-pasting access keys), AI code generation for the AWS SDK in JavaScript/Python/Go/Java, a visual bucket policy and CORS editor, an S3 cost estimator, multi-account profile pinning, and an inline preview that uses range requests so you don't download whole files. Cyberduck has none of these — it's a transfer client, not an S3 admin tool.",
  },
  {
    q: "Is Cyberduck still better for non-S3 cloud storage?",
    a: "Yes. If you regularly use FTP, SFTP, WebDAV, Backblaze B2, Google Cloud Storage, OneDrive, or Dropbox alongside S3, Cyberduck's broader protocol support is genuinely useful. We'd recommend keeping Cyberduck for those cases and using S3Console as your dedicated S3 tool. Many engineers run both.",
  },
  {
    q: "Is S3Console free like Cyberduck?",
    a: "Cyberduck is donationware — free to use with a nag screen. S3Console offers a 14-day free trial with full feature access, then $9/month, $49/year, or $99 one-time for lifetime access. The trial doesn't require a credit card.",
  },
  {
    q: "How do I migrate from Cyberduck to S3Console?",
    a: "There's no migration step needed. S3Console reads your existing AWS CLI credentials, AWS SSO config, and IAM Identity Center sessions automatically. Install S3Console, sign in with the same AWS profile you used in Cyberduck, and your buckets show up immediately.",
  },
  {
    q: "Does S3Console run on Mac, Windows, and Linux like Cyberduck?",
    a: "Yes — S3Console ships native installers for macOS (Apple Silicon and Intel), Windows 10/11, and Linux (.deb, ARM64). All three platforms get the same feature set and update cycle.",
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
      name: "S3Console vs Cyberduck",
      item: `${siteConfig.url}/vs/cyberduck`,
    },
  ],
};

const COMPARISON_ROWS: { feature: string; ours: string; cd: string; note?: string }[] = [
  { feature: "Built specifically for AWS S3", ours: "yes", cd: "no", note: "Cyberduck supports 10+ protocols; S3 is one of them" },
  { feature: "Native macOS app", ours: "yes", cd: "yes" },
  { feature: "Native Windows app", ours: "yes", cd: "yes" },
  { feature: "Native Linux app", ours: "yes", cd: "yes" },
  { feature: "AWS SSO / IAM Identity Center login", ours: "yes", cd: "no" },
  { feature: "Multi-profile session manager", ours: "yes", cd: "limited" },
  { feature: "AI code generation (SDK snippets)", ours: "yes", cd: "no" },
  { feature: "Visual bucket policy editor", ours: "yes", cd: "no" },
  { feature: "Visual CORS editor", ours: "yes", cd: "no" },
  { feature: "S3 cost estimator", ours: "yes", cd: "no" },
  { feature: "Presigned URL generator", ours: "yes", cd: "yes" },
  { feature: "Inline preview (range GETs)", ours: "yes", cd: "no" },
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
            <span className="text-slate-700">S3Console vs Cyberduck</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            S3Console vs. Cyberduck
          </h1>
          <p className="text-xl text-slate-700 mb-2">
            The best Cyberduck alternative for AWS S3 power users.
          </p>
          <p className="text-base text-slate-600 max-w-3xl mb-8">
            Cyberduck is a great general-purpose file transfer client. But if
            AWS S3 is where you spend most of your day, you&apos;ll quickly hit
            its limits — no SSO, no policy editor, no SDK code generation, no
            cost view. S3Console picks up exactly where Cyberduck stops.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/downloads">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                <FaDownload className="mr-2 h-4 w-4" />
                Try S3Console free
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
                Pick S3Console if…
              </p>
              <ul className="space-y-2 text-sm text-slate-800">
                {[
                  "AWS S3 is your daily-driver storage.",
                  "You use AWS SSO or IAM Identity Center.",
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
                  "S3 is occasional and access-key auth is fine.",
                  "You're happy with the AWS web console for admin tasks.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <FaCheck className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-4 italic">
                Many teams run both — Cyberduck for breadth, S3Console for S3.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed comparison table */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Feature-by-feature: S3Console vs Cyberduck
          </h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Compared as of {new Date().getFullYear()}. Both apps ship updates
            regularly — verify current capabilities on each vendor&apos;s site
            before deciding.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Feature</th>
                  <th className="px-4 py-3 font-semibold text-primary text-center">S3Console</th>
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
            Switching from Cyberduck takes about a minute
          </h2>
          <ol className="space-y-4 text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">1</span>
              <span>
                <strong className="text-slate-900">Install S3Console.</strong>{" "}
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
                S3Console reads your existing <code className="text-xs bg-slate-100 px-1 rounded">~/.aws/credentials</code>{" "}
                and AWS SSO config. If you used access keys in Cyberduck, paste
                them once and save the profile.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">3</span>
              <span>
                <strong className="text-slate-900">That&apos;s it.</strong> Your
                buckets show up immediately. No data migration — S3Console
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
              We compare S3Console to AWS Console, S3 Browser, and others on the{" "}
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
            Try S3Console alongside Cyberduck for two weeks
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            14 days, full features, no card. Run both apps and see which one
            you reach for. We&apos;ll respect whichever you choose.
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
