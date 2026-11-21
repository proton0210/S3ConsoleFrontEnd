"use client";

import { useInView } from "framer-motion";
import { track } from "@/lib/analytics";
import { ArrowRight, Check, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ProductShot, type ProductShotName } from "@/components/product-shot";
import { buttonVariants } from "@/components/ui/button";
import { useCalm, useHydrated } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pain reel: sits right under the hero and answers "why Buckets?"     */
/* one S3 headache at a time. Each slide is the pain first, then the   */
/* fix, then what the job costs by hand. It advances every 2.6 s, so   */
/* every line must be readable in that time: keep pains and fixes to   */
/* about ten words.                                                    */
/*                                                                     */
/* Copy rules (docs/MARKETING_CLAIMS_AND_VALIDATION.md): no hours      */
/* saved, no ROI, savings are always "estimated", no other S3 client   */
/* is named. Each fix states its own limit where one applies.          */
/* ------------------------------------------------------------------ */
const SLIDE_MS = 2600;

type Slide = {
  /** Also the deep link: /?wow=<id>#wow opens on this slide, paused. */
  id: string;
  pain: string;
  fix: string;
  byHand: string;
  shot: ProductShotName;
};

const SLIDES: Slide[] = [
  {
    id: "money-leaks",
    pain: "The S3 bill keeps growing and nobody knows why.",
    fix: "A read-only scan lists the leaks, each with an estimated saving.",
    byHand: "Storage Lens, Cost Explorer and a spreadsheet.",
    shot: "moneyleaks",
  },
  {
    id: "search",
    pain: "Which bucket was that file in?",
    fix: "Search every bucket in the account from one box.",
    byHand: "One list call per bucket, piped through grep.",
    shot: "searchall",
  },
  {
    id: "agents",
    pain: "Your AI agent wants your AWS keys.",
    fix: "Agents work through Buckets. Every write waits for your approval.",
    byHand: "A scoped IAM role per agent, and hope.",
    shot: "mcp-approval",
  },
  {
    id: "drop-zones",
    pain: "A client has files for you and no AWS account.",
    fix: "Send an upload link that expires, limited to one prefix.",
    byHand: "A presigned POST policy and a page to host it.",
    shot: "dropzones",
  },
  {
    id: "auth-doctor",
    pain: "Access denied, and no hint which credential failed.",
    fix: "Auth Doctor checks the credential chain and says what broke.",
    byHand: "Decode the error, then check each profile in turn.",
    shot: "authdoctor",
  },
  {
    id: "folder-move",
    pain: "Renaming a folder means copying every object in it.",
    fix: "See the object count and request cost first. Resume if it stops.",
    byHand: "A sync, a delete, and no way to pick up halfway.",
    shot: "foldermove",
  },
  {
    id: "time-travel",
    pain: "Someone overwrote half the bucket on Tuesday.",
    fix: "Pick Tuesday morning, review the changes, restore. Needs versioning.",
    byHand: "A script over every object version.",
    shot: "timetravel",
  },
];

export default function WowReel() {
  const ref = useRef<HTMLElement>(null);
  const calm = useCalm();
  const hydrated = useHydrated();
  const inView = useInView(ref, { amount: 0.35 });
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false);

  // /?wow=<id>#wow opens on that slide and stays there.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("wow");
    const at = SLIDES.findIndex((s) => s.id === id);
    if (at < 0) return;
    const raf = requestAnimationFrame(() => {
      setI(at);
      setStopped(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const auto = hydrated && !calm && !stopped;
  const running = auto && inView && !hover;
  const slide = SLIDES[i];

  const select = (n: number) => {
    setI(n);
    track("wow_selected", { wow: SLIDES[n].id });
  };

  return (
    <section
      ref={ref}
      id="wow"
      aria-labelledby="wow-heading"
      className="relative scroll-mt-20 px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="text-sm font-semibold text-primary">What it fixes</p>
            <h2
              id="wow-heading"
              className="mt-2 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl"
            >
              Seven S3 headaches, each one handled.
            </h2>
          </div>
          {!calm && (
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {stopped ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {stopped ? "Play" : "Pause"}
            </button>
          )}
        </div>

        <div
          className="mt-10 grid grid-cols-[minmax(0,1fr)] items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]"
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
        >
          {/* The pains. On large screens all seven stay visible; the active one opens. */}
          {/* The min-heights stop the page below from shifting as fixes of different lengths open. */}
          <ol className="flex min-h-[11rem] flex-col gap-2 lg:min-h-[33rem]">
            {SLIDES.map((s, n) => {
              const active = n === i;
              return (
                <li key={s.id} className={cn(!active && "hidden lg:block")}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => select(n)}
                    className={cn(
                      "relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary/40 bg-primary/[0.05]"
                        : "border-transparent hover:border-border hover:bg-foreground/[0.03]"
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          active ? "bg-destructive/15 text-destructive" : "bg-foreground/[0.06] text-muted-foreground"
                        )}
                      >
                        <X className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span
                        className={cn(
                          "text-[15px] leading-6",
                          active ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {s.pain}
                      </span>
                    </span>
                    {active && (
                      <>
                        <span className="mt-2 flex items-start gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className="text-[15px] leading-6 text-foreground">{s.fix}</span>
                        </span>
                        <span className="mt-1.5 block pl-8 text-[13px] leading-5 text-muted-foreground">
                          By hand: {s.byHand}
                        </span>
                        {auto && (
                          <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/15">
                            <span
                              key={s.id}
                              onAnimationEnd={() => setI((v) => (v + 1) % SLIDES.length)}
                              className="block h-full w-full origin-left bg-primary"
                              style={{
                                animation: `wow-progress ${SLIDE_MS}ms linear forwards`,
                                animationPlayState: running ? "running" : "paused",
                              }}
                            />
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div>
            {/* The fix, shown in the app. Every shot stays in the page; only the active one is visible. */}
            <div className="surface shadow-frame relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted/40">
              {SLIDES.map((s, n) => (
                <div
                  key={s.id}
                  aria-hidden={n !== i || undefined}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    n === i ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  <ProductShot
                    name={s.shot}
                    sizes="(max-width: 1024px) 92vw, 760px"
                    className="h-full"
                    imgClassName="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="flex items-center gap-1.5" role="group" aria-label="Choose a slide">
                {SLIDES.map((s, n) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`${n + 1} of ${SLIDES.length}: ${s.pain}`}
                    aria-current={n === i ? "true" : undefined}
                    onClick={() => select(n)}
                    className="group flex h-6 items-center"
                  >
                    <span
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        n === i ? "w-6 bg-primary" : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
                  {i + 1} / {SLIDES.length}
                </span>
              </div>
              <Link
                href="/downloads"
                onClick={() => track("cta_clicked", { cta: "wow_download", location: "wow_reel", wow: slide.id })}
                className={cn(buttonVariants({ size: "sm" }), "group rounded-full px-5 font-semibold")}
              >
                Try it on your own buckets
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
