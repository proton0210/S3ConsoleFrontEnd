import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CtaSection() {
  return (
    <section id="cta" className="px-4 pb-24 pt-8">
      <div className="surface relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-20 text-center sm:px-12 md:py-24">
        <div aria-hidden className="bg-glow pointer-events-none absolute inset-0" />
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            <span className="text-gradient">Make S3 the easy part of your day.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Try every feature free for 14 days. No credit card, no setup beyond
            the AWS profiles you already have.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/downloads"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group h-12 w-full rounded-full px-7 text-base font-semibold sm:w-auto",
                "shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]"
              )}
            >
              Download free trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full rounded-full border-border bg-foreground/[0.03] px-7 text-base font-medium hover:bg-foreground/[0.08] sm:w-auto"
              )}
            >
              View pricing
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground">
            <FaApple className="h-5 w-5" aria-label="macOS" />
            <FaWindows className="h-4 w-4" aria-label="Windows" />
            <FaLinux className="h-5 w-5" aria-label="Linux" />
          </div>
        </div>
      </div>
    </section>
  );
}
