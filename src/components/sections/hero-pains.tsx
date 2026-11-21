"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { sendGAEvent } from "@next/third-parties/google";
import { Check, Pause, Play, X } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import { PRODUCT_SHOTS, ProductShot, type ProductShotName } from "@/components/product-shot";
import { EASE_OUT, SPRING, useCalm, useHydrated } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* The hero's rotating pains. The headline stays fixed; under it one   */
/* pain and its fix show at a time, and beside it the real screenshot  */
/* for that fix, already framed on the control that does the job.      */
/*                                                                     */
/* One slide, 3.5 s:                                                   */
/*   0.0  picture crossfades in, pain and fix fade in together         */
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
  pain: string;
  fix: string;
  shot: ProductShotName;
  /** The part of the screenshot to show. Dialog shots use the full width so no line is cut. */
  view: View;
  /** Where the cursor clicks and what it highlights, in percent of the image. */
  click: { x: number; y: number };
  ring: { x: number; y: number; w: number; h: number };
  outcome: string;
};

export const PAINS: Pain[] = [
  {
    id: "time-travel",
    pain: "Someone overwrote half the bucket on Tuesday.",
    fix: "Pick Tuesday morning, review, restore. Needs versioning.",
    shot: "timetravel",
    view: { cx: 69, cy: 80, w: 62 },
    click: { x: 83.5, y: 93.6 },
    ring: { x: 70.6, y: 91.2, w: 25.2, h: 4.5 },
    outcome: "412 deleted objects, back",
  },
  {
    id: "money-leaks",
    pain: "The S3 bill keeps growing and nobody knows why.",
    fix: "A read-only scan lists the leaks and a fix for each.",
    shot: "moneyleaks",
    view: { cx: 39, cy: 46, w: 43 },
    click: { x: 43.5, y: 58.3 },
    ring: { x: 34, y: 56.4, w: 17.3, h: 3.7 },
    outcome: "$9.48 a month, estimated, from one fix",
  },
  {
    id: "agents",
    pain: "Your AI agent wants your AWS keys.",
    fix: "Agents work through Buckets. Every write waits for you.",
    shot: "mcp-approval",
    view: { cx: 50, cy: 80, w: 100 },
    click: { x: 88.2, y: 94.6 },
    ring: { x: 82.2, y: 92.7, w: 12.2, h: 3.8 },
    outcome: "Nothing is written until you approve",
  },
  {
    id: "search",
    pain: "Which bucket was that file in?",
    fix: "Search every bucket in the account from one box.",
    shot: "searchall",
    view: { cx: 45.5, cy: 24, w: 44 },
    click: { x: 40, y: 14.8 },
    ring: { x: 30.6, y: 12.8, w: 30.3, h: 4.1 },
    outcome: "6 results across 4 buckets",
  },
  {
    id: "drop-zones",
    pain: "A client has files for you and no AWS account.",
    fix: "Send an upload link that expires, limited to one prefix.",
    shot: "dropzones",
    view: { cx: 35, cy: 56, w: 62 },
    click: { x: 11.3, y: 63.9 },
    ring: { x: 9, y: 62, w: 4.6, h: 3.8 },
    outcome: "Upload link, gone in 1 day",
  },
  {
    id: "auth-doctor",
    pain: "Access denied, and no hint which credential failed.",
    fix: "Auth Doctor checks the chain and says what to fix.",
    shot: "authdoctor",
    view: { cx: 50, cy: 72, w: 100 },
    click: { x: 30, y: 76.8 },
    ring: { x: 6, y: 67.8, w: 88, h: 11.5 },
    outcome: "The fix: sign in with SSO again",
  },
  {
    id: "folder-move",
    pain: "Renaming a folder means copying every object in it.",
    fix: "See the count and cost first. Resume if it stops.",
    shot: "foldermove",
    view: { cx: 50, cy: 80, w: 100 },
    click: { x: 90, y: 95.6 },
    ring: { x: 83.2, y: 93.5, w: 13.9, h: 4.4 },
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

/** The pain and its fix, under the headline. The height is fixed so nothing below moves. */
export function PainText({ rotation }: { rotation: PainRotation }) {
  const { i, moving } = rotation;
  const p = PAINS[i];
  const row = "flex items-start justify-center gap-3 text-left lg:justify-start";
  return (
    <div className="hero-rise mt-6 w-full max-w-xl" style={{ animationDelay: "300ms" }}>
      {/* Every pain is in the page for search engines and screen readers. */}
      <ul className="sr-only">
        {PAINS.map((x) => (
          <li key={x.id}>
            {x.pain} {x.fix}
          </li>
        ))}
      </ul>
      <div aria-hidden className="min-h-[7.5rem] sm:min-h-[6.25rem]">
        {/* Pain and fix change as one block: out quickly, in together. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.id}
            initial={moving ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={moving ? { opacity: 0, transition: { duration: 0.12 } } : undefined}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <p className={cn(row, "text-lg font-semibold leading-7 text-foreground sm:text-xl")}>
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <X className="h-3 w-3" strokeWidth={3} />
              </span>
              <span>{p.pain}</span>
            </p>
            <p className={cn(row, "mt-2 text-lg leading-7 text-muted-foreground")}>
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span>{p.fix}</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Slide({ pain, state, first }: { pain: Pain; state: "rest" | "play" | "still"; first: boolean }) {
  const b = rect(pain.shot, pain.view);
  // Positions inside the stage, in percent.
  const fx = ((pain.click.x - b.x) / b.w) * 100;
  const fy = ((pain.click.y - b.y) / b.h) * 100;
  const ring = {
    left: `${((pain.ring.x - b.x) / b.w) * 100}%`,
    top: `${((pain.ring.y - b.y) / b.h) * 100}%`,
    width: `${(pain.ring.w / b.w) * 100}%`,
    height: `${(pain.ring.h / b.h) * 100}%`,
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
          className="absolute rounded-lg ring-2 ring-primary"
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
              className="absolute -bottom-4 left-4 z-10 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-xl sm:left-5 sm:text-base"
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
