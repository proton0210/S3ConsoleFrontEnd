"use client";

/**
 * Reddit Pixel base loader.
 *
 * Injects the official Reddit Pixel bootstrap + `init` + the initial
 * `PageVisit`, then re-fires `PageVisit` on every client-side route change so
 * SPA navigations are counted (the raw snippet alone only fires once on hard
 * load). Conversion events are fired from call sites via `trackReddit()`
 * (see lib/reddit.ts).
 *
 * Uses only `usePathname` (no `useSearchParams`) so it does NOT force a
 * Suspense boundary or opt the tree out of static rendering.
 */

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { REDDIT_PIXEL_ID } from "@/lib/reddit";

export function RedditPixel() {
  const pathname = usePathname();
  // The inline snippet fires the first PageVisit on hard load; skip the
  // mount run here so we don't double-count it, then track every subsequent
  // route change.
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window === "undefined" || typeof window.rdt !== "function") return;
    window.rdt("track", "PageVisit");
  }, [pathname]);

  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${REDDIT_PIXEL_ID}');rdt('track','PageVisit');`}
    </Script>
  );
}
