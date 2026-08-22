"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { useEffect, useState } from "react";
import { RedditPixel } from "@/components/reddit-pixel";

type TrackingConsent = "accepted" | "rejected" | null;

const STORAGE_KEY = "serverlesscreed-tracking-consent-v1";
const X_ADS_PIXEL_ID = "pyshe";

export function ConsentManagedTracking({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState<TrackingConsent>(null);
  const [ready, setReady] = useState(false);
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setConsent(stored === "accepted" || stored === "rejected" ? stored : null);
    setReady(true);
  }, []);

  const choose = (next: Exclude<TrackingConsent, null>) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setConsent(next);
    setShowChoices(false);
  };

  if (!ready) return null;

  return (
    <>
      {consent === "accepted" ? (
        <>
          <GoogleAnalytics gaId={gaId} />
          <RedditPixel />
          <Script id="x-ads-pixel" strategy="afterInteractive">
            {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${X_ADS_PIXEL_ID}');`}
          </Script>
        </>
      ) : null}

      {consent === null || showChoices ? (
        <section
          aria-label="Tracking preferences"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-xl border bg-background p-4 shadow-xl"
        >
          <p className="text-sm font-semibold text-foreground">Privacy choices</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We use optional analytics and advertising pixels to understand visits
            and measure campaigns. Authentication and purchases work without them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Accept optional tracking
            </button>
            <button
              type="button"
              onClick={() => choose("rejected")}
              className="rounded-md border px-4 py-2 text-sm font-medium text-foreground"
            >
              Reject optional tracking
            </button>
            {consent !== null ? (
              <button
                type="button"
                onClick={() => setShowChoices(false)}
                className="px-3 py-2 text-sm text-muted-foreground underline"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setShowChoices(true)}
          className="fixed bottom-3 right-3 z-[90] rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm"
        >
          Privacy choices
        </button>
      )}
    </>
  );
}

