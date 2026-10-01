import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Real Buckets app screenshots live in /public/product as a light and a
 * dark pair. They were captured at 2x from the desktop app (v2.7.41) running
 * in its E2E mock mode with sample data, so no real AWS accounts, keys or
 * customer objects appear. The site's theme decides which one is visible, so
 * the product always matches the page around it.
 */
export const PRODUCT_SHOTS = {
  workspace: {
    w: 3200,
    h: 2000,
    alt: "Buckets desktop app with three AWS account tabs open, browsing an S3 bucket with the object inspector showing S3 URI, HTTPS URL and ARN",
  },
  profiles: {
    w: 560,
    h: 1436,
    alt: "Buckets profile switcher listing saved AWS SSO, CLI and access key accounts",
  },
  palette: {
    w: 1280,
    h: 1068,
    alt: "Buckets command palette with quick actions for the selected bucket and object",
  },
  search: {
    w: 1000,
    h: 804,
    alt: "Buckets search returning six matching objects across four S3 buckets",
  },
  searchall: {
    w: 3200,
    h: 2000,
    alt: "Buckets searching every S3 bucket at once from the top bar",
  },
  timetravel: {
    w: 2048,
    h: 1664,
    alt: "Buckets Time Travel showing an S3 bucket as it was at an earlier point, with restore options",
  },
  dropzones: {
    w: 2296,
    h: 1664,
    alt: "Buckets Drop Zone form with destination prefix, expiry, size limit and allowed file types",
  },
  "dropzones-card": {
    w: 1240,
    h: 520,
    alt: "Buckets Drop Zone form with name, destination prefix and expiry",
  },
  inspector: {
    w: 848,
    h: 1722,
    alt: "Buckets object inspector with S3 URI, HTTPS URL, ARN, presign, tags and permissions",
  },
  home: {
    w: 3200,
    h: 2000,
    alt: "Buckets Command Center with quick actions for browsing, uploading, security and Athena",
  },
  operate: {
    w: 3200,
    h: 2000,
    alt: "Buckets Operate workspace for recovery, transfer tuning, CloudFront delivery and team handoffs",
  },
} as const;

export type ProductShotName = keyof typeof PRODUCT_SHOTS;

export function ProductShot({
  name,
  className,
  imgClassName,
  priority,
  sizes = "(max-width: 768px) 100vw, 1200px",
  decorative = false,
  themed = true,
}: {
  name: ProductShotName;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  /** Purely visual copy (e.g. a dimmed backdrop): hide it from screen readers. */
  decorative?: boolean;
  /** Pages without .theme-scope never show dark, so skip the dark image there. */
  themed?: boolean;
}) {
  const shot = PRODUCT_SHOTS[name];
  const common = {
    width: shot.w,
    height: shot.h,
    sizes,
    quality: 90,
  };
  const alt = decorative ? "" : shot.alt;
  return (
    <div className={cn("relative", className)} aria-hidden={decorative || undefined}>
      <Image
        {...common}
        priority={priority}
        alt={alt}
        src={`/product/${name}-light.webp`}
        className={cn("block h-auto w-full", themed && "dark:hidden", imgClassName)}
      />
      {themed && (
        // Never preload the dark twin: lazy + display:none means it is only
        // fetched when the dark theme is actually showing.
        <Image
          {...common}
          alt={alt}
          src={`/product/${name}-dark.webp`}
          className={cn("hidden h-auto w-full dark:block", imgClassName)}
        />
      )}
    </div>
  );
}
