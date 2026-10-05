"use client";

import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { THEMED_ROUTES } from "@/components/theme-switch";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IoMenuSharp } from "react-icons/io5";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function DrawerMenu() {
  const pathname = usePathname();
  const isDownloadsPage = pathname === "/downloads";
  const [open, setOpen] = useState(false);
  // The drawer renders in a portal outside the page, so give it the page's
  // premium palette (and dark mode) only where the page itself has it.
  const themed = THEMED_ROUTES.has(pathname);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        aria-label="Open menu"
        className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/5"
      >
        <IoMenuSharp className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          themed && "theme-scope",
          "max-h-[90dvh] pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <DrawerHeader className="px-6 text-left">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Site and account navigation</DrawerDescription>
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
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  by {siteConfig.publisherName}
                </span>
              </span>
            </Link>
          </div>
          {!isDownloadsPage && (
            <nav>
              <ul className="mt-5 text-left">
                {siteConfig.header.map((item, index) => (
                  <li key={index}>
                    {/* Close on tap so same-page anchors (#tour) aren't hidden behind the drawer. */}
                    <DrawerClose asChild>
                      <Link
                        href={item.href || ""}
                        className="flex min-h-[48px] items-center border-b border-border/60 text-lg font-semibold"
                      >
                        {item.label}
                      </Link>
                    </DrawerClose>
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
                className="flex min-h-[44px] items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.twitter className="h-5 w-5 fill-current" />
                <span>X</span>
              </Link>
              <Link
                href="https://www.linkedin.com/in/vidit-shah/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.linkedin className="h-5 w-5" />
                <span>LinkedIn</span>
              </Link>
            </div>
          </div>
          <SignedOut>
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "outline" }), "h-11")}
            >
              Sign In
            </Link>
            <Link
              href="/downloads"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-11 w-full sm:w-auto text-primary-foreground flex gap-2"
              )}
            >
              Download Now
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/account/billing" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>Billing</Link>
            <Link href="/account/invoices" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>Invoices &amp; receipts</Link>
            <Link href="/account/team" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline" })}>Team</Link>
            {!isDownloadsPage && (
              <Link
                href="/downloads"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 w-full sm:w-auto text-primary-foreground"
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
