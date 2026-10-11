/**
 * /docs — Buckets documentation index.
 *
 * Content is generated from the desktop app's in-app documentation (see
 * src/lib/docs.ts), so this page always matches the shipping app.
 */
import Link from "next/link";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { docsAppVersion, docsParts, docsSummary } from "@/lib/docs";
import { siteConfig } from "@/lib/config";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Buckets Documentation — every feature of the S3 desktop client",
  description:
    "The complete Buckets by ServerlessCreed user guide: authentication, browsing, permissions, bucket settings, Athena, Drop Zones, Time Travel, Folder Sync, CloudFront and the command palette.",
  canonical: `${siteConfig.url}/docs`,
});

export default function DocsIndexPage() {
  const pageCount = docsParts.reduce((n, part) => n + part.pages.length, 0);
  return (
    <main>
      <Header />
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">Documentation</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">Buckets user guide</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {pageCount} pages covering every feature in Buckets {docsAppVersion}. The same guide ships inside the app —
          open it from the profile menu, or press <kbd className="rounded border px-1.5 py-0.5 text-sm">Cmd/Ctrl+K</kbd> and
          search for any feature.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-20 grid gap-8 md:grid-cols-2">
        {docsParts.map((part) => (
          <div key={part.slug} id={part.slug} className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">{part.title}</h2>
            <ul className="space-y-3">
              {part.pages.map((page) => (
                <li key={page.id}>
                  <Link href={`/docs/${page.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                    {page.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{docsSummary(page)}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <Footer />
    </main>
  );
}
