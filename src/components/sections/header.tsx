"use client";

import Drawer from "@/components/drawer";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Menu from "@/components/menu";
import HomeStickyPromo from "@/components/home-sticky-promo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Header() {
  const [addBorder, setAddBorder] = useState(false);
  const pathname = usePathname();
  const isDownloadsPage = pathname === "/downloads";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setAddBorder(true);
      } else {
        setAddBorder(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className="relative sticky top-0 z-50 bg-background/60 backdrop-blur">
      {pathname === "/" && <HomeStickyPromo />}
      <div className="flex items-center justify-between container py-2">
        <div className="relative mr-6 flex items-center gap-1">
          <Link
            href="/"
            title="brand-logo"
            aria-label={`${siteConfig.name} home`}
            className="group relative flex items-center gap-2.5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50 to-orange-100 shadow-[0_8px_24px_-14px_rgba(194,65,12,0.8)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_28px_-14px_rgba(194,65,12,0.9)]">
              <Icons.logo className="h-10 w-10 object-contain" priority />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-[-0.025em]">{siteConfig.shortName}</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                by {siteConfig.publisherName}
              </span>
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem className="relative">
                <NavigationMenuTrigger
                  aria-label="Contact the Dev"
                  className="peer"
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">Contact the Dev</span>
                </NavigationMenuTrigger>
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity peer-hover:opacity-100 peer-data-[state=open]:opacity-0">
                  Contact the Dev
                </span>
                <NavigationMenuContent>
                  <ul className="w-[200px] p-2">
                    <li>
                      <Link
                        href="https://x.com/Vidit_210"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-md p-3 hover:bg-accent transition-colors"
                      >
                        <Icons.twitter className="h-5 w-5 fill-current" />
                        <span>X (Twitter)</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://www.linkedin.com/in/vidit-shah/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-md p-3 hover:bg-accent transition-colors"
                      >
                        <Icons.linkedin className="h-5 w-5" />
                        <span>LinkedIn</span>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:block">
          <div className="flex items-center ">
            {!isDownloadsPage && (
              <nav className="mr-10">
                <Menu />
              </nav>
            )}

            <div className="gap-2 flex items-center">
              <SignedOut>
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "hidden md:inline-flex"
                  )}
                >
                  Pricing
                </Link>
                <Link
                  href="/sign-in"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign In
                </Link>
                <Link
                  href="/downloads"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full sm:w-auto text-background flex gap-2"
                  )}
                >
                  Download Now
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/account/billing"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "hidden md:inline-flex"
                  )}
                >
                  Billing
                </Link>
                <Link
                  href="/account/marketplace"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "hidden xl:inline-flex"
                  )}
                >
                  Marketplace
                </Link>
                {!isDownloadsPage && (
                  <Link
                    href="/downloads"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full sm:w-auto text-background"
                    )}
                  >
                    Download Buckets
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
        <div className="mt-2 cursor-pointer block lg:hidden">
          <Drawer />
        </div>
      </div>
      <hr
        className={cn(
          "absolute w-full bottom-0 transition-opacity duration-300 ease-in-out",
          addBorder ? "opacity-100" : "opacity-0"
        )}
      />
    </header>
  );
}
