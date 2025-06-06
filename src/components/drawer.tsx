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

export default function drawerDemo() {
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
              className="relative mr-6 flex items-center space-x-2"
            >
              <Icons.logo className="w-auto h-[40px]" />
              <span className="font-bold text-xl">{siteConfig.name}</span>
            </Link>
          </div>
          {!isDownloadsPage && (
            <nav>
              <ul className="mt-7 text-left">
                {siteConfig.header.map((item, index) => (
                  <li key={index} className="my-3">
                    {item.trigger ? (
                      <span className="font-semibold">{item.trigger}</span>
                    ) : (
                      <Link href={item.href || ""} className="font-semibold">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </DrawerHeader>
        <DrawerFooter>
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
            <div className="flex justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
