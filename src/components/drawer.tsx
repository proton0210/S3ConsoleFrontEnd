"use client";

import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMenuSharp } from "react-icons/io5";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function DrawerMenu() {
  const pathname = usePathname();
  const isDownloadsPage = pathname === "/downloads";

  return (
    <Drawer>
      <DrawerTrigger>
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="px-6">
          <div className="">
            <Link
              href="/"
              title="brand-logo"
              aria-label={`${siteConfig.name} home`}
              className="group relative mr-6 flex items-center gap-2.5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50 to-orange-100 shadow-[0_8px_24px_-14px_rgba(194,65,12,0.8)] transition duration-300 group-hover:-translate-y-0.5">
                <Icons.logo className="h-10 w-10 object-contain" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-xl font-semibold tracking-[-0.025em]">{siteConfig.shortName}</span>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  by {siteConfig.publisherName}
                </span>
              </span>
            </Link>
          </div>
          {!isDownloadsPage && (
            <nav>
              <ul className="mt-7 text-left">
                {siteConfig.header.map((item, index) => (
                  <li key={index} className="my-3">
                    <Link href={item.href || ""} className="font-semibold">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </DrawerHeader>
        <DrawerFooter>
          <div className="mb-4">
            <p className="font-semibold mb-2">Contact The Developer</p>
            <div className="flex gap-4">
              <Link
                href="https://x.com/Vidit_210"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.twitter className="h-5 w-5 fill-current" />
                <span>X</span>
              </Link>
              <Link
                href="https://www.linkedin.com/in/vidit-shah/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.linkedin className="h-5 w-5" />
                <span>LinkedIn</span>
              </Link>
            </div>
          </div>
          <SignedOut>
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
            <div className="flex justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
