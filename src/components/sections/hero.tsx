"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import HeroVideoDialog from "@/components/magicui/hero-video";

const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  "ai code generation",
  "presigned urls in one click",
  "multi-profile aws auth",
  "preview without download",
  "never stores your credentials",
] as const;

function StatusLine() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-char-600"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
        </span>
        v2.3.5 — shipping
      </span>
      <span aria-hidden className="text-char-400">/</span>
      <span>mac · windows · linux</span>
    </motion.div>
  );
}

function Title() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease }}
      className="mt-8 text-balance text-center font-display font-light leading-[0.94] text-ink text-[clamp(3rem,9vw,7.25rem)]"
    >
      <span className="block">A desktop client</span>
      <span className="block italic text-char-800">for Amazon&nbsp;S3,</span>
      <span className="block">
        built like a <span className="text-signal not-italic">terminal</span>.
      </span>
    </motion.h1>
  );
}

function Subhead() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease }}
      className="mt-8 max-w-2xl text-center text-[15px] leading-relaxed text-char-600"
    >
      Browse buckets, mint presigned URLs, and switch AWS profiles
      with the speed of a CLI and the clarity of a real GUI.
      Credentials stay on your machine — always.
    </motion.p>
  );
}

function PromptBox() {
  const posthog = usePostHog();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % FEATURES.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7, ease }}
      className="mt-10 w-full max-w-xl"
    >
      <div className="border border-ink bg-ink text-paper">
        {/* terminal title bar */}
        <div className="flex items-center justify-between border-b border-paper/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-paper/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-paper/30" />
            <span className="h-2 w-2 rounded-full bg-paper/30" />
            <span className="h-2 w-2 rounded-full bg-signal" />
          </span>
          <span>~/s3console</span>
          <span>shell</span>
        </div>

        {/* prompt body */}
        <div className="px-4 py-5 text-[13px] leading-7">
          <div>
            <span className="text-signal">$</span>{" "}
            <span className="text-paper/70">s3console</span>{" "}
            <span className="text-paper">--start</span>
          </div>
          <div className="mt-1 text-paper/60">
            → loading{" "}
            <span key={tick} className="type-in text-signal">
              {FEATURES[tick]}
            </span>
          </div>
          <div className="mt-1 text-paper/40">
            ✓ ready in 0.42s
          </div>
          <div className="mt-3">
            <span className="text-signal">$</span>{" "}
            <span className="caret" />
          </div>
        </div>

        {/* CTA bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-paper/15">
          <SignedOut>
            <Link
              href="/downloads"
              onClick={() => posthog?.capture("hero_download_clicked")}
              className="group flex items-center justify-between bg-signal px-5 py-4 text-paper hover:bg-paper hover:text-ink transition-colors"
            >
              <span className="text-[13px] uppercase tracking-[0.18em]">
                Download · 14-day trial
              </span>
              <span className="arrow-tick">→</span>
            </Link>
            <Link
              href="/pricing"
              className="group flex items-center justify-between border-t sm:border-t-0 sm:border-l border-paper/15 px-5 py-4 hover:bg-paper hover:text-ink transition-colors"
            >
              <span className="text-[13px] uppercase tracking-[0.18em] text-paper/80 group-hover:text-ink">
                See pricing
              </span>
              <span className="arrow-tick text-paper/60 group-hover:text-ink">→</span>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/downloads"
              onClick={() => posthog?.capture("hero_download_clicked")}
              className="group col-span-2 flex items-center justify-between bg-signal px-5 py-4 text-paper hover:bg-paper hover:text-ink transition-colors"
            >
              <span className="text-[13px] uppercase tracking-[0.18em]">
                Download S3Console
              </span>
              <span className="arrow-tick">→</span>
            </Link>
          </SignedIn>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-char-600">
        from $9/month  ·  no credit card to start  ·  14-day trial
      </p>
    </motion.div>
  );
}

function ScreenShot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.0, ease }}
      className="relative mx-auto mt-20 w-full max-w-screen-lg"
    >
      {/* corner brackets */}
      <span className="pointer-events-none absolute -top-2 -left-2 h-4 w-4 border-l-2 border-t-2 border-ink" />
      <span className="pointer-events-none absolute -top-2 -right-2 h-4 w-4 border-r-2 border-t-2 border-ink" />
      <span className="pointer-events-none absolute -bottom-2 -left-2 h-4 w-4 border-l-2 border-b-2 border-ink" />
      <span className="pointer-events-none absolute -bottom-2 -right-2 h-4 w-4 border-r-2 border-b-2 border-ink" />

      <div className="border border-ink bg-paper">
        <div className="flex items-center justify-between border-b border-ink px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-char-600">
          <span>● ● ●</span>
          <span>S3Console — production</span>
          <span>00:42:11</span>
        </div>
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/J5Dk-eize_0"
          thumbnailSrc="/dashboard.png"
          thumbnailAlt="S3Console — desktop S3 client"
          className="block"
        />
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden border-b border-ink">
      <div className="pointer-events-none absolute inset-0 grid-rule opacity-50" />
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-60" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 pb-24 sm:pt-20">
        <StatusLine />
        <Title />
        <Subhead />
        <PromptBox />
        <ScreenShot />
      </div>

      {/* hairline base rule with serial number */}
      <div className="relative border-t border-ink/20 bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-[10px] uppercase tracking-[0.22em] text-char-600">
          <span>● live</span>
          <span>serial — s3c/2.3.5/{new Date().getFullYear()}</span>
          <span>↓ scroll</span>
        </div>
      </div>
    </section>
  );
}
