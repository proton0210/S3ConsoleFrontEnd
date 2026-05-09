import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function CtaSection() {
  return (
    <section id="cta" className="relative border-y border-ink bg-ink text-paper">
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-20 invert" />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* serial header */}
        <div className="flex items-center justify-between border-b border-paper/20 pb-4 text-[10px] uppercase tracking-[0.22em] text-paper/60">
          <span>§04 — install</span>
          <span>$ s3console --get</span>
          <span>● ready</span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="font-display text-5xl font-light leading-[1.02] sm:text-6xl">
              Stop fighting the AWS console.
              <br />
              <span className="italic text-signal">Start shipping.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[14px] leading-relaxed text-paper/70">
              Fourteen days. Every feature. No card. If S3Console doesn&apos;t
              earn its place in your toolkit, walk away — no harm done.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-5">
            <SignedOut>
              <Link
                href="/downloads"
                className="group flex items-center justify-between border border-signal bg-signal px-6 py-5 text-paper transition-colors hover:bg-paper hover:text-ink hover:border-paper"
              >
                <span className="text-[13px] uppercase tracking-[0.2em]">
                  Download — start trial
                </span>
                <span className="arrow-tick">→</span>
              </Link>
              <Link
                href="/pricing"
                className="group flex items-center justify-between border border-paper/30 px-6 py-5 transition-colors hover:border-paper hover:bg-paper/5"
              >
                <span className="text-[13px] uppercase tracking-[0.2em] text-paper/80 group-hover:text-paper">
                  See pricing
                </span>
                <span className="arrow-tick text-paper/60 group-hover:text-paper">→</span>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/downloads"
                className="group flex items-center justify-between border border-signal bg-signal px-6 py-5 text-paper transition-colors hover:bg-paper hover:text-ink hover:border-paper"
              >
                <span className="text-[13px] uppercase tracking-[0.2em]">
                  Download S3Console
                </span>
                <span className="arrow-tick">→</span>
              </Link>
              <Link
                href="/pricing"
                className="group flex items-center justify-between border border-paper/30 px-6 py-5 transition-colors hover:border-paper hover:bg-paper/5"
              >
                <span className="text-[13px] uppercase tracking-[0.2em] text-paper/80 group-hover:text-paper">
                  See pricing
                </span>
                <span className="arrow-tick text-paper/60 group-hover:text-paper">→</span>
              </Link>
            </SignedIn>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.22em] text-paper/50">
              ✓ no credit card  ·  ✓ cancel anytime  ·  ✓ data stays local
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
