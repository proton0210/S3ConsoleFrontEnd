"use client";

import Drawer from "@/components/drawer";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Menu from "@/components/menu";
import { ThemeSwitch } from "@/components/theme-switch";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isDownloadsPage = pathname === "/downloads";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          title="brand-logo"
          aria-label={`${siteConfig.name} home`}
          className="group flex items-center gap-2.5"
        >
          <Icons.logo
            className="h-9 w-9 object-contain drop-shadow-[0_6px_16px_rgba(234,120,40,0.35)] transition-transform duration-300 group-hover:-translate-y-0.5"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              {siteConfig.shortName}
            </span>
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              by {siteConfig.publisherName}
            </span>
          </span>
        </Link>

        {!isDownloadsPage && (
          <nav className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <Menu />
          </nav>
        )}

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeSwitch />
          <SignedOut>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/downloads"
              className={cn(
                buttonVariants({ size: "sm" }),
                "group rounded-full px-4 font-semibold shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_8px_24px_-8px_hsl(var(--primary)/0.6)]"
              )}
            >
              Download
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/account/billing"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Billing
            </Link>
            <Link
              href="/account/marketplace"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden text-muted-foreground hover:text-foreground xl:inline-flex"
              )}
            >
              Marketplace
            </Link>
            {!isDownloadsPage && (
              <Link
                href="/downloads"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full px-4 font-semibold"
                )}
              >
                Download Buckets
              </Link>
            )}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
        <div className="flex items-center gap-3 text-foreground lg:hidden">
          <ThemeSwitch />
          <div className="cursor-pointer">
            <Drawer />
          </div>
        </div>
      </div>
    </header>
  );
}
