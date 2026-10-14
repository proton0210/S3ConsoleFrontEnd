"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Bento card shared by the homepage feature grids: eyebrow, title and body,
 * with an optional visual that sits below (stack) or beside (split) the copy.
 */
export function Card({
  className,
  icon,
  eyebrow,
  title,
  body,
  note,
  children,
  index,
  layout = "stack",
  splitClassName = "md:grid-cols-2",
}: {
  className?: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  /** Inline content only: it renders inside a <p>. */
  body: ReactNode;
  /** A short limit or scope line under the body (e.g. "AWS connections only"). */
  note?: ReactNode;
  children?: ReactNode;
  index: number;
  layout?: "stack" | "split";
  /** Column template for the split layout from md up. */
  splitClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: EASE_OUT }}
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
          layout === "split" && cn("gap-8 md:grid md:items-end", splitClassName)
        )}
      >
        <div className={cn(layout === "split" && "md:self-center")}>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {icon}
            {eyebrow}
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
          <p className="mt-2 max-w-md text-[15px] leading-7 text-muted-foreground">{body}</p>
          {note && <p className="mt-3 max-w-md text-[13px] leading-6 text-muted-foreground">{note}</p>}
        </div>
        {children && (
          <div
            className={cn(
              "relative flex flex-1 flex-col justify-end",
              layout === "split" ? "md:block" : "mt-6"
            )}
          >
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
export function Bleed({
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
