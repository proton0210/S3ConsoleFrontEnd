"use client";

import Section from "@/components/section";
import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Download Buckets",
    body: "Install the app for macOS, Windows or Linux. Your 14-day trial starts with every feature unlocked.",
  },
  {
    n: "02",
    title: "Connect your accounts",
    body: "Pick an existing AWS CLI profile or sign in with IAM Identity Center. Add as many profiles as you work with.",
  },
  {
    n: "03",
    title: "Get to work",
    body: "Browse, transfer, share and secure your buckets. What you can do follows your own AWS permissions.",
  },
];

export default function Workflow() {
  return (
    <Section
      id="how-it-works"
      title="How it works"
      subtitle="Up and running in minutes"
    >
      <div className="relative mt-6 grid gap-5 md:grid-cols-3">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
        />
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative h-full"
          >
            <div className="surface relative h-full rounded-2xl p-7">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-mono text-sm font-semibold text-primary">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
