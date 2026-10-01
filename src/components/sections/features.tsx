"use client";

import Section from "@/components/section";
import { ProductShot } from "@/components/product-shot";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useCalm } from "@/lib/motion";
import { CheckCircle2, Code2, Command, Globe, KeyRound, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
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
        {"\n"}  Bucket: <span className="text-emerald-700 dark:text-emerald-400">&quot;northstar-prod-media&quot;</span>,
        {"\n"}  Key: <span className="text-emerald-700 dark:text-emerald-400">&quot;q3-revenue-summary.pdf&quot;</span>,
        {"\n"}{"}"}));
      </code>
    </pre>
  );
}

const URL_HOST = "https://cdn.example.com/";
const URL_FILE = "launch-film-4k.mp4";
const URL_TEXT = URL_HOST + URL_FILE;
const TICKS = 160; // 60ms each

/**
 * Illustration of Upload from URL: the link types itself in, Buckets
 * downloads it to a temporary local file, then uploads it to S3. Loops
 * while on screen; shows the finished state when motion is reduced.
 */
function UrlUploadDemo() {
  const calm = useCalm();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (calm || !inView) return;
    const id = setInterval(() => setTick((n) => (n >= TICKS ? 0 : n + 1)), 60);
    return () => clearInterval(id);
  }, [calm, inView]);

  // Reduced motion shows the finished state (after hydration, so SSR matches).
  const t = calm ? TICKS - 12 : tick;

  const typed = URL_TEXT.slice(0, Math.min(URL_TEXT.length, t));
  const start = URL_TEXT.length + 4;
  const progress = Math.max(0, Math.min(100, ((t - start) / 70) * 100));
  const done = progress >= 100;
  const status = done
    ? "Uploaded to S3"
    : progress >= 55
      ? "Uploading to S3…"
      : progress > 0
        ? "Downloading to a temp file…"
        : "Paste a URL";
  // Fade out briefly before the loop restarts instead of snapping to empty.
  const fading = t >= TICKS - 4;

  return (
    <div ref={ref}>
      <p className="sr-only">
        Illustration: a URL is pasted, downloaded to a temporary file, then uploaded to the
        bucket as launch-film-4k.mp4.
      </p>
      <div
        aria-hidden
        className={cn(
          "space-y-3 rounded-xl border border-border bg-background/70 p-4 font-mono text-[12px] transition-opacity duration-200",
          fading ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {/* Keep the end of the URL visible so the file name lands on screen. */}
          <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left [direction:rtl]">
            <bdi>
              {typed.replace("https://", "")}
              {!done && <span className="ml-px inline-block h-3.5 w-[2px] translate-y-0.5 animate-blink bg-primary" />}
            </bdi>
          </span>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{status}</span>
            <span className="tabular-nums">{(1.84 * (progress / 100)).toFixed(2)} / 1.84 GB</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))]"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-emerald-700 transition-all duration-300 dark:text-emerald-400",
            done ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="truncate">s3://northstar-prod-media/{URL_FILE}</span>
        </div>
      </div>
    </div>
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
          body="Sign in with IAM Identity Center (AWS SSO), your CLI profiles or access keys. Keep each account in its own tab, switch in a click, and search across saved accounts in one reviewed scan."
        >
          <Bleed className="mx-auto h-[330px] w-full max-w-[240px] [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
            <ProductShot name="profiles" sizes="240px" />
          </Bleed>
        </Card>
        <Card
          index={1}
          className="md:col-span-2"
          icon={<Link2 className="h-3.5 w-3.5" />}
          eyebrow="Upload from URL"
          title="Paste a link, get an object"
          body="Buckets downloads the URL to a temporary local file, then uploads it to S3. Downloads resume when the source supports range requests."
        >
          <UrlUploadDemo />
        </Card>
        <Card
          index={2}
          className="md:col-span-2"
          icon={<Command className="h-3.5 w-3.5" />}
          eyebrow="Command palette"
          title="Every action, one keystroke"
          body="Press Ctrl K (⌘K on Mac) to jump to a bucket, copy an ARN or edit a policy without hunting through menus."
        >
          <Bleed right>
            <ProductShot name="palette" sizes="(max-width: 768px) 90vw, 400px" />
          </Bleed>
        </Card>
        <Card
          index={3}
          className="md:col-span-2"
          icon={<Share2 className="h-3.5 w-3.5" />}
          eyebrow="Sharing"
          title="Share a file in seconds"
          body="Copy an object's S3 URI, HTTPS URL or ARN, or create a presigned link that lasts 1 minute to 7 days. Links signed with SSO or other temporary credentials stop working when that session ends."
        >
          <Bleed className="mx-auto h-[260px] w-full max-w-[340px] [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
            <ProductShot name="inspector" sizes="340px" />
          </Bleed>
        </Card>
        <Card
          index={4}
          className="md:col-span-2"
          icon={<Code2 className="h-3.5 w-3.5" />}
          eyebrow="Developer tools"
          title="From click to code"
          body="Turn an action into ready-to-edit TypeScript, JavaScript or Python, or generate and run the matching AWS CLI command."
        >
          <CodeSnippet />
        </Card>
      </div>
    </Section>
  );
}
