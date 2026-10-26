import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LegalDocPageProps {
  /** Filename inside `src/content/legal/`, e.g. "terms.md". */
  filename: string;
}

function readLegalMarkdown(filename: string): string {
  const filePath = path.join(process.cwd(), "src", "content", "legal", filename);
  return fs.readFileSync(filePath, "utf8");
}

export default function LegalDocPage({ filename }: LegalDocPageProps) {
  const markdown = readLegalMarkdown(filename);

  // Site header, "Back to Home" link and legal footer links come from
  // app/(legal)/layout.tsx (re-used by app/privacy/layout.tsx), so this
  // component renders only the document body.
  return (
    <div className="max-w-3xl mx-auto px-5 pt-6 pb-16 sm:px-10">
      <article className="prose prose-neutral max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
