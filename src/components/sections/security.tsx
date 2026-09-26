"use client";

import Section from "@/components/section";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Laptop, ShieldCheck, UserCheck } from "lucide-react";
import Link from "next/link";

const POINTS = [
  {
    icon: Laptop,
    title: "Runs on your machine",
    body: "Buckets is a desktop app. Your credentials are stored locally, not on our servers.",
  },
  {
    icon: ShieldCheck,
    title: "Straight to AWS",
    body: "Every S3 request goes directly from your computer to AWS. Your files never pass through us.",
  },
  {
    icon: KeyRound,
    title: "Short-lived credentials",
    body: "Use AWS SSO and IAM Identity Center sessions instead of long-lived access keys.",
  },
  {
    icon: UserCheck,
    title: "Your permissions, respected",
    body: "Buckets can only do what your IAM identity is allowed to do. Nothing more.",
  },
];

export default function Security() {
  return (
    <Section id="security">
      <div className="surface relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/15 blur-[120px]"
        />
        <div className="relative grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Security
            </p>
            <h3 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Your data stays between you and AWS
            </h3>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Buckets was designed local-first, so adopting it doesn&apos;t mean
              handing your keys or your files to another service.
            </p>
            <Link
              href="/trust"
              className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              Visit the Trust Center
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {POINTS.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-background/50 p-6"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h4 className="mt-4 font-semibold text-foreground">{title}</h4>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
