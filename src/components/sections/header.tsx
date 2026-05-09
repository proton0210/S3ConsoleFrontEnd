"use client";

import Drawer from "@/components/drawer";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import HomeStickyPromo from "@/components/home-sticky-promo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const NAV: { label: string; href: string }[] = [
  { label: "features", href: "/#features" },
  { label: "pricing",  href: "/pricing" },
  { label: "download", href: "/downloads" },
  { label: "faq",      href: "/#faq" },
];

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-1.5 px-1 py-1 text-[12px] uppercase tracking-[0.18em] transition-colors",
        active ? "text-ink" : "text-char-600 hover:text-ink"
      )}
    >
      <span aria-hidden className={cn("text-signal", active ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")}>
        ▸
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isDownloadsPage = pathname === "/downloads";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {pathname === "/" && <HomeStickyPromo />}

      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled
            ? "border-ink bg-paper/95 backdrop-blur-md"
            : "border-transparent bg-paper/80 backdrop-blur"
        )}
      >
        {/* serial bar */}
        <div className="hidden lg:flex items-center justify-between border-b border-ink/10 px-6 py-1 text-[10px] uppercase tracking-[0.22em] text-char-600">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            status — operational
          </span>
          <span>build {siteConfig.name.toLowerCase()}/2.3.5</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* brand */}
          <Link href="/" title="S3Console" className="flex items-center gap-2">
            <Icons.logo className="h-9 w-auto" />
            <span className="font-display text-lg font-medium tracking-tight">
              {siteConfig.name}
              <span className="text-signal">.</span>
            </span>
          </Link>

          {/* nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {!isDownloadsPage && NAV.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </nav>

          {/* auth controls */}
          <div className="hidden lg:flex items-center gap-2">
            <SignedOut>
              <Link
                href="/sign-in"
                className="px-3 py-2 text-[12px] uppercase tracking-[0.18em] text-char-600 hover:text-ink transition-colors"
              >
                sign in
              </Link>
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-paper hover:bg-signal hover:border-signal transition-colors"
              >
                <span>get started</span>
                <span className="arrow-tick">→</span>
              </Link>
            </SignedOut>
            <SignedIn>
              {!isDownloadsPage && (
                <Link
                  href="/downloads"
                  className="group inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-paper hover:bg-signal hover:border-signal transition-colors"
                >
                  <span>download</span>
                  <span className="arrow-tick">→</span>
                </Link>
              )}
              <div className="ml-1 flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>

          {/* mobile drawer */}
          <div className="lg:hidden">
            <Drawer />
          </div>
        </div>
      </div>
    </header>
  );
}
