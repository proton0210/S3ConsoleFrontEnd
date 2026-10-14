"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Bot,
  Check,
  CloudCog,
  Layers3,
  NotebookPen,
  PiggyBank,
  Rows3,
  ServerCog,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { ReactNode } from "react";

import { Bleed, Card } from "@/components/bento";
import { PRODUCT_SHOTS, ProductShot, type ProductShotName } from "@/components/product-shot";
import Section from "@/components/section";
import { EASE_OUT, useCalm } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Everything in this section ships in the release after v2.7.55. Change this
 * one label to the version number (e.g. "New in 2.8") when it is tagged; the
 * product tour reads it too.
 */
export const WHATS_NEW_LABEL = "Next release";

/** Small pill that marks next-release content. */
export function ReleaseBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary",
        className
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {WHATS_NEW_LABEL}
    </span>
  );
}

/** Fade the bottom of a tall shot into the card instead of hard-cropping it. */
const FADE = "[mask-image:linear-gradient(to_bottom,black_72%,transparent)]";

/**
 * Show one region of a screenshot (fractions of its width/height), e.g. just
 * the dialog of a full-window capture, so its UI stays legible in a card.
 */
function Crop({
  name,
  x,
  y,
  w,
  h,
  sizes,
}: {
  name: ProductShotName;
  x: number;
  y: number;
  w: number;
  h: number;
  sizes: string;
}) {
  const shot = PRODUCT_SHOTS[name];
  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: `${shot.w * w} / ${shot.h * h}` }}>
      <div
        className="absolute"
        style={{ width: `${100 / w}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }}
      >
        <ProductShot name={name} sizes={sizes} />
      </div>
    </div>
  );
}

/**
 * A tall shot anchored to the top and faded at the bottom.
 *
 * Phones: in normal flow at its natural height (capped), shrinking when the
 * equal-height swipe cards leave less room, so it never leaves a blank gap.
 * md and up: by default it fills whatever height the grid row leaves, so the
 * cards in one row line up; `natural` keeps its full natural size instead.
 */
function Fill({
  name,
  sizes,
  className,
  natural = false,
}: {
  name: ProductShotName;
  sizes: string;
  className?: string;
  natural?: boolean;
}) {
  return (
    <Bleed
      className={cn(
        "relative mx-auto max-h-[360px] min-h-0 w-full flex-[0_1_auto]",
        FADE,
        natural ? "md:max-h-none md:[mask-image:none]" : "md:max-h-none md:min-h-[280px] md:flex-1",
        className
      )}
    >
      <ProductShot name={name} sizes={sizes} className={cn(!natural && "md:absolute md:inset-x-0 md:top-0")} />
    </Bleed>
  );
}

/** Floating dialog frame, as the app shows it over the workspace. */
function Floating({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-[0_30px_80px_-24px_rgb(0_0_0/0.45)] ring-1 ring-black/10 dark:ring-white/10",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Two related screens: one framed at the back left, the other floating in
 * front, both sliding off the bottom of the card.
 */
function Pair({
  back,
  front,
  backClassName,
  frontClassName,
  className,
}: {
  back: ProductShotName;
  front: ProductShotName;
  backClassName: string;
  frontClassName: string;
  className?: string;
}) {
  const calm = useCalm();
  return (
    <div className={cn("relative -mb-7", className)}>
      <Bleed className={cn("absolute left-0 top-0 mb-0", backClassName)}>
        <ProductShot name={back} sizes="(max-width: 768px) 60vw, 300px" />
      </Bleed>
      <motion.div
        initial={calm ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.15, ease: EASE_OUT }}
        className={cn("absolute right-0", frontClassName)}
      >
        <Floating className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <ProductShot name={front} sizes="(max-width: 768px) 75vw, 400px" />
        </Floating>
      </motion.div>
    </div>
  );
}

/** Just the report dialog from the full-window capture, so its figures stay legible. */
function MoneyLeaksVisual() {
  return (
    <Bleed right>
      <Crop
        name="moneyleaks"
        x={0.195}
        y={0.115}
        w={0.61}
        h={0.745}
        sizes="(max-width: 768px) 170vw, 1150px"
      />
    </Bleed>
  );
}

const ALSO_NEW = [
  "CloudFront URLs for the selected object in the inspector, plus Copy CloudFront URL",
  "Money leaks exports to Markdown or CSV",
  "Auth Doctor copies a redacted report with secrets removed",
  "Uploads work with providers that reject newer SDK checksum headers, such as Backblaze B2",
  "Guided virtual drive setup that checks for rclone and a FUSE layer",
  "The desktop app's unused telemetry library is gone, and the build fails if one is added",
];

export default function WhatsNew() {
  return (
    <Section id="whats-new">
      <div className="mx-auto max-w-3xl space-y-4 pb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            What&apos;s new
          </p>
          <ReleaseBadge className="py-1" />
        </div>
        <h2 className="mx-auto mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl">
          Find hidden costs, bring in AI agents, move big data with care
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
          The next Buckets release is about the work around your files: what they cost, who and what
          can touch them, and getting large transfers done. Every screen is the real app running with
          sample data.
        </p>
      </div>

      {/* Phones: one swipeable row of equal-height cards instead of ten tall
          stacked ones, like the capabilities section. */}
      <p className="-mt-2 mb-3 text-center text-xs text-muted-foreground md:hidden" aria-hidden>
        Swipe to see all 10 →
      </p>
      <div
        role="region"
        aria-label="New in the next release"
        tabIndex={0}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "md:mx-0 md:mt-6 md:grid md:snap-none md:grid-cols-6 md:gap-5 md:overflow-visible md:px-0 md:pb-0",
          "[&>*]:w-[86%] [&>*]:shrink-0 [&>*]:snap-center md:[&>*]:w-auto"
        )}
      >
        <Card
          index={0}
          className="md:col-span-6"
          layout="split"
          splitClassName="md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          icon={<PiggyBank className="h-3.5 w-3.5" />}
          eyebrow="Money leaks report"
          title="Spot hidden S3 and CloudFront costs"
          body="A read-only scan with a hard request budget looks for noncurrent versions that never expire, incomplete multipart uploads, old Standard data with no transition rule, public egress and more. Savings are labelled as estimates, and billed Cost Explorer spend loads separately, only when you ask."
          note="Lifecycle fixes add one rule next to your existing ones, show the exact diff and need your confirmation. AWS connections only."
        >
          <MoneyLeaksVisual />
        </Card>

        <Card
          index={1}
          className="md:col-span-4"
          layout="split"
          splitClassName="md:grid-cols-2"
          icon={<Bot className="h-3.5 w-3.5" />}
          eyebrow="AI agent access (MCP)"
          title="Let AI agents work in S3, with you approving"
          body="A local MCP server for Claude Code, Claude Desktop, Cursor and other MCP clients. Agents never receive AWS credentials, only use the profiles you choose, read-only or read-write, and every write or delete waits for your approval in the app."
          note="Off by default, with optional bucket allowlists and a local log of every call. Agents can upload text objects up to 1 MiB; there is no Athena or S3 Tables tool."
        >
          <Fill name="mcp-approval" natural sizes="(max-width: 768px) 86vw, 360px" className="max-w-[360px]" />
        </Card>
        <Card
          index={2}
          className="md:col-span-2"
          icon={<NotebookPen className="h-3.5 w-3.5" />}
          eyebrow="S3 Annotations"
          title="Annotate objects from the inspector"
          body="List, view, add, edit and delete Amazon S3 Annotations, as JSON or text up to 1 MiB each. Writes are guarded by the object's ETag and need confirmation."
          note="Query annotations in Athena opens a query against the S3 Metadata annotation table, which you enable in Bucket settings. AWS connections only."
        >
          <Fill name="annotations" sizes="(max-width: 768px) 90vw, 340px" className="max-w-[340px]" />
        </Card>

        <Card
          index={3}
          className="md:col-span-3"
          icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
          eyebrow="Transfers"
          title="Every transfer in one panel, ready to resume"
          body="Uploads, downloads, folder moves and Glacier restores in one place, with pause, resume and retry where they apply. Folder and ZIP downloads resume after a crash or network loss without fetching verified objects again."
          note="Renaming or moving a folder shows the object count, estimated request cost and warnings first, then copies, verifies and deletes object by object. It never overwrites a different object."
        >
          <Pair
            back="transfers"
            front="foldermove"
            className="h-[300px] sm:h-[360px]"
            backClassName="w-[52%] sm:w-[44%]"
            frontClassName="top-12 w-[72%] sm:top-10 sm:w-[64%]"
          />
        </Card>
        <Card
          index={4}
          className="md:col-span-3"
          icon={<CloudCog className="h-3.5 w-3.5" />}
          eyebrow="CloudFront"
          title="Choose a plan and fix 403s with a preview"
          body="The flat-rate plan advisor compares a distribution's last 30 days of traffic with the Free, Pro, Business and Premium allowances and an estimated pay-as-you-go bill. S3 site doctor finds common causes of 403s and wrong pages and previews each fix."
          note="AWS has no API that reports a distribution's current plan, so the advisor compares allowances only. AWS connections only."
        >
          <Pair
            back="planadvisor"
            front="sitedoctor"
            className="h-[300px] sm:h-[360px]"
            backClassName="w-[64%] sm:w-[56%]"
            frontClassName="top-14 w-[72%] sm:top-12 sm:w-[60%]"
          />
        </Card>

        <Card
          index={5}
          className="md:col-span-2"
          icon={<Rows3 className="h-3.5 w-3.5" />}
          eyebrow="Big buckets"
          title="Huge folders, one continuous list"
          body="Large folders scroll as one list that loads more as you go. In-bucket search answers from a fresh Local Index with 0 LIST requests, and a badge always names the source and the requests used."
          note="The Local Index is AWS-only and you choose when to set it up."
        >
          <Fill name="searchbadge" sizes="(max-width: 768px) 90vw, 300px" className="max-w-[300px]" />
        </Card>
        <Card
          index={6}
          className="md:col-span-2"
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          eyebrow="Auth Doctor"
          title="Know why sign-in fails"
          body="Checks credential source, expiry, STS identity, clock skew, the SSO token cache, TLS and proxies for any profile, with a suggested fix for each finding. HTTPS_PROXY, NO_PROXY and AWS_CA_BUNDLE are now honoured."
          note="System proxy settings and PAC files are not read."
        >
          <Fill name="authdoctor" sizes="(max-width: 768px) 90vw, 360px" />
        </Card>
        <Card
          index={7}
          className="md:col-span-2"
          icon={<ServerCog className="h-3.5 w-3.5" />}
          eyebrow="S3-compatible storage"
          title="Presets for 19 providers"
          body="Cloudflare R2, Backblaze B2, Wasabi, Hetzner, MinIO, Ceph RGW and more, hosted and self-hosted. Each preset shows which S3 features the provider documents, with sources, and hides unsupported ones instead of letting them fail."
          note="Untested features stay available. Nightly compatibility tests cover MinIO, Garage and SeaweedFS."
        >
          <Fill name="compatible-matrix" sizes="(max-width: 768px) 90vw, 360px" />
        </Card>

        <Card
          index={8}
          className="md:col-span-4"
          layout="split"
          splitClassName="md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
          icon={<Layers3 className="h-3.5 w-3.5" />}
          eyebrow="Essentials"
          title="Start with just the tools you use"
          body="New installs ask what you use S3 for and show only those workspaces and tools. Ctrl K (⌘K on Mac) still finds everything, and Show everything brings back the full interface."
          note="Existing installs keep the full interface and never see the picker."
        >
          <Bleed right>
            <ProductShot name="essentials" sizes="(max-width: 768px) 86vw, 480px" />
          </Bleed>
        </Card>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
          className="surface flex flex-col rounded-2xl p-7 md:col-span-2"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <Check className="h-3.5 w-3.5" />
            Also new
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">And a few smaller things</h3>
          <ul className="mt-5 space-y-3 border-t border-border pt-5">
            {ALSO_NEW.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
        Captured from the next-release build with sample data. Details may change before it ships.
      </p>
    </Section>
  );
}
