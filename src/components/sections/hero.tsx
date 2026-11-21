"use client";

import {
  AnimatePresence,
  easeInOut,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import Link from "next/link";
import { ArrowRight, Check, Link2, Lock, MonitorSmartphone, Sparkles, X, Zap } from "lucide-react";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";

import { WatchFilmButton } from "@/components/film";
import { BorderBeam } from "@/components/magicui/border-beam";
import { PRODUCT_SHOTS, ProductShot } from "@/components/product-shot";
import { buttonVariants } from "@/components/ui/button";
import { EASE_OUT, SPRING, useCalm } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { siteConfig } from "@/lib/config";

/* ------------------------------------------------------------------ */
/* First screen. A visitor decides in about five seconds, so this      */
/* holds one claim, one line of support, one picture and one button.   */
/* Nothing here waits on a timed animation.                            */
/*                                                                     */
/* Copy rules (docs/MARKETING_CLAIMS_AND_VALIDATION.md): no "one       */
/* click" for restores (Time Travel has a review step), no hours-saved */
/* or ROI numbers, and no other S3 client is named.                    */
/* ------------------------------------------------------------------ */
type HeroVariant = "script" | "console" | "outcomes";

// The accent is the only coloured text in the hero, so the download button
// stays the strongest thing on the screen. It must end the last line.
const HEADLINES: Record<HeroVariant, { lines: string[]; accent: string }> = {
  // Default.
  script: { lines: ["Do in a few clicks", "what S3 makes you script."], accent: "script." },
  console: { lines: ["The S3 console", "you wish you had."], accent: "you wish you had." },
  outcomes: { lines: ["Roll back S3 mistakes. Find any object.", "Across every account."], accent: "every account." },
};

// Set NEXT_PUBLIC_HERO_VARIANT to try another headline. It is read at build
// time, so each variant is a separate deploy; the value is sent with the
// download event so results can be compared.
const HERO_VARIANT: HeroVariant = (() => {
  const v = process.env.NEXT_PUBLIC_HERO_VARIANT;
  return v === "console" || v === "outcomes" ? v : "script";
})();

const priceOf = (tier: string) => siteConfig.pricing.find((p) => p.tier === tier)?.price;

function HeroEyebrow() {
  return (
    <p
      className="hero-rise inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-sm font-medium text-muted-foreground lg:justify-start"
      style={{ animationDelay: "0ms" }}
    >
      <span className="font-semibold text-foreground">Buckets</span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
      <span>The desktop app for Amazon S3</span>
      <span aria-hidden className="inline-flex items-center gap-1.5 pl-0.5">
        <FaApple className="h-4 w-4" />
        <FaWindows className="h-3.5 w-3.5" />
        <FaLinux className="h-4 w-4" />
      </span>
      <span className="sr-only">for macOS, Windows and Linux</span>
    </p>
  );
}

function HeroTitles() {
  const { lines, accent } = HEADLINES[HERO_VARIANT];
  return (
    <>
      {/* Entrance uses CSS (see .hero-rise) so the headline paints before hydration.
          Sizes are set so the default headline stays on two lines from 640px up. */}
      <h1 className="mt-5 text-balance text-[2.25rem] font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[2.5rem] xl:text-[3.25rem]">
        {lines.map((line, i) => {
          const last = i === lines.length - 1;
          const plain = last && line.endsWith(accent) ? line.slice(0, -accent.length) : line;
          return (
            <span key={line} className="hero-rise block" style={{ animationDelay: `${60 + i * 80}ms` }}>
              <span className="text-gradient">{plain}</span>
              {plain !== line && <span className="text-gradient-brand">{accent}</span>}
            </span>
          );
        })}
      </h1>
      <p
        className="hero-rise mt-5 max-w-xl text-pretty text-lg leading-8 text-muted-foreground"
        style={{ animationDelay: "300ms" }}
      >
        Restore, search and cost checks for S3, without the scripts.
      </p>
    </>
  );
}

function HeroCTA() {
  const yearly = priceOf("yearly");
  const lifetime = priceOf("lifetime");
  const facts = [
    { icon: Lock, text: "Credentials stay on your machine" },
    ...(yearly && lifetime ? [{ icon: Zap, text: `${yearly} a year or ${lifetime} once` }] : []),
    { icon: Check, text: "14-day full trial, no card" },
  ];
  return (
    <div className="hero-rise mt-8 flex flex-col items-center gap-6 lg:items-start" style={{ animationDelay: "400ms" }}>
      <div className="flex w-full flex-col items-center gap-x-5 gap-y-3 sm:w-auto sm:flex-row">
        <Link
          href="/downloads"
          onClick={() => sendGAEvent("event", "hero_download_clicked", { hero_variant: HERO_VARIANT })}
          className={cn(
            buttonVariants({ size: "lg" }),
            "group relative h-12 w-full overflow-hidden rounded-full px-7 text-base font-semibold transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto",
            "shadow-[0_0_0_1px_hsl(var(--primary)/0.5),0_12px_40px_-10px_hsl(var(--primary)/0.7)]"
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-shine-once bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shine"
          />
          Download free trial
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        {/* The film is the second choice, so it reads as a link, not a button. */}
        <WatchFilmButton className="h-10 w-auto gap-2.5 border-0 bg-transparent pl-0 pr-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground" />
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* The by-hand version of a point-in-time restore. Kept honest: this is a
   workable start, and the comment lists what it still leaves out. */
const SCRIPT: { text: string; tone?: "comment" }[] = [
  { text: "# roll media/ back to 30 Sep, 2 pm", tone: "comment" },
  { text: 'T="2026-09-30T14:00:00Z"' },
  { text: 'aws s3api list-object-versions --bucket "$B" \\' },
  { text: '  --prefix media/ --output text --query \\' },
  { text: '  "Versions[?LastModified<=\'$T\'].[Key,VersionId,LastModified]" \\' },
  { text: "  | sort -k1,1 -k3,3r | awk '!seen[$1]++' \\" },
  { text: "  | while read -r key vid _; do" },
  { text: '      aws s3api copy-object --bucket "$B" --key "$key" \\' },
  { text: '        --copy-source "$B/$key?versionId=$vid"' },
  { text: "    done" },
  { text: "# todo: delete markers, keys created after $T,", tone: "comment" },
  { text: "# pagination, keys with spaces, a dry run…", tone: "comment" },
];

/* Regions of the Time Travel shot, in source pixels (2048 x 1664). The whole
   dialog is unreadable at hero size, so each step shows only the part that
   matters, about half size. */
const STEPS = [
  { label: "Pick a time", x: 41, y: 261, w: 1085, h: 123 },
  { label: "See what changed", x: 41, y: 450, w: 1085, h: 154 },
  { label: "Restore", x: 940, y: 1562, w: 1085, h: 102 },
] as const;

function Crop({ x, y, w, h, priority }: { x: number; y: number; w: number; h: number; priority?: boolean }) {
  const shot = PRODUCT_SHOTS.timetravel;
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-background"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <div
        className="absolute"
        style={{ width: `${(shot.w / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }}
      >
        <ProductShot name="timetravel" priority={priority} sizes="(max-width: 1024px) 180vw, 1100px" />
      </div>
    </div>
  );
}

/** The script you would write, pushed back and dimmed, with the same job in Buckets in front. */
function HeroContrast() {
  return (
    <div className="hero-rise relative mx-auto w-full max-w-xl lg:max-w-none" style={{ animationDelay: "200ms" }}>
      <p className="sr-only">
        Restoring a prefix to an earlier point by hand takes a shell script that lists object versions and copies
        each one back. In Buckets, Time Travel takes three steps: pick a time, see what changed, restore.
      </p>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[4rem] bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--brand-from)/0.3),hsl(var(--brand-to)/0.22),hsl(var(--primary)/0.05),hsl(var(--brand-from)/0.3))] opacity-60 blur-[80px] dark:opacity-80"
      />

      {/* Behind: the script. It is texture; the label carries the point. */}
      <div aria-hidden className="relative w-[90%] -rotate-[1.5deg]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#16161a] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.5)]">
          <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="whitespace-nowrap text-base font-semibold text-white sm:text-lg">By hand</span>
            <span className="text-[13px] text-white/60 sm:text-base">{SCRIPT.length} lines, then the edge cases</span>
          </div>
          <pre className="overflow-hidden px-4 pb-28 pt-3 font-mono text-[9.5px] leading-[1.7] text-white/45 sm:text-[11px] lg:pb-32">
            {SCRIPT.map(({ text, tone }) => (
              <span key={text} className={cn("block", tone === "comment" && "text-white/30")}>
                {text}
              </span>
            ))}
          </pre>
        </div>
      </div>

      {/* In front: the same job in Buckets, as three cropped steps */}
      <div className="relative z-10 -mt-52 ml-auto w-[88%] lg:-mt-60">
        {/* Solid backing: .surface is translucent in dark mode and the script would show through. */}
        <div className="rounded-2xl bg-background">
          <div className="surface shadow-frame rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="text-base font-semibold text-foreground sm:text-lg">In Buckets</span>
              <span className="text-sm text-muted-foreground sm:text-base">{STEPS.length} steps</span>
            </div>
            <ol className="mt-3 flex flex-col gap-3">
              {STEPS.map(({ label, ...region }, n) => (
                <li key={label}>
                  <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                      {n + 1}
                    </span>
                    {label}
                  </p>
                  <Crop {...region} priority={n === 0} />
                </li>
              ))}
            </ol>
          </div>
        </div>
        {/* The outcome, from the change window in the shot above (412 deleted). */}
        <p className="absolute -bottom-5 -left-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-xl sm:-left-10 sm:text-base">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" strokeWidth={3} />
          412 deleted objects, back
        </p>
      </div>
      <p className="mt-8 text-right text-xs text-muted-foreground/70">Shown with the app&apos;s sample data.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero demo: one 9s clock drives the cursor, the account switcher,    */
/* the row highlight and the presign toast so every effect follows    */
/* the click that causes it. Coordinates are percentages of the       */
/* workspace screenshot (1600 x 1000 CSS px at capture).              */
/* ------------------------------------------------------------------ */
const LOOP_MS = 9000;
const T = [0, 0.13, 0.17, 0.38, 0.47, 0.5, 0.64, 0.69, 0.86, 1];
const CX = [58, 82.6, 82.6, 82.6, 31, 31, 88, 88, 64, 58];
const CY = [72, 2.6, 2.6, 2.6, 54.2, 54.2, 40.3, 40.3, 66, 72];
const CLICKS = [0.16, 0.48, 0.68];
const SWITCHER = [0.17, 0.38] as const;
const ROW = [0.49, 0.97] as const;
const TOAST = [0.7, 0.96] as const;

const inside = (v: number, [a, b]: readonly [number, number]) => v >= a && v < b;

function useDemoClock(active: boolean) {
  const t = useMotionValue(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) start.current = null;
  }, [active]);
  useAnimationFrame((now) => {
    if (!active) return;
    if (start.current === null) start.current = now;
    t.set(((now - start.current) % LOOP_MS) / LOOP_MS);
  });
  return t;
}

function DemoLayer({ active }: { active: boolean }) {
  const t = useDemoClock(active);
  const [phase, setPhase] = useState({ open: false, row: false, toast: false });
  useMotionValueEvent(t, "change", (v) => {
    const next = { open: inside(v, SWITCHER), row: inside(v, ROW), toast: inside(v, TOAST) };
    setPhase((p) => (p.open === next.open && p.row === next.row && p.toast === next.toast ? p : next));
  });

  const x = useTransform(t, T, CX, { ease: easeInOut });
  const y = useTransform(t, T, CY, { ease: easeInOut });
  // Transform-only movement: the layer is screenshot-sized, so % maps 1:1.
  const tx = useTransform(x, (v) => `${v}%`);
  const ty = useTransform(y, (v) => `${v}%`);
  const press = useTransform(t, (v) => (CLICKS.some((c) => v >= c && v < c + 0.012) ? 0.82 : 1));
  const sinceClick = (v: number) => {
    const c = [...CLICKS].reverse().find((k) => v >= k);
    return c === undefined ? 1 : (v - c) / 0.06;
  };
  const rippleScale = useTransform(t, (v) => Math.min(sinceClick(v), 1) * 1.7);
  const rippleOpacity = useTransform(t, (v) => (sinceClick(v) < 1 ? 0.9 * (1 - sinceClick(v)) : 0));
  const countdown = useTransform(t, [TOAST[0], TOAST[1]], [1, 0]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 hidden md:block">
      {/* Row highlight after the file is clicked */}
      <AnimatePresence>
        {phase.row && (
          <motion.div
            key="row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute left-[22.2%] top-[52%] h-[4.5%] w-[48.3%] rounded-md bg-primary/10 ring-2 ring-primary/70"
          />
        )}
      </AnimatePresence>

      {/* Account switcher opens from the top-bar button */}
      <AnimatePresence>
        {phase.open && (
          <motion.div
            key="switcher"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING }}
            exit={{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.18 } }}
            className="absolute right-[12.5%] top-[4.6%] w-[17.5%] origin-top-right overflow-hidden rounded-lg border border-border shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45)]"
          >
            <ProductShot name="profiles" sizes="220px" decorative />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor */}
      <motion.div className="absolute inset-0" style={{ x: tx, y: ty }}>
        <motion.span
          className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-primary"
          style={{ scale: rippleScale, opacity: rippleOpacity }}
        />
        <motion.svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          style={{ scale: press, originX: 0.15, originY: 0.1 }}
          className="drop-shadow-[0_4px_8px_rgb(0_0_0/0.35)]"
        >
          <path
            d="M4 2.5 L4 19 L8.6 14.9 L11.6 21.5 L14.4 20.3 L11.5 13.8 L17.8 13.6 Z"
            fill="#111"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      {/* Presign toast, caused by the third click */}
      <AnimatePresence>
        {phase.toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.25 } }}
            className="absolute bottom-[4%] right-[3%] w-[290px] rounded-2xl border border-border bg-background p-4 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Presigned link copied</p>
                <p className="mt-0.5 flex items-center gap-1 truncate font-mono text-[11px] text-muted-foreground">
                  <Link2 className="h-3 w-3 shrink-0" />
                  launch-film-4k.mp4 · 15 min
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full w-full origin-left rounded-full bg-primary" style={{ scaleX: countdown }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hotspot({ className, label }: { className: string; label: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute z-20 hidden items-center gap-2 lg:flex", className)}
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-halo" />
        <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary" />
      </span>
      <span className="whitespace-nowrap rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-lg ring-1 ring-border">
        {label}
      </span>
    </div>
  );
}

function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalm();
  const inView = useInView(ref, { amount: 0.3 });
  const active = inView && !calm;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const tilt = useTransform(scrollYProgress, [0, 0.45], [12, 0]);
  const yCard = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // Pointer parallax: the window leans toward the mouse.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-3, 3]);
  const rotX = useTransform(sy, [-0.5, 0.5], [2.5, -2.5]);
  const cx = useTransform(sx, [-0.5, 0.5], [12, -12]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (calm) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto mt-10 w-full max-w-6xl [perspective:2200px] md:mt-12"
    >
      {/* Glow behind the product frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -top-16 bottom-0 -z-10 rounded-[4rem] bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--brand-from)/0.35),hsl(var(--brand-to)/0.25),hsl(var(--primary)/0.05),hsl(var(--brand-from)/0.35))] opacity-60 blur-[90px] dark:opacity-80"
      />

      <motion.div style={{ rotateX: calm ? 0 : tilt }} className="origin-bottom [transform-style:preserve-3d]">
        <motion.div
          style={calm ? undefined : { rotateY: rotY, rotateX: rotX }}
          className="surface shadow-frame relative overflow-hidden rounded-2xl"
        >
          <div className="flex h-9 items-center gap-2 border-b border-border bg-background/80 px-4">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="mx-auto pr-12 text-xs font-medium text-muted-foreground">Buckets</span>
          </div>
          {/* On phones, zoom into the tabs + file list so the UI stays legible. */}
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
            <ProductShot
              name="workspace"
              sizes="(max-width: 768px) 180vw, (max-width: 1200px) 100vw, 1150px"
              className="origin-top-left scale-[1.8] md:scale-100"
            />
            {!calm && <DemoLayer active={active} />}
            <Hotspot className="left-[35.5%] top-[5.4%]" label="Every account, its own tab" />
          </div>
          {!calm && (
            <BorderBeam size={320} duration={9} colorFrom="hsl(var(--brand-from))" colorTo="hsl(var(--brand-to))" />
          )}
        </motion.div>
      </motion.div>

      {/* Floating: search across every bucket (static once it lands) */}
      <motion.div
        style={{ y: yCard, x: cx }}
        className="absolute -left-6 top-[60%] z-20 hidden w-[300px] xl:block 2xl:-left-16"
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, ...SPRING }}
          style={{ rotate: -2 }}
          className="overflow-hidden rounded-xl border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.4)] ring-1 ring-black/5"
        >
          <ProductShot name="search" sizes="300px" />
        </motion.div>
      </motion.div>
    </div>
  );
}

const PROOF = [
  { icon: Lock, title: "Local-first", body: "Your AWS credentials stay on your machine." },
  { icon: Zap, title: "Direct to AWS", body: "Traffic goes straight from your computer to AWS." },
  { icon: MonitorSmartphone, title: "On every desktop", body: "One license covers macOS, Windows and Linux." },
  { icon: Sparkles, title: "Everything included", body: "Every feature on every plan. No add-ons." },
];

function ProofStrip() {
  return (
    <div className="mx-auto mt-16 grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mt-20 lg:mt-28 lg:grid-cols-4">
      {PROOF.map(({ icon: Icon, title, body }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.5, ease: EASE_OUT }}
          className="group flex flex-col items-start gap-2 bg-background p-4 transition-colors hover:bg-primary/[0.04] sm:flex-row sm:gap-3 sm:p-6"
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm">{body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-glow pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      {/* Bottom padding is kept small so the top of the pain reel shows on the first screen. */}
      <div className="relative flex w-full flex-col items-center px-4 pb-6 pt-10 sm:px-6 md:pt-12 lg:px-8">
        <div className="grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <HeroEyebrow />
            <HeroTitles />
            <HeroCTA />
          </div>
          <HeroContrast />
        </div>
      </div>
    </section>
  );
}

/** The animated workspace demo and the four trust facts. Sits below the pain reel. */
export function HeroShowcase() {
  return (
    <section aria-label="Buckets in use" className="relative overflow-hidden px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col items-center">
        <HeroStage />
        <ProofStrip />
      </div>
    </section>
  );
}
