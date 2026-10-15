"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { sendGAEvent } from "@next/third-parties/google";
import { motion, useInView } from "framer-motion";
import { Captions, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FILM, filmEmbedSrc, formatFilmTime } from "@/lib/film";
import { EASE_OUT, useCalm } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Location = "hero" | "section";

const YT_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * The film, streamed from YouTube with captions forced on. The iframe only
 * mounts after a click, so the page never loads YouTube's player up front.
 * GA4 enhanced measurement records video_start/progress/complete for embeds
 * with the JS API enabled.
 */
export function FilmPlayer({
  location,
  startAt = 0,
  seekRequest,
  className,
}: {
  location: Location;
  startAt?: number;
  /** Bump `n` to jump to `t` while the player is already mounted. */
  seekRequest?: { t: number; n: number };
  className?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const pending = useRef<number | null>(null);
  // Fixed at mount: changing the src would reload the player.
  const [src] = useState(() =>
    filmEmbedSrc(startAt, typeof window === "undefined" ? undefined : window.location.origin)
  );

  const seekTo = (t: number) => {
    const w = ref.current?.contentWindow;
    if (!w) return;
    const send = (func: string, args: unknown[] = []) =>
      w.postMessage(JSON.stringify({ event: "command", func, args }), YT_ORIGIN);
    send("seekTo", [t, true]);
    send("playVideo");
  };

  // Chapter jumps: commands sent before the player has loaded are dropped by
  // YouTube, so hold the latest one until the iframe's load event.
  useEffect(() => {
    if (!seekRequest || seekRequest.n === 0) return;
    sendGAEvent("event", "film_chapter", { location, t: seekRequest.t });
    if (ready.current) seekTo(seekRequest.t);
    else pending.current = seekRequest.t;
  }, [seekRequest, location]);

  const onLoad = () => {
    // The player script boots shortly after the frame's load event. It only
    // accepts postMessage commands after this "listening" handshake (verified
    // against the live embed: without it, seekTo is ignored).
    window.setTimeout(() => {
      ref.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: FILM.youtubeId, channel: "widget" }),
        YT_ORIGIN
      );
      ready.current = true;
      if (pending.current !== null) {
        seekTo(pending.current);
        pending.current = null;
      }
    }, 800);
  };

  return (
    <iframe
      ref={ref}
      src={src}
      onLoad={onLoad}
      title={FILM.title}
      className={cn("h-full w-full border-0 bg-black", className)}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

function ChapterChips({
  onPick,
  tone = "light",
  className,
}: {
  onPick: (t: number) => void;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center justify-center gap-2", className)} aria-label="Film chapters">
      {FILM.chapters.map((c) => (
        <li key={c.label}>
          <button
            type="button"
            onClick={() => onPick(c.t)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              tone === "light"
                ? "border-border bg-card text-foreground/80 shadow-sm hover:border-primary/40 hover:text-foreground"
                : "border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:text-white"
            )}
          >
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                tone === "light" ? "text-primary" : "text-[hsl(var(--brand-to))]"
              )}
            >
              {formatFilmTime(c.t)}
            </span>
            {c.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Full-screen lightbox used by the hero button. */
export function FilmDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [seek, setSeek] = useState({ t: 0, n: 0 });
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setSeek({ t: 0, n: 0 });
        onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,1240px)] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{FILM.title}</DialogPrimitive.Title>
          <div className="mb-3 flex items-center justify-between gap-4 text-white">
            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-to))]" aria-hidden />
              The 60-second film
              <span className="text-white/40">·</span>
              <span className="inline-flex items-center gap-1 text-white/60">
                <Captions className="h-4 w-4" aria-hidden /> Captions on
              </span>
            </p>
            <DialogPrimitive.Close className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <X className="h-5 w-5" />
              <span className="sr-only">Close film</span>
            </DialogPrimitive.Close>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/15">
            {open && <FilmPlayer location="hero" seekRequest={seek} />}
          </div>
          <ChapterChips tone="dark" className="mt-4" onPick={(t) => setSeek((s) => ({ t, n: s.n + 1 }))} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Secondary hero CTA: opens the film in a lightbox. */
export function WatchFilmButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          sendGAEvent("event", "film_open", { location: "hero" });
        }}
        className={cn(
          "group inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-foreground/[0.03] pl-2 pr-6 text-base font-medium text-foreground transition-colors hover:bg-foreground/[0.07] sm:w-auto",
          className
        )}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </span>
        Watch the film
        <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {FILM.durationLabel}
        </span>
      </button>
      <FilmDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Homepage section: a framed, silently looping preview that turns into the film. */
export function FilmSection() {
  const frame = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const calm = useCalm();
  const inView = useInView(frame, { amount: 0.35 });
  const [playing, setPlaying] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [seek, setSeek] = useState({ t: 0, n: 0 });
  // The preview only downloads once the card has been on screen, and only plays
  // while it stays there. Reduced-motion visitors keep the still poster.
  const seen = useInView(frame, { amount: 0.35, once: true });
  const previewOn = seen && !calm;
  useEffect(() => {
    const v = preview.current;
    if (!v || !previewOn || playing) return;
    if (v.networkState === v.NETWORK_EMPTY) v.load();
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [previewOn, inView, playing]);

  const start = (t = 0) => {
    if (playing) {
      setSeek((s) => ({ t, n: s.n + 1 }));
      return;
    }
    setStartAt(t);
    setPlaying(true);
    sendGAEvent("event", "film_open", { location: "section" });
  };

  return (
    <section id="film" aria-labelledby="film-title" className="relative scroll-mt-20">
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            The 60-second film
          </p>
          <h2
            id="film-title"
            className="mt-5 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl"
          >
            Amazon S3, <span className="text-gradient-brand">understood.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Folder Sync, Drop Zones and AI agents that ask before they write. Plus everything else you do in S3,
            in one minute.
          </p>
        </motion.div>

        <motion.div
          ref={frame}
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="relative mx-auto mt-12 md:mt-14"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_45%,hsl(var(--brand-from)/0.28),hsl(var(--brand-to)/0.12)_55%,transparent_80%)] blur-3xl dark:opacity-80"
          />
          <div className="surface shadow-frame overflow-hidden rounded-2xl">
            <div className="flex h-9 items-center gap-2 border-b border-border bg-background/80 px-4">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="mx-auto pr-12 text-xs font-medium text-muted-foreground">Buckets — the film</span>
            </div>
            <div className="relative aspect-video bg-[hsl(var(--card))]">
              {playing ? (
                <FilmPlayer location="section" startAt={startAt} seekRequest={seek} />
              ) : (
                <button
                  type="button"
                  onClick={() => start(0)}
                  className="group absolute inset-0 block h-full w-full cursor-pointer text-left focus:outline-none"
                  aria-label={`Play the film, ${FILM.durationSeconds} seconds, with sound and captions`}
                >
                  {/* Silent decorative preview; the film itself carries captions. */}
                  <video
                    ref={preview}
                    aria-hidden
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster={FILM.previewPoster}
                    className="absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 ease-out group-hover:scale-[1.01] group-hover:brightness-[0.94]"
                  >
                    {previewOn && FILM.previewSources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
                  </video>
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_50%,rgb(0_0_0/0.16),transparent_70%)] transition-opacity duration-500 group-hover:opacity-70"
                  />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
                    <span className="relative flex h-14 w-14 items-center justify-center sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                      {!calm && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-primary/40 animate-halo"
                          style={{ animationIterationCount: "infinite", animationDelay: "0.6s" }}
                        />
                      )}
                      <span className="relative flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_50px_-12px_hsl(var(--primary)/0.9)] ring-4 ring-white/30 transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95">
                        <Play className="ml-1 h-6 w-6 fill-current sm:h-8 sm:w-8 lg:h-9 lg:w-9" />
                      </span>
                    </span>
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-sm">
                      Watch the film · {FILM.durationLabel}
                    </span>
                  </span>
                  <span className="absolute bottom-4 left-4 hidden items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/10 backdrop-blur-md sm:inline-flex">
                    <Captions className="h-3.5 w-3.5" aria-hidden />
                    Sound on · captions included
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <ChapterChips className="mt-6" onPick={(t) => start(t)} />
      </div>
    </section>
  );
}
