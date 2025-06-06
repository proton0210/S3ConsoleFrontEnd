import { Icons } from "@/components/icons";
import Section from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function CtaSection() {
  return (
    <Section
      id="cta"
      title="Ready to get started?"
      subtitle="Get lifetime access to professional S3 management."
      className="bg-primary/10 rounded-xl py-16"
    >
      <div className="flex flex-col w-full sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
        <SignedOut>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto text-background"
            )}
          >
            Get started for free
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/downloads"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto text-background"
            )}
          >
            Download S3Console
          </Link>
        </SignedIn>
      </div>
    </Section>
  );
}
