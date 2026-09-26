"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import Link from "next/link";
import { ArrowRight, Lock, MonitorSmartphone, Sparkles, Zap } from "lucide-react";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";

import { ProductShot } from "@/components/product-shot";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1];

function HeroPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <Link
        href="/blog/dropzones-public-upload-links-for-s3"
        onClick={() => sendGAEvent("event", "hero_pill_clicked")}
        className="group inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] py-1 pl-1 pr-3 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          New
        </span>
        Drop Zones: let anyone upload to your bucket
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center pt-8">
      <motion.h1
        className="text-balance text-center text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl md:text-7xl"
        initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{ duration: 1, ease }}
      >
        <span className="text-gradient">Every S3 bucket. Every AWS account.</span>{" "}
        <span className="text-gradient-brand">One desktop app.</span>
      </motion.h1>
      <motion.p
        className="mx-auto mt-7 max-w-2xl text-balance text-center text-lg leading-8 text-muted-foreground sm:text-xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.8, ease }}
      >
        Buckets is the S3 client for engineers who live in AWS. Sign in with
        SSO, switch accounts in a click, and move, share and secure your files
        from one fast, focused app.
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  return (
    <motion.div
      className="mt-10 flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.8, ease }}
    >
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/downloads"
          onClick={() => sendGAEvent("event", "hero_download_clicked")}
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
            "h-12 w-full rounded-full border-border bg-foreground/[0.03] px-7 text-base font-medium backdrop-blur hover:bg-foreground/[0.07] sm:w-auto"
          )}
        >
          View pricing
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <FaApple className="h-4 w-4" />
          <FaWindows className="h-3.5 w-3.5" />
          <FaLinux className="h-4 w-4" />
          <span>macOS, Windows &amp; Linux</span>
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>14-day full trial</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>No credit card</span>
      </div>
    </motion.div>
  );
}

function HeroImage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // Floating panels drift at different speeds for a subtle depth effect.
  const yLeft = useTransform(scrollYProgress, [0, 1], [40, -60]);
  const yRight = useTransform(scrollYProgress, [0, 1], [80, -40]);
  const tilt = useTransform(scrollYProgress, [0, 0.5], [8, 0]);

  return (
    <motion.div
      ref={ref}
      className="relative mx-auto mt-20 w-full max-w-6xl [perspective:2000px]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 1, ease }}
    >
      {/* Glow behind the product frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-[3rem] bg-primary/10 blur-[100px] dark:bg-primary/20"
      />

      {/* Main app window */}
      <motion.div
        style={{ rotateX: tilt }}
        className="surface shadow-frame relative origin-bottom overflow-hidden rounded-2xl"
      >
        <div className="flex h-9 items-center gap-2 border-b border-border px-4">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto pr-12 text-xs font-medium text-muted-foreground">
            Buckets
          </span>
        </div>
        <ProductShot name="workspace" priority sizes="(max-width: 1200px) 100vw, 1150px" />
      </motion.div>

      {/* Floating: saved accounts, anchored near the app's profile button */}
      <motion.div
        style={{ y: yLeft }}
        className="absolute -right-8 top-[9%] hidden w-[220px] overflow-hidden rounded-xl border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-black/5 lg:block xl:-right-16"
      >
        <ProductShot name="profiles" sizes="220px" />
      </motion.div>

      {/* Floating: command palette */}
      <motion.div
        style={{ y: yRight }}
        className="absolute -bottom-14 -left-8 hidden w-[360px] overflow-hidden rounded-xl border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-black/5 lg:block xl:-left-16"
      >
        <ProductShot name="palette" sizes="360px" />
      </motion.div>
    </motion.div>
  );
}

const PROOF = [
  {
    icon: Lock,
    title: "Local-first",
    body: "Your AWS credentials stay on your machine.",
  },
  {
    icon: Zap,
    title: "Direct to AWS",
    body: "Traffic goes straight from your computer to AWS.",
  },
  {
    icon: MonitorSmartphone,
    title: "Native on every desktop",
    body: "One license for macOS, Windows and Linux.",
  },
  {
    icon: Sparkles,
    title: "Everything included",
    body: "Every feature on every plan. No add-ons.",
  },
];

function ProofStrip() {
  return (
    <div className="mx-auto mt-16 grid lg:mt-32 w-full max-w-6xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {PROOF.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex items-start gap-3 bg-background p-6">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-glow pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="relative flex w-full flex-col items-center px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:px-8">
        <HeroPill />
        <HeroTitles />
        <HeroCTA />
        <HeroImage />
        <ProofStrip />
      </div>
    </section>
  );
}
