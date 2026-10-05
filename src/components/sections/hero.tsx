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
import { ArrowRight, Check, Link2, Lock, MonitorSmartphone, Sparkles, Zap } from "lucide-react";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";

import { BorderBeam } from "@/components/magicui/border-beam";
import { ProductShot } from "@/components/product-shot";
import { buttonVariants } from "@/components/ui/button";
import { EASE_OUT, SPRING, useCalm } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Sample account names that appear in the product screenshots.
const ACCOUNTS = ["Production", "Staging", "Data Platform", "Client · Halcyon"];

function HeroPill() {
  return (
    <div className="hero-rise" style={{ animationDelay: "0ms" }}>
      <Link
        href="/blog/dropzones-public-upload-links-for-s3"
        onClick={() => sendGAEvent("event", "hero_pill_clicked")}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-border bg-foreground/[0.03] py-1 pl-1 pr-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span className="relative inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          <Sparkles className="h-3 w-3" />
          New
        </span>
        Drop Zones: expiring upload links for clients
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-0 group-hover:animate-shine group-hover:opacity-100"
        />
      </Link>
    </div>
  );
}

/** Cycles through account names, flipping each one in like a split-flap. */
function AccountTicker() {
  const calm = useCalm();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (calm) return;
    // Skip ticks while the tab is hidden: animations pause there, and queued
    // flips would otherwise pile up and overlap when the tab returns.
    const id = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % ACCOUNTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [calm]);

  return (
    <span
      aria-label="any of your AWS accounts"
      className="relative inline-flex h-[1.55em] w-[8.8em] items-center overflow-hidden rounded-lg border border-primary/25 bg-primary/[0.07] align-middle font-semibold text-foreground [perspective:600px]"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={ACCOUNTS[i]}
          aria-hidden
          initial={{ rotateX: -90, opacity: 0, y: "60%" }}
          animate={{ rotateX: 0, opacity: 1, y: "0%", transition: { duration: 0.45, ease: EASE_OUT } }}
          exit={{ rotateX: 90, opacity: 0, y: "-60%", transition: { duration: 0.25, ease: [0.7, 0, 0.84, 0] } }}
          className="absolute inset-0 inline-flex items-center gap-1.5 whitespace-nowrap pl-2.5"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129/0.9)]" />
          {ACCOUNTS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function HeroTitles() {
  return (
    <div className="flex w-full max-w-5xl flex-col items-center pt-6">
      {/* Entrance uses CSS (see .hero-rise) so the headline paints before hydration. */}
      <h1 className="text-balance text-center text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:text-[4.75rem]">
        <span className="hero-rise text-gradient block" style={{ animationDelay: "60ms" }}>
          Every S3 bucket.
        </span>
        <span className="hero-rise text-gradient block" style={{ animationDelay: "140ms" }}>
          Every AWS account.
        </span>
        <span className="hero-rise relative inline-block whitespace-nowrap" style={{ animationDelay: "220ms" }}>
          <span className="text-gradient-brand">One desktop app.</span>
          {/* Hand-drawn underline that sketches itself in. */}
          <svg
            aria-hidden
            viewBox="0 0 600 24"
            preserveAspectRatio="none"
            className="absolute -bottom-3 left-0 h-3 w-full overflow-visible sm:-bottom-4 sm:h-4"
          >
            <motion.path
              d="M4 16 C 120 4, 260 4, 360 12 S 540 22, 596 8"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ delay: 0.75, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            />
          </svg>
        </span>
      </h1>
      <p
        className="hero-rise mx-auto mt-9 max-w-2xl text-balance text-center text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9"
        style={{ animationDelay: "320ms" }}
      >
        For consultants and platform teams who work across many AWS accounts.
        Sign in with IAM Identity Center or your CLI profiles, jump to{" "}
        <AccountTicker /> in one click, and browse, search, share and restore S3
        objects from one focused app.
      </p>
    </div>
  );
}

function HeroCTA() {
  return (
    <div className="hero-rise mt-9 flex flex-col items-center gap-5" style={{ animationDelay: "420ms" }}>
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/downloads"
          onClick={() => sendGAEvent("event", "hero_download_clicked")}
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
          <span className="sm:hidden">Get the desktop app</span>
          <span className="hidden sm:inline">Download free trial</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="#tour"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full rounded-full border-border bg-foreground/[0.03] px-7 text-base font-medium hover:bg-foreground/[0.07] sm:w-auto"
          )}
        >
          Take the tour
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <FaApple className="h-4 w-4" />
          <FaWindows className="h-3.5 w-3.5" />
          <FaLinux className="h-4 w-4" />
          <span>macOS (Apple Silicon), Windows &amp; Linux</span>
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>14-day full trial</span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
        <span>No credit card</span>
      </div>
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
      className="hero-rise-soft relative mx-auto mt-14 w-full max-w-6xl [perspective:2200px] md:mt-16"
      style={{ animationDelay: "520ms" }}
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
              priority
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
      <div className="relative flex w-full flex-col items-center px-4 pb-16 pt-12 sm:px-6 md:pt-16 lg:px-8">
        <HeroPill />
        <HeroTitles />
        <HeroCTA />
        <HeroStage />
        <ProofStrip />
      </div>
    </section>
  );
}
