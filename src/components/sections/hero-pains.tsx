"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { sendGAEvent } from "@next/third-parties/google";
import { Check, Pause, Play, X } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import { PRODUCT_SHOTS, ProductShot, type ProductShotName } from "@/components/product-shot";
import { EASE_OUT, SPRING, useCalm, useHydrated } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* The hero's rotating pains. Everything that carries the message      */
/* changes together from one index: the headline, the pain and its     */
/* fix, the screenshot (already framed on the control that does the    */
/* job), the click box and the outcome chip.                           */
/*                                                                     */
/* One slide, 3.5 s:                                                   */
/*   0.0  picture crossfades in; headline, pain and fix fade in as one */
/*   0.25 cursor glides to the control                                 */
/*   0.85 click: ripple and ring                                       */
/*   0.95 outcome chip, always bottom left                             */
/* The picture also drifts in by a few percent for the whole slide.    */
/* Keep it to one motion per side; the eye cannot follow more.         */
/*                                                                     */
/* Copy rules (docs/MARKETING_CLAIMS_AND_VALIDATION.md): no hours      */
/* saved, no ROI, savings are "estimated", no other S3 client is       */
/* named. Outcome chips repeat figures that are visible in the         */
/* screenshot (sample data); change the chip if the shot changes.      */
/* ------------------------------------------------------------------ */
export const SLIDE_MS = 3500;
const FADE_S = 0.5;
const CURSOR_AT = 0.25;
const CLICK_AT = 0.85;
const OUTCOME_AT = 0.95;
/** How far the picture drifts in over one slide. */
const DRIFT = 1.04;
/** Slide 1 waits for the page's own entrance to finish before it plays. */
const ENTRANCE_MS = 900;

/** Width over height of the stage. Regions below are cut to this shape. */
const STAGE = 3 / 2;

/** A view of a screenshot: centre and width, in percent of the image. */
type View = { cx: number; cy: number; w: number };

type Pain = {
  /** Also the deep link: /?wow=<id> opens on this slide, paused. */
  id: string;
  /** Two lines, each short enough to stay on one line at every width. The accent ends line two. */
  headline: [string, string];
  accent: string;
  pain: string;
  fix: string;
  shot: ProductShotName;
  /** The part of the screenshot to show. Dialog shots use the full width so no line is cut. */
  view: View;
  /**
   * The control the cursor clicks, in percent of the image. Measured from the
   * screenshot's pixels (the light and dark shots agree to within 2 px), not
   * placed by eye. Re-measure if the screenshot is replaced.
   */
  box: { x: number; y: number; w: number; h: number };
  outcome: string;
};

export const PAINS: Pain[] = [
  {
    id: "time-travel",
    headline: ["Roll a bucket back", "to before the mistake."],
    accent: "the mistake.",
    pain: "Someone overwrote half the bucket on Tuesday.",
    fix: "Pick Tuesday morning, review, restore. Needs versioning.",
    shot: "timetravel",
    view: { cx: 69, cy: 80, w: 62 },
    box: { x: 70.8, y: 91.71, w: 24.8, h: 3.85 },
    outcome: "412 deleted objects, back",
  },
  {
    id: "money-leaks",
    headline: ["Find what S3 is", "quietly costing you."],
    accent: "costing you.",
    pain: "The S3 bill keeps growing and nobody knows why.",
    fix: "A read-only scan lists the leaks and a fix for each.",
    shot: "moneyleaks",
    view: { cx: 39, cy: 46, w: 43 },
    box: { x: 34.03, y: 56.95, w: 17.12, h: 2.7 },
    outcome: "$9.48 a month, estimated, from one fix",
  },
  {
    id: "agents",
    headline: ["Let AI agents use S3", "without your keys."],
    accent: "your keys.",
    pain: "Your AI agent wants your AWS keys.",
    fix: "Agents work through Buckets. Every write waits for you.",
    shot: "mcp-approval",
    view: { cx: 50, cy: 80, w: 100 },
    box: { x: 82.44, y: 93.02, w: 11.61, h: 3.37 },
    outcome: "Nothing is written until you approve",
  },
  {
    id: "search",
    headline: ["Find that file", "across every bucket."],
    accent: "every bucket.",
    pain: "Which bucket was that file in?",
    fix: "Search every bucket in the account from one box.",
    shot: "searchall",
    view: { cx: 45.5, cy: 24, w: 44 },
    box: { x: 31.72, y: 12.8, w: 29.2, h: 3.7 },
    outcome: "6 results across 4 buckets",
  },
  {
    id: "drop-zones",
    headline: ["Collect client files", "with no AWS account."],
    accent: "no AWS account.",
    pain: "A client has files for you and no AWS account.",
    fix: "Send an upload link that expires, limited to one prefix.",
    shot: "dropzones",
    view: { cx: 35, cy: 56, w: 62 },
    box: { x: 9.06, y: 62.38, w: 4.44, h: 3.37 },
    outcome: "Upload link, gone in 1 day",
  },
  {
    id: "auth-doctor",
    headline: ["See exactly why", "access was denied."],
    accent: "denied.",
    pain: "Access denied, and no hint which credential failed.",
    fix: "Auth Doctor checks the chain and says what to fix.",
    shot: "authdoctor",
    view: { cx: 50, cy: 72, w: 100 },
    box: { x: 5.92, y: 67.85, w: 88.15, h: 11.42 },
    outcome: "The fix: sign in with SSO again",
  },
  {
    id: "folder-move",
    headline: ["Rename a folder and", "see the cost first."],
    accent: "cost first.",
    pain: "Renaming a folder means copying every object in it.",
    fix: "See the count and cost first. Resume if it stops.",
    shot: "foldermove",
    view: { cx: 50, cy: 80, w: 100 },
    box: { x: 83.18, y: 93.71, w: 13.84, h: 3.96 },
    outcome: "3,412 objects for an estimated $0.02",
  },
];

/** Turn a view into a rectangle of the image (all in percent), kept inside the image. */
function rect(shot: ProductShotName, v: View) {
  const ar = PRODUCT_SHOTS[shot].w / PRODUCT_SHOTS[shot].h;
  const w = Math.min(v.w, (100 * STAGE) / ar);
  const h = (w * ar) / STAGE;
  const x = Math.min(Math.max(v.cx - w / 2, 0), 100 - w);
  const y = Math.min(Math.max(v.cy - h / 2, 0), 100 - h);
  return { x, y, w, h };
}

export type PainRotation = ReturnType<typeof usePainRotation>;

/** One clock for the text, the picture and the dots. */
export function usePainRotation(ref: RefObject<HTMLElement | null>) {
  const calm = useCalm();
  const hydrated = useHydrated();
  const inView = useInView(ref, { amount: 0.3 });
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), ENTRANCE_MS);
    return () => clearTimeout(id);
  }, []);

  // /?wow=<id> opens on that slide and stays there.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("wow");
    const at = PAINS.findIndex((p) => p.id === id);
    if (at < 0) return;
    const raf = requestAnimationFrame(() => {
      setI(at);
      setStopped(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const auto = hydrated && !calm && !stopped;
  return {
    i,
    calm,
    /** Motion may play (visitor has not asked for reduced motion). */
    moving: hydrated && !calm,
    /** The page entrance is over, so the first slide may start. */
    ready,
    auto,
    running: auto && ready && inView && !hover,
    stopped,
    next: () => setI((v) => (v + 1) % PAINS.length),
    select: (n: number) => {
      setI(n);
      sendGAEvent("event", "wow_selected", { wow: PAINS[n].id });
    },
    toggle: () => setStopped((s) => !s),
    hoverProps: {
      onPointerEnter: () => setHover(true),
      onPointerLeave: () => setHover(false),
      onFocus: () => setHover(true),
      onBlur: () => setHover(false),
    },
  };
}

/**
 * The headline, the pain and its fix. They change as one block, and every part
 * has a fixed height at every width, so nothing below it ever moves:
 * headline lines never wrap, and the pain and the fix each get room for two lines.
 */
export function PainCopy({ rotation }: { rotation: PainRotation }) {
  const { i, moving } = rotation;
  const p = PAINS[i];
  const [first, second] = p.headline;
  const plain = second.endsWith(p.accent) ? second.slice(0, -p.accent.length) : second;
  const row = "flex items-start justify-center gap-2.5 text-left sm:gap-3 lg:justify-start";
  const dot = "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full";
  return (
    <div className="hero-rise mt-5 w-full" style={{ animationDelay: "60ms" }}>
      {/* Every pain is in the page for search engines and screen readers. */}
      <ul className="sr-only">
        {PAINS.map((x) => (
          <li key={x.id}>
            {x.headline.join(" ")} {x.pain} {x.fix}
          </li>
        ))}
      </ul>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={p.id}
          initial={moving ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={moving ? { opacity: 0, transition: { duration: 0.12 } } : undefined}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          <h1 className="whitespace-nowrap text-[clamp(1.5rem,7.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.045em] lg:text-[2.5rem] xl:text-[3.25rem]">
            <span className="text-gradient block">{first}</span>
            <span className="block pb-1">
              <span className="text-gradient">{plain}</span>
              {plain !== second && <span className="text-gradient-brand">{p.accent}</span>}
            </span>
          </h1>
          <div className="mx-auto mt-5 w-fit max-w-xl lg:mx-0 lg:w-auto">
            <p className={cn(row, "min-h-[3.5rem] text-[17px] font-semibold leading-7 text-foreground sm:min-h-[1.75rem] sm:text-xl lg:min-h-[3.5rem] xl:min-h-[1.75rem]")}>
              <span className={cn(dot, "bg-destructive/15 text-destructive")}>
                <X className="h-3 w-3" strokeWidth={3} />
              </span>
              <span>{p.pain}</span>
            </p>
            <p className={cn(row, "mt-2 min-h-[3.5rem] text-base leading-7 text-muted-foreground sm:text-lg")}>
              <span className={cn(dot, "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400")}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span>{p.fix}</span>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Slide({ pain, state, first }: { pain: Pain; state: "rest" | "play" | "still"; first: boolean }) {
  const b = rect(pain.shot, pain.view);
  // Positions inside the stage, in percent.
  // The cursor clicks the middle of the measured control.
  const fx = ((pain.box.x + pain.box.w / 2 - b.x) / b.w) * 100;
  const fy = ((pain.box.y + pain.box.h / 2 - b.y) / b.h) * 100;
  const ring = {
    left: `${((pain.box.x - b.x) / b.w) * 100}%`,
    top: `${((pain.box.y - b.y) / b.h) * 100}%`,
    width: `${(pain.box.w / b.w) * 100}%`,
    height: `${(pain.box.h / b.h) * 100}%`,
  };
  const shown = state !== "rest";
  const play = state === "play";
  // A slide that is leaving keeps its last frame while it fades, then resets unseen.
  const reset = { duration: 0, delay: FADE_S };
  const drift = {
    className: "absolute inset-0",
    style: { transformOrigin: `${fx}% ${fy}%` },
    initial: false as const,
    animate: { scale: play ? DRIFT : 1 },
    transition: play ? { duration: SLIDE_MS / 1000, ease: "linear" as const } : reset,
  };

  return (
    <motion.div
      aria-hidden={!shown || undefined}
      className="absolute inset-0"
      initial={false}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: play || state === "rest" ? FADE_S : 0, ease: "easeInOut" }}
    >
      <motion.div {...drift}>
        <div
          className="absolute"
          style={{ width: `${(100 / b.w) * 100}%`, left: `${(-b.x / b.w) * 100}%`, top: `${(-b.y / b.h) * 100}%` }}
        >
          <ProductShot
            name={pain.shot}
            priority={first}
            decorative={!shown}
            sizes="(max-width: 1024px) 200vw, 1400px"
          />
        </div>
      </motion.div>

      {/* Soft edges, so a line cut by the frame fades out instead of stopping dead. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_22px_14px_hsl(var(--background))]"
      />

      {/* The control and the cursor ride on the same drift as the picture. */}
      <motion.div {...drift} aria-hidden className="pointer-events-none absolute inset-0">
        <motion.span
          data-click-box
          className="absolute rounded-md ring-2 ring-primary ring-offset-2 ring-offset-transparent"
          style={ring}
          initial={false}
          animate={{ opacity: shown ? 1 : 0 }}
          transition={play ? { delay: CLICK_AT, duration: 0.2 } : shown ? { duration: 0 } : reset}
        />
        <motion.div
          className="absolute"
          initial={false}
          animate={
            play
              ? { left: `${fx}%`, top: `${fy}%`, opacity: 1 }
              : { left: `${fx + 12}%`, top: `${fy + 22}%`, opacity: 0 }
          }
          transition={
            play
              ? { delay: CURSOR_AT, duration: CLICK_AT - CURSOR_AT, ease: EASE_OUT, opacity: { delay: CURSOR_AT, duration: 0.2 } }
              : reset
          }
        >
          <motion.span
            className="absolute -left-4 -top-4 h-8 w-8 rounded-full border-2 border-primary"
            initial={false}
            animate={play ? { scale: [0, 1.7], opacity: [0.9, 0] } : { scale: 0, opacity: 0 }}
            transition={play ? { delay: CLICK_AT, duration: 0.45, ease: "easeOut" } : { duration: 0 }}
          />
          <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-[0_4px_8px_rgb(0_0_0/0.35)]">
            <path
              d="M4 2.5 L4 19 L8.6 14.9 L11.6 21.5 L14.4 20.3 L11.5 13.8 L17.8 13.6 Z"
              fill="#111"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** The picture: every slide stays mounted so its screenshot is loaded before its turn. */
export function PainStage({ rotation }: { rotation: PainRotation }) {
  const { i, moving, ready, auto, running, stopped, calm, next, select, toggle } = rotation;
  const state = (n: number) => (n !== i ? "rest" : !moving ? "still" : ready ? "play" : "still");
  // Before the entrance is over the first slide is shown at rest, without its outcome.
  const outcome = !moving || ready;
  return (
    <div className="hero-rise relative mx-auto w-full max-w-xl lg:max-w-none" style={{ animationDelay: "200ms" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[4rem] bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--brand-from)/0.3),hsl(var(--brand-to)/0.22),hsl(var(--primary)/0.05),hsl(var(--brand-from)/0.3))] opacity-60 blur-[80px] dark:opacity-80"
      />
      <div className="relative">
        {/* Solid backing: .surface is translucent in dark mode. */}
        <div className="rounded-2xl bg-background">
          <div className="surface shadow-frame relative overflow-hidden rounded-2xl" style={{ aspectRatio: STAGE }}>
            {PAINS.map((p, n) => (
              <Slide key={p.id} pain={p} state={state(n)} first={n === 0} />
            ))}
          </div>
        </div>

        {/* The outcome: one place for every slide, half over the bottom edge. */}
        <AnimatePresence mode="wait" initial={false}>
          {outcome && (
            <motion.p
              key={PAINS[i].id}
              className="absolute -bottom-4 left-4 z-10 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-[1.25rem] bg-foreground px-4 py-2 text-[13px] font-semibold leading-snug text-background shadow-xl sm:left-5 sm:text-base"
              initial={moving ? { opacity: 0, y: 10, scale: 0.96 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={moving ? { opacity: 0, transition: { duration: 0.12 } } : undefined}
              transition={moving ? { delay: OUTCOME_AT, ...SPRING } : { duration: 0 }}
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600" strokeWidth={3} />
              {PAINS[i].outcome}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a pain point">
          {PAINS.map((p, n) => {
            const active = n === i;
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`${n + 1} of ${PAINS.length}: ${p.pain}`}
                aria-current={active ? "true" : undefined}
                onClick={() => select(n)}
                className="group flex h-6 items-center"
              >
                <span
                  className={cn(
                    "relative block h-1.5 overflow-hidden rounded-full transition-all",
                    active ? "w-9 bg-primary/25" : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40"
                  )}
                >
                  {active && (
                    <span
                      key={p.id}
                      onAnimationEnd={auto ? next : undefined}
                      className="absolute inset-0 origin-left bg-primary"
                      style={
                        auto
                          ? {
                              animation: `wow-progress ${SLIDE_MS}ms linear forwards`,
                              animationPlayState: running ? "running" : "paused",
                            }
                          : undefined
                      }
                    />
                  )}
                </span>
              </button>
            );
          })}
          <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
            {i + 1} / {PAINS.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground/70 sm:inline">Shown with the app&apos;s sample data.</span>
          {!calm && (
            <button
              type="button"
              onClick={toggle}
              aria-label={stopped ? "Play the slides" : "Pause the slides"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              {stopped ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
