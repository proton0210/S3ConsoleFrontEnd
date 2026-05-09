import { siteConfig } from "@/lib/config";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "pricing", href: "/pricing" },
  { label: "download", href: "/downloads" },
  { label: "privacy", href: "/privacy" },
  { label: "terms", href: "/terms" },
  { label: "refund", href: "/refund-policy" },
];

const SOCIAL = [
  { label: "x.com / vidit_210", href: "https://x.com/Vidit_210" },
  { label: "in / vidit-shah",   href: "https://www.linkedin.com/in/vidit-shah/" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* main row */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div className="lg:col-span-2">
            <p className="font-display text-3xl font-light leading-tight">
              {siteConfig.name}
              <span className="text-signal">.</span>
            </p>
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-char-600">
              A desktop client for Amazon S3, built like a terminal.
              Your credentials never leave your machine.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-char-400 mb-4">
              navigate
            </p>
            <ul className="space-y-2 text-[13px]">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-char-800 hover:text-ink transition-colors"
                  >
                    <span aria-hidden className="text-signal opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-char-400 mb-4">
              contact
            </p>
            <ul className="space-y-2 text-[13px]">
              {SOCIAL.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-char-800 hover:text-ink transition-colors"
                  >
                    <span aria-hidden className="text-signal opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    <span>{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* status bar */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-ink py-4 text-[10px] uppercase tracking-[0.22em] text-char-600 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            © {new Date().getFullYear()} serverlesscreed
          </span>
          <span className="hidden sm:inline">build s3c/2.3.5 — paper · ink · signal</span>
          <span>made for the terminal</span>
        </div>
      </div>
    </footer>
  );
}
