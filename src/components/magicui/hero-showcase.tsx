"use client";

import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ShowcaseItem = {
  title: string;
  caption: string;
  alt: string;
} & ({ type: "video"; src: string } | { type: "image"; src: string });

const ITEMS: ShowcaseItem[] = [
  {
    type: "video",
    title: "Upload from URL",
    caption: "Pull a file straight from any link into your bucket — no local download.",
    src: "/media/upload-from-url.mp4",
    alt: "S3Console uploading a file to an S3 bucket directly from a URL",
  },
  {
    type: "video",
    title: "Drop Zones",
    caption: "Let anyone upload to S3 through a shareable link, no AWS account needed.",
    src: "/media/drop-zone.mp4",
    alt: "S3Console Drop Zone letting an external user upload files to S3",
  },
  {
    type: "video",
    title: "CLI Authentication",
    caption: "Sign in with your existing AWS CLI profiles in a single click.",
    src: "/media/cli-auth.mp4",
    alt: "S3Console authenticating using AWS CLI credentials",
  },
  {
    type: "video",
    title: "Multi-Bucket Search",
    caption: "Search objects across every bucket at once from one place.",
    src: "/media/multi-bucket-search.mp4",
    alt: "S3Console searching for objects across multiple S3 buckets",
  },
  {
    type: "image",
    title: "Move Between Buckets",
    caption: "Transfer objects from one bucket to another with drag-and-drop.",
    src: "/media/bucket-transfer.jpeg",
    alt: "S3Console transferring objects between two S3 buckets",
  },
];

/**
 * A single video slide. The <video> element (and therefore the download) is only
 * mounted once the slide has been activated, so on first paint we ship zero video
 * bytes. Once mounted it stays mounted, so revisiting a slide is instant.
 */
function VideoSlide({
  item,
  active,
  mounted,
}: {
  item: Extract<ShowcaseItem, { type: "video" }>;
  active: boolean;
  mounted: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active) {
      const p = video.play();
      if (p) p.catch(() => {});
    } else {
      video.pause();
    }
  }, [active, mounted]);

  if (!mounted) {
    return <SlidePlaceholder title={item.title} />;
  }

  return (
    <div className="relative size-full">
      {!ready && <SlidePlaceholder title={item.title} pulse />}
      <video
        ref={ref}
        src={item.src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={item.alt}
        onLoadedData={() => setReady(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

function SlidePlaceholder({ title, pulse }: { title: string; pulse?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-gradient-to-br from-muted/60 to-muted",
        pulse && "animate-pulse"
      )}
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Play className="size-6 translate-x-0.5 fill-primary/60 text-primary/60" />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
    </div>
  );
}

export default function HeroShowcase({ className }: { className?: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);
  // Indices whose media has been activated at least once — kept mounted afterwards.
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Defer the very first video load until the showcase scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    const index = api.selectedScrollSnap();
    setSelected(index);
    setMounted((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const current = ITEMS[selected];

  return (
    <div ref={sectionRef} className={cn("w-full", className)}>
      {/* Small header above the media */}
      <div className="mb-5 flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            See it in action
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold text-foreground sm:text-xl">
            {current.title}
          </h3>
          <p className="mt-0.5 hidden truncate text-sm text-muted-foreground sm:block">
            {current.caption}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-1 hidden text-sm tabular-nums text-muted-foreground sm:inline">
            {selected + 1} / {ITEMS.length}
          </span>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous demo"
            className="flex size-9 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next demo"
            className="flex size-9 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Media frame */}
      <div
        className="overflow-hidden rounded-xl border bg-muted/40 shadow-lg"
        ref={emblaRef}
      >
        <div className="flex">
          {ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="relative aspect-video min-w-0 shrink-0 grow-0 basis-full"
            >
              {item.type === "video" ? (
                <VideoSlide
                  item={item}
                  active={selected === index}
                  mounted={inView && mounted.has(index)}
                />
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {ITEMS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to ${item.title}`}
            aria-current={selected === index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              selected === index
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
