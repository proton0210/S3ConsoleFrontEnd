import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Real Buckets app screenshots live in /public/product as a light and a
 * dark pair. They were captured from the desktop app's E2E mock mode with
 * sample data (no real AWS accounts). This renders the pair and lets the
 * site's theme decide which one is visible, so the product always matches
 * the page around it.
 */
export const PRODUCT_SHOTS = {
  workspace: { w: 2880, h: 1800, alt: "Buckets desktop app browsing the reports folder of an S3 bucket" },
  profiles: { w: 562, h: 1090, alt: "Buckets profile switcher listing saved AWS accounts, SSO and access key profiles" },
  palette: { w: 1280, h: 1068, alt: "Buckets command palette with actions for the selected bucket and object" },
  timetravel: { w: 2048, h: 1156, alt: "Buckets Time Travel dialog showing a bucket snapshot and restore option" },
  dropzones: { w: 1320, h: 800, alt: "Buckets Drop Zone form with destination prefix, expiry and file type options" },
  inspector: { w: 868, h: 728, alt: "Buckets object inspector with S3 URI, HTTPS URL, ARN and a presign button" },
} as const;

export type ProductShotName = keyof typeof PRODUCT_SHOTS;

export function ProductShot({
  name,
  className,
  imgClassName,
  priority,
  sizes = "(max-width: 768px) 100vw, 1200px",
}: {
  name: ProductShotName;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const shot = PRODUCT_SHOTS[name];
  const common = {
    width: shot.w,
    height: shot.h,
    sizes,
    priority,
    quality: 90,
  };
  return (
    <div className={cn("relative", className)}>
      <Image
        {...common}
        src={`/product/${name}-light.webp`}
        alt={shot.alt}
        className={cn("block h-auto w-full dark:hidden", imgClassName)}
      />
      <Image
        {...common}
        src={`/product/${name}-dark.webp`}
        alt={shot.alt}
        className={cn("hidden h-auto w-full dark:block", imgClassName)}
      />
    </div>
  );
}
