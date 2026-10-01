"use client";

import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
} from "framer-motion";
import { History, Inbox, LayoutGrid, Pause, Play, Search, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent } from "react";

import { ProductShot, type ProductShotName } from "@/components/product-shot";
import Section from "@/components/section";
import { EASE_OUT, SPRING, useCalm, useHydrated } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Stop = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  shot: ProductShotName;
  /** Dialog shots float over a dimmed copy of the workspace, like in the app. */
  modal?: { width: string; sizes: string };
  /** On phones the full window is unreadable, so zoom in around this x% (top-anchored). */
  focusX?: string;
};

const STOPS: Stop[] = [
  {
    id: "search",
    label: "Search",
    icon: Search,
    title: "Find it in any bucket",
    body: "Search object names across the buckets in the active account from the top bar, grouped by bucket. Global Object Search runs one reviewed scan across all your saved accounts, grouped by account and bucket.",
    shot: "searchall",
    focusX: "12%",
  },
  {
    id: "timetravel",
    label: "Time Travel",
    icon: History,
    title: "See a versioned bucket as it was",
    body: "Pick a moment or a recent change window, review exactly what will change, then restore objects or a prefix from retained versions. Only history S3 still holds can be restored.",
    shot: "timetravel",
    modal: { width: "64%", sizes: "(max-width: 1200px) 64vw, 740px" },
  },
  {
    id: "dropzones",
    label: "Drop Zones",
    icon: Inbox,
    title: "Collect files from clients",
    body: "Create a signed upload page limited to one prefix, with a size cap and an expiry. Clients and vendors upload straight to your bucket without an AWS account.",
    shot: "dropzones",
    modal: { width: "72%", sizes: "(max-width: 1200px) 72vw, 830px" },
  },
  {
    id: "home",
    label: "Command Center",
    icon: LayoutGrid,
    title: "Every capability, one search away",
    body: "Quick actions for the things you do daily, plus a searchable directory of everything Buckets can do, organised into Browse, Operate and Build.",
    shot: "home",
    focusX: "44%",
  },
  {
    id: "operate",
    label: "Operate",
    icon: ShieldCheck,
    title: "Protect, recover and deliver",
    body: "Recovery guardrails, transfer tuning, CloudFront delivery and team handoffs, always scoped to the account, region and bucket you are in.",
    shot: "operate",
    focusX: "70%",
  },
];

const DURATION = 6500;

export default function Tour() {
  const mounted = useHydrated();
  const calm = useCalm();

  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Autoplay stops for good once the visitor takes control.
  const [userStopped, setUserStopped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(ref, { amount: 0.35 });
  const autoplay = mounted && !calm && !userStopped;
  const running = autoplay && inView && !hovered && !focused;

  // Progress pauses (rather than restarts) while hovered or focused.
  const progress = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (!running) return;
    const next = progress.get() + delta / DURATION;
    if (next >= 1) {
      progress.set(0);
      setActive((n) => (n + 1) % STOPS.length);
    } else {
      progress.set(next);
    }
  });

  const select = (i: number, focus = false) => {
    progress.set(0);
    setActive(i);
    setUserStopped(true);
    if (focus) tabs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = STOPS.length - 1;
    const map: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key], true);
    }
  };

  // On phones the tab row scrolls sideways: keep the active tab in view
  // without moving the page vertically.
  const tablist = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tablist.current;
    const tab = tabs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left, behavior: calm ? "auto" : "smooth" });
  }, [active, calm]);

  const stop = STOPS[active];

  return (
    <Section
      id="tour"
      title="Product tour"
      subtitle="See the real app, not a mockup"
      description="Every screen below is the actual Buckets desktop app, captured with sample data."
    >
      <div
        ref={ref}
        className="relative mx-auto mt-2 max-w-6xl"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
      >
        {/* Tabs */}
        <div className="flex items-center gap-2 sm:justify-center">
          <div
            ref={tablist}
            role="tablist"
            aria-label="Product tour"
            onKeyDown={onKeyDown}
            className="no-scrollbar relative -mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {STOPS.map((s, i) => {
              const Icon = s.icon;
              const on = i === active;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  id={`tour-tab-${s.id}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls="tour-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i)}
                  className={cn(
                    "relative min-h-[40px] shrink-0 snap-start overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on
                      ? "border-primary/40 text-foreground"
                      : "border-border bg-foreground/[0.02] text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="tour-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary/10"
                      transition={calm ? { duration: 0 } : SPRING}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", on && "text-primary")} />
                    {s.label}
                  </span>
                  {on && autoplay && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-x-3 bottom-0 h-[2px] origin-left rounded-full bg-primary"
                      style={{ scaleX: progress }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {autoplay || userStopped ? (
            <button
              type="button"
              onClick={() => setUserStopped((v) => !v)}
              aria-label={userStopped ? "Play tour" : "Pause tour"}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              {userStopped ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          ) : null}
        </div>

        {/* Caption */}
        <div className="mx-auto mt-6 min-h-[120px] max-w-2xl text-center sm:min-h-[96px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{stop.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{stop.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stage */}
        <div className="relative mt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-[90px] dark:bg-primary/15"
          />
          <div
            id="tour-panel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`tour-tab-${stop.id}`}
            className="surface shadow-frame relative aspect-[5/4] overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:aspect-[16/10]"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={stop.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: calm ? 0 : 0.45, ease: EASE_OUT }}
              >
                {stop.modal ? (
                  <div
                    className="absolute inset-0 bg-muted sm:bg-transparent"
                    style={{ "--modal-w": stop.modal.width } as CSSProperties}
                  >
                    <ProductShot
                      name="workspace"
                      sizes="(max-width: 1200px) 100vw, 1150px"
                      decorative
                      className="hidden sm:block"
                    />
                    <motion.div
                      className="absolute inset-0 hidden bg-black/35 dark:bg-black/55 sm:block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ y: 24, scale: 0.96, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ delay: 0.12, ...SPRING }}
                        className="w-[94%] sm:w-[var(--modal-w)]"
                      >
                        <div className="overflow-hidden rounded-xl shadow-[0_40px_100px_-20px_rgb(0_0_0/0.6)] ring-1 ring-black/10">
                          <ProductShot name={stop.shot} sizes={`(max-width: 640px) 94vw, ${stop.modal.sizes}`} />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <div style={{ "--focus-x": stop.focusX ?? "0%" } as CSSProperties}>
                    <ProductShot
                      name={stop.shot}
                      sizes="(max-width: 640px) 190vw, (max-width: 1200px) 100vw, 1150px"
                      className="origin-[var(--focus-x)_0%] scale-[1.9] sm:scale-100"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}
