"use client";

import Section from "@/components/section";
import { ProductShot } from "@/components/product-shot";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Code2, Eye, History, Inbox, KeyRound, Link2, Search } from "lucide-react";
import type { ReactNode } from "react";

function Card({
  className,
  icon,
  eyebrow,
  title,
  body,
  children,
  index,
  layout = "stack",
}: {
  className?: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
  index: number;
  layout?: "stack" | "split";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "surface group relative flex flex-col overflow-hidden rounded-2xl p-7 transition-colors duration-300 hover:border-primary/30",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <div
        className={cn(
          "flex flex-1 flex-col",
          layout === "split" && "gap-8 md:grid md:grid-cols-2 md:items-end"
        )}
      >
        <div className={cn(layout === "split" && "md:self-center")}>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {icon}
            {eyebrow}
          </div>
          <h4 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h4>
          <p className="mt-2 max-w-md text-[15px] leading-7 text-muted-foreground">{body}</p>
        </div>
        {children && (
          <div className={cn("relative", layout === "split" ? "" : "mt-6 flex flex-1 flex-col justify-end")}>
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * A real app screenshot that slides off the bottom (and optionally right)
 * edge of its card, framed like a window peeking out of the surface.
 */
function Bleed({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mb-7 overflow-hidden border border-b-0 border-border bg-card shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.25)] transition-transform duration-500 ease-out group-hover:-translate-y-1",
        right ? "-mr-7 rounded-tl-xl border-r-0" : "rounded-t-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function CodeSnippet() {
  return (
    <pre className="overflow-hidden rounded-xl border border-border bg-background/60 p-4 font-mono text-[12.5px] leading-6 text-muted-foreground">
      <code>
        <span className="text-primary">await</span> s3.
        <span className="text-foreground">send</span>(
        <span className="text-primary">new</span>{" "}
        <span className="text-foreground">GetObjectCommand</span>({"{"}
        {"\n"}  Bucket: <span className="text-emerald-600 dark:text-emerald-400">&quot;acme-prod-assets&quot;</span>,
        {"\n"}  Key: <span className="text-emerald-600 dark:text-emerald-400">&quot;reports/q3-revenue-summary.pdf&quot;</span>,
        {"\n"}{"}"}));
      </code>
    </pre>
  );
}

export default function Features() {
  return (
    <Section
      title="Features"
      subtitle="The S3 work you do every day, made effortless"
      description="Buckets is built around the tasks engineers repeat every week, so the common path is always one click away."
    >
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-6">
        <Card
          index={0}
          className="md:col-span-4"
          layout="split"
          icon={<KeyRound className="h-3.5 w-3.5" />}
          eyebrow="Multi-account"
          title="Every AWS account, one click away"
          body="Sign in with AWS SSO and IAM Identity Center or your existing CLI profiles. Save every account you work with and switch between them instantly, with tokens refreshed for you."
        >
          <Bleed className="mx-auto h-[300px] w-full max-w-[250px] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
            <ProductShot name="profiles" sizes="250px" />
          </Bleed>
        </Card>
        <Card
          index={1}
          className="md:col-span-2"
          icon={<Inbox className="h-3.5 w-3.5" />}
          eyebrow="Drop Zones"
          title="Collect files from anyone"
          body="Share an upload page with clients and vendors. Their files land straight in your bucket, no AWS account needed."
        >
          <Bleed right>
            <ProductShot name="dropzones" sizes="400px" />
          </Bleed>
        </Card>
        <Card
          index={2}
          className="md:col-span-2"
          icon={<Link2 className="h-3.5 w-3.5" />}
          eyebrow="Upload from URL"
          title="Paste a link, get an object"
          body="Point Buckets at any URL and it downloads and uploads to S3 for you, with resumable transfers."
        />
        <Card
          index={3}
          className="md:col-span-2"
          icon={<Search className="h-3.5 w-3.5" />}
          eyebrow="Search"
          title="Find anything, in any bucket"
          body="Search objects across all your buckets at once from a single search bar."
        />
        <Card
          index={4}
          className="md:col-span-2"
          icon={<Eye className="h-3.5 w-3.5" />}
          eyebrow="Preview"
          title="Look before you download"
          body="Preview images, JSON, XML, Markdown and code right inside the app."
        />
        <Card
          index={5}
          className="md:col-span-3"
          icon={<Link2 className="h-3.5 w-3.5" />}
          eyebrow="Sharing"
          title="Share a file in seconds"
          body="Copy an object's S3 URI, HTTPS URL or ARN, or generate a presigned link that expires anywhere from 1 minute to 7 days."
        >
          <Bleed className="mx-auto w-full max-w-[380px]">
            <ProductShot name="inspector" sizes="380px" />
          </Bleed>
        </Card>
        <Card
          index={6}
          className="md:col-span-3"
          icon={<Code2 className="h-3.5 w-3.5" />}
          eyebrow="Developer tools"
          title="From click to code"
          body="Turn any action into ready-to-edit TypeScript, JavaScript or Python, or generate and run the matching AWS CLI command."
        >
          <CodeSnippet />
        </Card>
        <Card
          index={7}
          className="md:col-span-6"
          layout="split"
          icon={<History className="h-3.5 w-3.5" />}
          eyebrow="Time Travel"
          title="Roll a bucket back to how it was"
          body="Pick a moment, review exactly what will change, then restore a prefix to its earlier state using your bucket's retained versions."
        >
          <Bleed right>
            <ProductShot name="timetravel" sizes="600px" />
          </Bleed>
        </Card>
      </div>
    </Section>
  );
}
