"use client";

import HeroShowcase from "@/components/magicui/hero-showcase";
import Section from "@/components/section";

/** Real screen recordings of Buckets, shown as a carousel. */
export default function Demo() {
  return (
    <Section
      id="demo"
      title="See it in action"
      subtitle="Watch Buckets work"
      description="Short recordings of real workflows, straight from the app."
    >
      <div className="relative mx-auto mt-4 max-w-5xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-primary/10 blur-[100px] dark:bg-primary/15"
        />
        <div className="surface shadow-frame rounded-2xl p-3 sm:p-5">
          <HeroShowcase />
        </div>
      </div>
    </Section>
  );
}
