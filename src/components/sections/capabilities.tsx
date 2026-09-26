"use client";

import Section from "@/components/section";
import { motion } from "framer-motion";
import {
  Check,
  Cloud,
  Code2,
  FolderOpen,
  KeyRound,
  Laptop,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

interface CapabilityGroup {
  name: string;
  outcome: string;
  icon: ReactNode;
  items: string[];
}

// What Buckets gives you, grouped by the job you're trying to get done.
// Keep every item consistent with docs/MARKETING_CLAIMS_AND_VALIDATION.md.
const groups: CapabilityGroup[] = [
  {
    name: "Files, fast",
    outcome: "Move, preview and share objects without leaving your desktop.",
    icon: <FolderOpen className="h-5 w-5" />,
    items: [
      "Drag-and-drop uploads and downloads",
      "Inline file preview",
      "Presigned URLs in one click",
      "Batch delete and empty bucket",
      "Storage class management",
    ],
  },
  {
    name: "Every account, one app",
    outcome: "Sign in the way your team already does and switch in a click.",
    icon: <KeyRound className="h-5 w-5" />,
    items: [
      "AWS SSO / IAM Identity Center",
      "In-app CLI login (aws login)",
      "Access keys and STS session tokens",
      "Multi-profile switching",
      "Automatic token refresh",
    ],
  },
  {
    name: "Built for developers",
    outcome: "Go from a click in the UI to working code or a CLI command.",
    icon: <Code2 className="h-5 w-5" />,
    items: [
      "Code generation for TypeScript, JavaScript and Python",
      "Run generated code in the app",
      "Generate and run AWS CLI commands",
      "IAM policy generator",
      "6 built-in bucket policy templates",
    ],
  },
  {
    name: "Access, under control",
    outcome: "See and change who can reach your data with confidence.",
    icon: <ShieldCheck className="h-5 w-5" />,
    items: [
      "Bucket policy editor, visual and JSON",
      "ACL management",
      "CORS configuration",
      "Public access block controls",
      "Versioning, encryption and Object Lock",
    ],
  },
  {
    name: "Delivery and cost",
    outcome: "Ship content and keep an eye on what storage costs you.",
    icon: <Cloud className="h-5 w-5" />,
    items: [
      "CloudFront distribution management",
      "Cache invalidation",
      "Storage cost estimates",
    ],
  },
  {
    name: "On your terms",
    outcome: "Runs locally on your machine. Your credentials stay with you.",
    icon: <Laptop className="h-5 w-5" />,
    items: [
      "macOS, Windows and Linux",
      "Monthly, yearly or lifetime license",
      "Free 14-day trial, no credit card",
    ],
  },
];

export default function Capabilities() {
  return (
    <Section
      id="capabilities"
      title="Everything included"
      subtitle="One app for the whole S3 workflow"
      description="Beyond the everyday essentials, Buckets covers access control, delivery and cost, so you can run S3 end to end without switching tools."
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, i) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="surface flex flex-col rounded-2xl p-7"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                {group.icon}
              </span>
              <h4 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                {group.name}
              </h4>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {group.outcome}
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
