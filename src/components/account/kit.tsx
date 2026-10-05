/**
 * Account & billing UI kit — the shared building blocks for /account/*,
 * /buy and /payment-status.
 *
 * Kept identical between Tables and Buckets: brand differences come from the
 * `--acct-*` tokens and `.acct-title-accent` in each site's globals.css, so a
 * change here can be copied across verbatim.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = React.ElementType;

/* ── Page frame ─────────────────────────────────────────────────────────── */

/** Width + vertical rhythm shared by every account page. */
export function AccountMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn("relative isolate", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--acct-accent)/0.10),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">{children}</div>
    </main>
  );
}

/**
 * Page title block. `children` render on the right (actions) — passed as
 * children rather than a prop so they stay part of the element tree.
 */
export function AccountHeader({
  title,
  accent,
  description,
  children,
}: {
  title: string;
  /** Word(s) appended to the title in the brand accent style. */
  accent?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
          {title}
          {accent && <> <span className="acct-title-accent">{accent}</span></>}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}

/* ── Surfaces ───────────────────────────────────────────────────────────── */

export function Panel({
  children,
  className,
  as: As = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "aside" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_32px_-20px_hsl(var(--foreground)/0.18)]", className)} {...rest}>
      {children}
    </As>
  );
}

export function PanelHeader({
  icon: Icon,
  title,
  description,
  children,
  id,
}: {
  icon?: IconType;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions. */
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="text-[15px] font-semibold leading-6 text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Section heading between panels. */
export function SectionTitle({ id, title, description, children }: { id?: string; title: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="scroll-mt-24 text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Feedback ───────────────────────────────────────────────────────────── */

const NOTICE_TONES = {
  neutral: { icon: "text-muted-foreground bg-muted", ring: "border-border" },
  success: { icon: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300", ring: "border-emerald-500/25" },
  warning: { icon: "text-amber-700 bg-amber-500/10 dark:text-amber-300", ring: "border-amber-500/35" },
  danger: { icon: "text-red-700 bg-red-500/10 dark:text-red-300", ring: "border-red-500/30" },
  brand: { icon: "text-[hsl(var(--acct-accent-ink))] bg-[hsl(var(--acct-accent)/0.10)]", ring: "border-[hsl(var(--acct-accent)/0.28)]" },
} as const;
export type NoticeTone = keyof typeof NOTICE_TONES;

export function Notice({
  tone = "neutral",
  icon: Icon,
  title,
  children,
  action,
  onDismiss,
}: {
  tone?: NoticeTone;
  icon: IconType;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}) {
  const reduce = useReducedMotion();
  const t = NOTICE_TONES[tone];
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex flex-col gap-3 rounded-2xl border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:px-5", t.ring)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn("mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6 text-foreground">{title}</p>
          {children && <div className="text-sm leading-6 text-muted-foreground">{children}</div>}
        </div>
      </div>
      {(action || onDismiss) && (
        <div className="flex shrink-0 items-center gap-2 pl-10 sm:pl-0">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** Animated stack for notices; empty when nothing to say. */
export function NoticeStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 empty:hidden">
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  );
}

const BADGE_TONES = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-300",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-[hsl(var(--acct-accent)/0.12)] text-[hsl(var(--acct-accent-ink))]",
  // Variants for use on the dark plan hero
  "hero-success": "bg-emerald-400/15 text-emerald-200",
  "hero-warning": "bg-amber-400/20 text-amber-200",
  "hero-danger": "bg-red-500/20 text-red-200",
  "hero-neutral": "bg-white/10 text-white/75",
  "hero-brand": "bg-[hsl(var(--acct-hero-accent))] text-[hsl(var(--acct-hero))]",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

export function StatusBadge({ tone = "neutral", icon: Icon, dot, children, className }: {
  tone?: BadgeTone;
  icon?: IconType;
  /** Small pulsing-free status dot instead of an icon. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", BADGE_TONES[tone], className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/* ── Data display ───────────────────────────────────────────────────────── */

/** Segmented usage meter, e.g. "1 of 2 devices". */
export function Meter({ used, total, label, onDark = false, className }: {
  used: number;
  total: number;
  label: string;
  onDark?: boolean;
  className?: string;
}) {
  const segments = Math.max(1, Math.min(total, 12));
  const filled = Math.min(used, total);
  const full = total > 0 && used >= total;
  return (
    <div className={className}>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
        className="flex gap-1"
      >
        {total <= 12
          ? Array.from({ length: segments }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-500",
                  i < filled
                    ? full ? (onDark ? "bg-amber-300" : "bg-amber-500") : "bg-[hsl(var(--acct-accent))]"
                    : onDark ? "bg-white/15" : "bg-muted"
                )}
              />
            ))
          : (
            <span className={cn("relative h-1.5 flex-1 overflow-hidden rounded-full", onDark ? "bg-white/15" : "bg-muted")}>
              <span className={cn("absolute inset-y-0 left-0 rounded-full", full ? "bg-amber-500" : "bg-[hsl(var(--acct-accent))]")} style={{ width: `${(filled / total) * 100}%` }} />
            </span>
          )}
      </div>
    </div>
  );
}

export function Fact({ label, children, hint, onDark = false, className }: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className={cn("text-[11px] font-medium uppercase tracking-[0.14em]", onDark ? "text-white/50" : "text-muted-foreground")}>{label}</dt>
      <dd className={cn("mt-1.5 text-[15px] font-medium leading-6", onDark ? "text-[hsl(var(--acct-hero-fg))]" : "text-foreground")}>{children}</dd>
      {hint && <dd className={cn("mt-0.5 text-xs leading-5", onDark ? "text-white/55" : "text-muted-foreground")}>{hint}</dd>}
    </div>
  );
}

export function CopyField({ value, label = "Copy", onDark = false, className }: {
  value: string;
  label?: string;
  onDark?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border py-1.5 pl-3.5 pr-1.5",
        onDark ? "border-white/10 bg-white/[0.04]" : "border-border bg-muted/50",
        className
      )}
    >
      <code className={cn("min-w-0 flex-1 truncate font-mono text-[13px] tracking-tight", onDark ? "text-white/85" : "text-foreground")}>{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard blocked — the value is still selectable */
          }
        }}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
          onDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-background hover:text-foreground"
        )}
        aria-label={copied ? "Copied" : label}
      >
        {copied ? <Check className={cn("h-3.5 w-3.5", onDark ? "text-emerald-300" : "text-emerald-600")} aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}

/* ── Navigation tiles & empty states ───────────────────────────────────── */

/**
 * A tappable row that leads somewhere (a page, the billing portal, email).
 * Renders a Link for internal routes, an <a> for external ones and a button
 * for callbacks.
 */
export function ActionTile({ icon: Icon, title, description, href, external, onClick, disabled, busy, trailing }: {
  icon: IconType;
  title: string;
  description: React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  trailing?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))] transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{description}</span>
      </span>
      {trailing}
    </>
  );
  const cls = cn(
    "group flex w-full items-center gap-3.5 rounded-2xl border border-border bg-card p-4 text-left shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] transition-all duration-200",
    disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-px hover:border-[hsl(var(--acct-accent)/0.35)] hover:shadow-[0_14px_30px_-18px_hsl(var(--foreground)/0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    busy && "opacity-80"
  );
  if (href && !disabled) {
    return external
      ? <a href={href} className={cls}>{body}</a>
      : <Link href={href} className={cls}>{body}</Link>;
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} className={cls}>
      {body}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, children, actions }: {
  icon: IconType;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Panel className="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--acct-accent)/0.16),transparent)]" />
      <div className="relative mx-auto max-w-md">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--acct-accent)/0.10)] text-[hsl(var(--acct-accent-ink))]">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {children && <div className="mt-2 text-[15px] leading-7 text-muted-foreground">{children}</div>}
        {actions && <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>}
      </div>
    </Panel>
  );
}

/* ── Formatting ─────────────────────────────────────────────────────────── */

export function formatDate(ms?: number | null): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

/** "in 24 days", "tomorrow", "3 days ago" — for hints under dates. */
export function relativeDays(ms: number | null | undefined, now = Date.now()): string | null {
  if (!ms) return null;
  const days = Math.round((ms - now) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1 && days < 60) return `in ${days} days`;
  if (days < -1 && days > -60) return `${-days} days ago`;
  return null;
}

/** Initials avatar for an email address. */
export function Avatar({ email, className }: { email: string; className?: string }) {
  const name = email.split("@")[0] ?? email;
  const parts = name.split(/[._-]+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "?";
  return (
    <span aria-hidden className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--acct-accent)/0.12)] text-xs font-semibold text-[hsl(var(--acct-accent-ink))]", className)}>
      {initials}
    </span>
  );
}
