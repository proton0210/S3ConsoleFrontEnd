import Link from "next/link";
import Header from "@/components/sections/header";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
        {children}
        <div className="max-w-3xl mx-auto px-6 pb-16 -mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/refund-policy" className="hover:text-primary transition-colors">
            Refunds
          </Link>
          <Link href="/eula" className="hover:text-primary transition-colors">
            EULA
          </Link>
          <span className="ml-auto">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </span>
        </div>
      </div>
    </>
  );
}
