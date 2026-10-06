"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";

import { ProductShot } from "@/components/product-shot";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUITE_PATH, SUITE_PRICE_USD } from "@/lib/suite-offer";

export default function CtaSection() {
  return (
    <section id="cta" className="px-4 pb-24 pt-8">
      <div className="surface relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 pt-20 text-center sm:px-12 md:pt-24">
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
                "group relative h-12 w-full overflow-hidden rounded-full px-7 text-base font-semibold transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto",
                "shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]"
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shine"
              />
              Download free trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
          <p className="mt-6 text-sm text-muted-foreground">
            Use DynamoDB too? Own both apps for good with the{" "}
            <Link
              href={SUITE_PATH}
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
            >
              Tables + Buckets Suite — ${SUITE_PRICE_USD}
            </Link>
            .
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground">
            <FaApple className="h-5 w-5" aria-label="macOS" />
            <FaWindows className="h-4 w-4" aria-label="Windows" />
            <FaLinux className="h-5 w-5" aria-label="Linux" />
          </div>
        </div>

        {/* The app rises out of the bottom of the card as it scrolls into view. */}
        <div className="relative mx-auto mt-14 max-w-4xl [perspective:1800px]">
          <motion.div
            initial={{ y: 120, rotateX: 18, opacity: 0 }}
            whileInView={{ y: 0, rotateX: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: EASE_OUT }}
            className="origin-bottom overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-[0_-20px_80px_-30px_hsl(var(--primary)/0.45)]"
          >
            <div className="flex h-8 items-center gap-1.5 border-b border-border px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="h-[220px] overflow-hidden sm:h-[300px] md:h-[360px]">
              <ProductShot
                name="home"
                sizes="(max-width: 640px) 170vw, (max-width: 900px) 100vw, 900px"
                className="origin-top-left scale-[1.7] sm:scale-100"
              />
            </div>
          </motion.div>
          {/* A ⌘K keycap presses, then the command palette drops in. */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: [10, 0, 0, 3, 0] }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, times: [0, 0.35, 0.6, 0.75, 1], delay: 0.3 }}
            className="absolute -top-5 right-[22%] z-10 hidden items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground shadow-[0_4px_0_0_hsl(var(--border))] md:flex lg:right-[12%]"
          >
            <span>⌘</span>
            <span>K</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 1.05, ...SPRING }}
            style={{ rotate: 2 }}
            className="absolute -right-4 top-10 hidden w-[300px] overflow-hidden rounded-xl border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] md:block lg:-right-16"
          >
            <ProductShot name="palette" sizes="300px" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
