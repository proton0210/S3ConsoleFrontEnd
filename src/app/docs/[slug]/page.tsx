/**
 * /docs/[slug] — one documentation page, statically generated for every page
 * of the generated user guide (see src/lib/docs.ts).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { allDocsPages, docsSummary, getDocsPage } from "@/lib/docs";
import { siteConfig } from "@/lib/config";
import { constructMetadata } from "@/lib/utils";
import { Metadata } from "next";

type RouteProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return allDocsPages().map((page) => ({ slug: page.id }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const found = getDocsPage(slug);
  if (!found) return constructMetadata({ noindex: true });
  return constructMetadata({
    title: `${found.page.title} — Buckets Documentation`,
    description: docsSummary(found.page),
    canonical: `${siteConfig.url}/docs/${slug}`,
  });
}

export default async function DocsPageRoute({ params }: RouteProps) {
  const { slug } = await params;
  const found = getDocsPage(slug);
  if (!found) notFound();
  const { page, part, previous, next } = found;
  const titles = new Map(allDocsPages().map((p) => [p.id, p.title]));

  return (
    <main>
      <Header />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-20 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={`${part.title} pages`} className="hidden lg:block text-sm">
          <Link href="/docs" className="text-muted-foreground hover:text-primary">← All documentation</Link>
          <p className="mt-6 mb-2 font-semibold text-foreground">{part.title}</p>
          <ul className="space-y-1.5">
            {part.pages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/docs/${p.id}`}
                  aria-current={p.id === page.id ? "page" : undefined}
                  className={p.id === page.id ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl">
          <p className="text-sm text-muted-foreground mb-3">
            <Link href={`/docs#${part.slug}`} className="hover:text-primary transition-colors">{part.title}</Link>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-8 leading-tight">{page.title}</h1>

          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.anchor} id={section.anchor} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b">{section.heading}</h2>
                <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">{section.content}</p>
                {section.steps.length > 0 && (
                  <ol className="mt-4 list-decimal space-y-1.5 pl-6 text-[15px]">
                    {section.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                )}
                {section.tips.length > 0 && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tips</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {section.tips.map((tip) => <li key={tip}>{tip}</li>)}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {page.commands.length > 0 && (
            <div className="mt-12 rounded-xl border p-5">
              <h2 className="text-base font-semibold text-foreground mb-1">Open it from the command palette</h2>
              <p className="text-sm text-muted-foreground mb-3">Press Cmd+K (macOS) or Ctrl+K (Windows/Linux) in Buckets and search for:</p>
              <ul className="space-y-1.5 text-sm">
                {page.commands.map((command) => (
                  <li key={`${command.title}-${command.path.join(">")}`}>
                    <span className="font-medium text-foreground">{command.title}</span>
                    <span className="text-muted-foreground"> — {command.path.join(" › ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {page.relatedPages.length > 0 && (
            <div className="mt-10">
              <h2 className="text-base font-semibold text-foreground mb-3">Related</h2>
              <div className="flex flex-wrap gap-2">
                {page.relatedPages.filter((id) => titles.has(id)).map((id) => (
                  <Link key={id} href={`/docs/${id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                    {titles.get(id)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between gap-4 border-t pt-6 text-sm">
            {previous ? <Link href={`/docs/${previous.id}`} className="hover:text-primary">← {previous.title}</Link> : <span />}
            {next ? <Link href={`/docs/${next.id}`} className="hover:text-primary text-right">{next.title} →</Link> : <span />}
          </div>
        </article>
      </div>
      <Footer />
    </main>
  );
}
