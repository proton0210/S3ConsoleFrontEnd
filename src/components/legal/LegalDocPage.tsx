import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/sections/header";

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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-5 py-16 sm:px-10">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to Home
          </Link>
          <article className="prose prose-neutral max-w-none mt-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        </div>
      </div>
    </>
  );
}
