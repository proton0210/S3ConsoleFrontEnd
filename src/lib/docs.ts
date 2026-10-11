/**
 * Website documentation data.
 *
 * `src/content/docs/docs.generated.json` is generated from the desktop app's
 * in-app documentation and command registry by
 * `s3Console/scripts/generate-docs.mjs`, so the website, the app and the repo
 * user guide always say the same thing. Do not edit the JSON by hand.
 */
import data from "@/content/docs/docs.generated.json";

export type DocsSection = {
  heading: string;
  anchor: string;
  content: string;
  steps: string[];
  tips: string[];
};

export type DocsCommand = { title: string; path: string[] };

export type DocsPage = {
  id: string;
  title: string;
  sections: DocsSection[];
  relatedPages: string[];
  commands: DocsCommand[];
};

export type DocsPart = { title: string; slug: string; pages: DocsPage[] };

type DocsData = { appVersion: string; parts: DocsPart[] };

const docs = data as unknown as DocsData;

export const docsAppVersion = docs.appVersion;
export const docsParts: DocsPart[] = docs.parts;

export function allDocsPages(): Array<DocsPage & { part: string }> {
  return docsParts.flatMap((part) => part.pages.map((page) => ({ ...page, part: part.title })));
}

export function getDocsPage(id: string) {
  for (const part of docsParts) {
    const index = part.pages.findIndex((page) => page.id === id);
    if (index >= 0) {
      return {
        page: part.pages[index],
        part,
        previous: part.pages[index - 1] ?? null,
        next: part.pages[index + 1] ?? null,
      };
    }
  }
  return null;
}

/** First sentence of the page, for meta descriptions and cards. */
export function docsSummary(page: DocsPage): string {
  const text = page.sections[0]?.content ?? page.title;
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}
