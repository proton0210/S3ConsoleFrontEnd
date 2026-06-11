"use client";

import { motion } from "framer-motion";
import { sendGAEvent } from "@next/third-parties/google";

import { Icons } from "@/components/icons";
import HeroShowcase from "@/components/magicui/hero-showcase";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1];

function HeroPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <Link
        href="/blog/best-s3-desktop-client-2026"
        onClick={() => sendGAEvent("event", "hero_pill_clicked")}
        className="flex w-auto items-center space-x-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-1.5 ring-1 ring-primary/20 whitespace-pre transition-all hover:from-primary/30 hover:to-primary/10"
      >
        <p className="text-xs font-medium text-primary sm:text-sm">
          S3Console vs Rest
        </p>
        <svg
          width="12"
          height="12"
          className="ml-1"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
            fill="hsl(var(--primary))"
          />
        </svg>
      </Link>
    </motion.div>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-2xl flex-col space-y-4 overflow-hidden pt-8">
      <motion.h1
        className="text-center text-4xl font-medium leading-tight text-foreground sm:text-5xl md:text-6xl"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        <span className="sr-only">S3 Workflows, Simplified</span>
        {["S3", "Workflows,", "Simplified"].map(
          (text, index) => (
            <motion.span
              key={index}
              className="inline-block px-1 md:px-2 text-balance font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease,
              }}
              aria-hidden={index > 0}
            >
              {text}
            </motion.span>
          )
        )}
      </motion.h1>
      <motion.p
        className="mx-auto max-w-xl text-center text-lg leading-7 text-muted-foreground sm:text-xl sm:leading-9 text-balance"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        Move faster with a professional desktop app for AWS S3.
      </motion.p>
    </div>
  );
}

function HeroCTA() {

  return (
    <>
      <motion.div
        className="mx-auto mt-6 flex w-full max-w-2xl flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease }}
      >
        <Link
          href="/downloads"
          onClick={() => sendGAEvent("event", "hero_download_clicked")}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full sm:w-auto text-background flex gap-2"
          )}
        >
          Try Free — Download Now
        </Link>
      </motion.div>
    </>
  );
}

function HeroImage() {
  return (
    <motion.div
      className="relative mx-auto mt-16 flex w-full max-w-screen-lg items-center justify-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 1, ease }}
    >
      <HeroShowcase />
    </motion.div>
  );
}

export default function Hero2() {
  return (
    <section id="hero">
      <div className="relative flex w-full flex-col items-center justify-start px-4 pt-16 sm:px-6 sm:pt-12 md:pt-16 lg:px-8">
        <HeroPill />
        <HeroTitles />
        <HeroCTA />
        <HeroImage />
        <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t from-background to-transparent"></div>
      </div>
    </section>
  );
}
