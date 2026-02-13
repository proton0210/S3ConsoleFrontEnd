"use client";

import Section from "@/components/section";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue =
  | true // full support
  | false // no support
  | string; // partial / note

interface ComparisonFeature {
  feature: string;
  s3console: CellValue;
  cyberduck: CellValue;
  transmit: CellValue;
  cloudberry: CellValue;
  s3browser: CellValue;
  filezilla: CellValue;
  awsConsole: CellValue;
}

const competitors = [
  { key: "s3console", name: "S3Console", highlight: true },
  { key: "awsConsole", name: "AWS Console" },
  { key: "cyberduck", name: "Cyberduck" },
  { key: "transmit", name: "Transmit 5" },
  { key: "cloudberry", name: "CloudBerry" },
  { key: "s3browser", name: "S3 Browser" },
  { key: "filezilla", name: "FileZilla Pro" },
] as const;

const categories: { name: string; features: ComparisonFeature[] }[] = [
  {
    name: "Developer Tools",
    features: [
      {
        feature: "Code Generation (TS/JS/Python)",
        s3console: true,
        awsConsole: false,
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "In-App Code Execution",
        s3console: true,
        awsConsole: false,
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "AWS CLI Generation & Execution",
        s3console: true,
        awsConsole: false,
        cyberduck: false,
        transmit: false,
        cloudberry: "CLI only",
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "Bucket Policy Templates",
        s3console: "6 built-in",
        awsConsole: "Manual JSON",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "IAM Policy Generator",
        s3console: true,
        awsConsole: "Separate service",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
    ],
  },
  {
    name: "Authentication",
    features: [
      {
        feature: "AWS SSO / IAM Identity Center",
        s3console: true,
        awsConsole: true,
        cyberduck: "Via CLI",
        transmit: false,
        cloudberry: false,
        s3browser: true,
        filezilla: true,
      },
      {
        feature: "CLI Login (aws login) — In-App",
        s3console: true,
        awsConsole: "N/A",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "Access Key + Secret",
        s3console: true,
        awsConsole: false,
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: true,
        filezilla: true,
      },
      {
        feature: "STS / Session Tokens",
        s3console: true,
        awsConsole: true,
        cyberduck: true,
        transmit: false,
        cloudberry: true,
        s3browser: true,
        filezilla: false,
      },
      {
        feature: "Multi-Profile Switching",
        s3console: true,
        awsConsole: "Tab juggling",
        cyberduck: "Bookmarks",
        transmit: "Favorites",
        cloudberry: true,
        s3browser: true,
        filezilla: "Site Manager",
      },
      {
        feature: "Auto Token Refresh",
        s3console: true,
        awsConsole: true,
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
    ],
  },
  {
    name: "Cloud & CDN",
    features: [
      {
        feature: "CloudFront Management",
        s3console: true,
        awsConsole: "Separate service",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: "View only",
        filezilla: false,
      },
      {
        feature: "Cache Invalidation",
        s3console: true,
        awsConsole: "Separate service",
        cyberduck: "CDN only",
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "Real-Time Cost Estimation",
        s3console: true,
        awsConsole: "Separate billing",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
    ],
  },
  {
    name: "File Operations",
    features: [
      {
        feature: "Drag & Drop Upload",
        s3console: true,
        awsConsole: true,
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: true,
        filezilla: true,
      },
      {
        feature: "Presigned URL Generation",
        s3console: "2 clicks",
        awsConsole: "8+ steps",
        cyberduck: true,
        transmit: false,
        cloudberry: "Pro only",
        s3browser: true,
        filezilla: false,
      },
      {
        feature: "Inline File Preview",
        s3console: true,
        awsConsole: "Limited",
        cyberduck: "Quick Look",
        transmit: true,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "Batch Delete / Empty Bucket",
        s3console: true,
        awsConsole: "Limited",
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: "Pro only",
        filezilla: true,
      },
      {
        feature: "Storage Class Management",
        s3console: true,
        awsConsole: true,
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: "Pro only",
        filezilla: true,
      },
    ],
  },
  {
    name: "Access Control",
    features: [
      {
        feature: "ACL Management",
        s3console: true,
        awsConsole: true,
        cyberduck: true,
        transmit: true,
        cloudberry: "Pro only",
        s3browser: "Pro only",
        filezilla: false,
      },
      {
        feature: "Bucket Policy Editor",
        s3console: "Visual + JSON",
        awsConsole: "JSON only",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
      {
        feature: "CORS Configuration",
        s3console: true,
        awsConsole: true,
        cyberduck: true,
        transmit: false,
        cloudberry: false,
        s3browser: true,
        filezilla: false,
      },
      {
        feature: "Public Access Block Control",
        s3console: true,
        awsConsole: true,
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: false,
      },
    ],
  },
  {
    name: "Platform & Pricing",
    features: [
      {
        feature: "macOS",
        s3console: true,
        awsConsole: "Browser",
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: false,
        filezilla: true,
      },
      {
        feature: "Windows",
        s3console: true,
        awsConsole: "Browser",
        cyberduck: true,
        transmit: false,
        cloudberry: true,
        s3browser: true,
        filezilla: true,
      },
      {
        feature: "Linux",
        s3console: "Coming soon",
        awsConsole: "Browser",
        cyberduck: false,
        transmit: false,
        cloudberry: false,
        s3browser: false,
        filezilla: true,
      },
      {
        feature: "Pricing",
        s3console: "$99 lifetime",
        awsConsole: "Free (with AWS)",
        cyberduck: "Free / donate",
        transmit: "$45 one-time",
        cloudberry: "$59.99 Pro",
        s3browser: "$49.99 Pro",
        filezilla: "~$14/yr",
      },
      {
        feature: "One-Time Payment (No Subscription)",
        s3console: true,
        awsConsole: "N/A",
        cyberduck: true,
        transmit: true,
        cloudberry: true,
        s3browser: true,
        filezilla: false,
      },
    ],
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
        <X className="w-4 h-4 text-red-500 dark:text-red-400" />
      </span>
    );
  }
  return (
    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
      {value}
    </span>
  );
}

export default function Comparison() {
  return (
    <Section
      title="Comparison"
      subtitle="S3Console vs. Everything Else"
      description="The only S3 desktop client with code generation, in-app execution, and native AWS Identity Center support."
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: "spring", stiffness: 80, damping: 30 }}
        className="mt-10 overflow-x-auto -mx-4 px-4"
      >
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-left">
            {/* Header */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background px-4 py-3 text-sm font-semibold text-foreground w-[200px] min-w-[200px]">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-3 py-3 text-center text-xs sm:text-sm font-semibold min-w-[110px]",
                      c.highlight
                        ? "bg-primary/5 text-primary border-b-2 border-primary rounded-t-lg"
                        : "text-muted-foreground"
                    )}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, catIdx) => (
                <>
                  {/* Category header */}
                  <tr key={`cat-${catIdx}`}>
                    <td
                      colSpan={competitors.length + 1}
                      className="px-4 pt-6 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 border-b border-border"
                    >
                      {cat.name}
                    </td>
                  </tr>
                  {/* Feature rows */}
                  {cat.features.map((row, rowIdx) => (
                    <tr
                      key={`${catIdx}-${rowIdx}`}
                      className={cn(
                        "border-b border-border/50 transition-colors hover:bg-muted/30",
                        rowIdx % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium text-foreground">
                        {row.feature}
                      </td>
                      {competitors.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "px-3 py-3 text-center",
                            c.highlight && "bg-primary/[0.02]"
                          )}
                        >
                          <CellContent
                            value={row[c.key as keyof ComparisonFeature] as CellValue}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="rounded-xl border border-border bg-background p-5 text-center">
            <p className="text-3xl font-bold text-primary">6</p>
            <p className="text-sm text-muted-foreground mt-1">
              Exclusive features no competitor has
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5 text-center">
            <p className="text-3xl font-bold text-primary">$99</p>
            <p className="text-sm text-muted-foreground mt-1">
              One-time payment, yours forever
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5 text-center">
            <p className="text-3xl font-bold text-primary">2</p>
            <p className="text-sm text-muted-foreground mt-1">
              Platforms — macOS & Windows native
            </p>
          </div>
        </motion.div>
      </motion.div>
    </Section>
  );
}
