import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import Link from "next/link";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

const SOCIALS = [
  {
    label: "X (Twitter)",
    href: "https://x.com/ServerlessCreed",
    Icon: FaXTwitter,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/serverlesscreed/",
    Icon: RiInstagramFill,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/serverless-creed",
    Icon: FaLinkedinIn,
  },
];

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
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund-policy" },
      { label: "EULA", href: "/eula" },
      { label: "Trust Center", href: "/trust" },
      { label: "Marketplace EULA", href: "/marketplace-eula" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10">
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-foreground">
              <Icons.logo className="h-9 w-9 object-contain" />
              <span className="flex flex-col leading-none">
                <span className="text-lg font-semibold tracking-[-0.03em]">{siteConfig.shortName}</span>
                <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  by {siteConfig.publisherName}
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              The desktop app for engineers who live in S3. Every bucket, every
              AWS account, one app.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`ServerlessCreed on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <a
              href="https://tables.serverlesscreed.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="font-semibold text-foreground">Also from ServerlessCreed:</span>
              Tables for DynamoDB
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </a>
          </div>
          {NAV.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <span>
            Talk to the developer on{" "}
            <a href="https://x.com/Vidit_210" target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 hover:text-foreground">
              X
            </a>{" "}
            or{" "}
            <a href="https://www.linkedin.com/in/vidit-shah/" target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 hover:text-foreground">
              LinkedIn
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
