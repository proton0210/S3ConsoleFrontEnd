import { siteConfig } from "@/lib/config";
import Link from "next/link";

/**
 * Footer doubles as an internal-linking surface for SEO. Every page that
 * renders <Footer /> emits anchor links to our money pages and SEO landing
 * pages — that's how we tell crawlers which URLs are most important and
 * pass authority around the site.
 */
const NAV = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Download", href: "/downloads" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "AWS S3 Client", href: "/aws-s3-client" },
      { label: "AWS S3 GUI", href: "/aws-s3-gui" },
      { label: "Cyberduck Alternative", href: "/vs/cyberduck" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund-policy" },
      { label: "EULA", href: "/eula" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-bold text-lg text-foreground">
              {siteConfig.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              The fastest AWS S3 client for Mac, Windows, and Linux.
            </p>
          </div>
          {NAV.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()}{" "}
            <Link href="/" className="hover:text-primary transition-colors">
              {siteConfig.name}
            </Link>
            . The fastest AWS S3 client for Mac, Windows, and Linux.
          </span>
          <span>Built for developers who live in AWS.</span>
        </div>
      </div>
    </footer>
  );
}
