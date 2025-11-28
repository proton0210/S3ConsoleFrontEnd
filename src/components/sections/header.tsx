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
        <Link
          href="/"
          title="brand-logo"
          className="relative mr-6 flex items-center space-x-2"
        >
          <Icons.logo className="w-auto h-[55px]" />
          <span className="font-bold text-xl">{siteConfig.name}</span>
        </Link>

        <div className="hidden lg:block">
          <div className="flex items-center ">
            {!isDownloadsPage && (
              <nav className="mr-10">
                <Menu />
              </nav>
            )}

            <div className="gap-2 flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Contact The Developer</NavigationMenuTrigger>
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
              <SignedOut>
                <Link
                  href="/sign-in"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full sm:w-auto text-background flex gap-2"
                  )}
                >
                  Get Started for Free
                </Link>
              </SignedOut>
              <SignedIn>
                {!isDownloadsPage && (
                  <Link
                    href="/downloads"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full sm:w-auto text-background"
                    )}
                  >
                    Download S3Console
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
