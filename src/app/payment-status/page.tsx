/**
 * /payment-status — single canonical post-payment page.
 *
 * Dodo redirects here after a checkout (return_url from /api/dodo/create-checkout).
 * Reads `?status=succeeded|failed|processing` as an optimistic hint, then polls
 * /api/payment-success until the webhook has confirmed the row is paid OR the
 * polling window times out — at which point we surface a recovery card with
 * refresh + support actions instead of a frozen spinner.
 *
 * Replaces the previous duplicate `/success` page (deleted; the only writer of
 * paid status is the webhook → /api/payment-success is read-only).
 */
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import confetti from "canvas-confetti";
import {
  FaCheck,
  FaCrown,
  FaExclamationTriangle,
  FaSpinner,
  FaEnvelope,
  FaSyncAlt,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Header from "@/components/sections/header";

type UiPhase =
  | "loading" // resolving Clerk session
  | "processing" // optimistic: payment may be in flight, polling
  | "succeeded" // verified paid by webhook
  | "failed" // Dodo reported failure
  | "timeout"; // polled the full window, still no webhook write

interface VerifiedLicense {
  key?: string;
  tier?: "monthly" | "yearly" | "lifetime";
  validUntil?: number | null;
  subscriptionStatus?: string;
  licenseCount?: number;
}

// Polling cadence — fast at first to feel responsive, then back off to limit
// API load. 30s of 2-second polling + 2.5min of 5-second polling = 3 min total.
const FAST_INTERVAL_MS = 2_000;
const SLOW_INTERVAL_MS = 5_000;
const FAST_WINDOW_MS = 30_000;
const TOTAL_TIMEOUT_MS = 3 * 60_000;
// Safety net: if Clerk's auth hooks haven't resolved within this window, stop
// showing a bare spinner and flip to the recovery UI so the user has actions
// (refresh, billing dashboard, email support).
const LOADING_FALLBACK_MS = 15_000;

const SUPPORT_EMAIL = "vidit@serverlesscreed.com";

export default function PaymentStatusPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <FaSpinner className="h-8 w-8 animate-spin text-primary" />
          </main>
        }
      >
        <PaymentStatusContent />
      </Suspense>
    </>
  );
}

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `useAuth` resolves the session (userId); `useUser` resolves the profile
  // (email). They are SEPARATE round-trips — there is a window where
  // authLoaded=true and userId is set, but user is still null. Treat the page
  // as "loading" until BOTH are ready so we never flash a wrong state.
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const statusParam = (searchParams.get("status") || "").toLowerCase();
  const paymentIdParam = searchParams.get("payment_id");
  // Derive email outside the effect so the effect dep is a stable primitive,
  // not the whole `user` object (which Clerk re-emits on token refreshes).
  const email = user?.primaryEmailAddress?.emailAddress;

  const [phase, setPhase] = useState<UiPhase>("loading");
  const [license, setLicense] = useState<VerifiedLicense | null>(null);
  const confettiFired = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Safety net: if Clerk never loads in a reasonable time, leave the spinner
  // and surface the recovery UI so the user has actions.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => {
      setPhase((current) => (current === "loading" ? "timeout" : current));
    }, LOADING_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Fire confetti exactly once when we cross into the verified-succeeded state.
  useEffect(() => {
    if (phase !== "succeeded" || confettiFired.current) return;
    confettiFired.current = true;
    try {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
      }, 250);
    } catch {
      // canvas-confetti is best-effort; never break the page over it.
    }
  }, [phase]);

  // Polling loop.
  useEffect(() => {
    // Wait for Clerk to fully resolve BOTH the session (auth) and the profile
    // (user). If we proceed on authLoaded alone, there's a window where
    // userId is set but user is still null — we'd see email=undefined and
    // wrongly flip to the timeout state for a few hundred ms.
    if (!authLoaded || !userLoaded) return;

    // Honor Dodo's hard-fail hint immediately — no point polling.
    if (statusParam === "failed") {
      setPhase("failed");
      return;
    }

    // Signed out → can't poll. Send them to sign-in with a return-to.
    if (!userId) {
      router.replace("/sign-in?redirect_url=/payment-status");
      return;
    }

    if (!email) {
      // Clerk fully loaded but no primary email on this account — genuinely
      // unrecoverable from this page; surface the timeout/recovery UI.
      setPhase("timeout");
      return;
    }

    setPhase("processing");
    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();

    const pollOnce = async (): Promise<boolean> => {
      const resp = await fetch("/api/payment-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      if (data?.status === "paid" && data?.userData?.paid) {
        setLicense({
          key: data.userData.key,
          tier: data.userData.tier,
          validUntil: data.userData.validUntil ?? null,
          subscriptionStatus: data.userData.subscriptionStatus,
          licenseCount: data.userData.licenseCount,
        });
        setPhase("succeeded");
        return true;
      }
      return false;
    };

    const loop = async () => {
      while (Date.now() - startedAt < TOTAL_TIMEOUT_MS) {
        if (controller.signal.aborted) return;
        let confirmed = false;
        try {
          confirmed = await pollOnce();
        } catch (err: any) {
          if (err?.name === "AbortError") return;
          // Network blip — swallow and retry on the next tick.
        }
        if (confirmed) return;
        const elapsed = Date.now() - startedAt;
        const wait = elapsed < FAST_WINDOW_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
        await new Promise((r) => setTimeout(r, wait));
      }
      if (!controller.signal.aborted) setPhase("timeout");
    };

    void loop();

    return () => {
      controller.abort();
    };
  }, [authLoaded, userLoaded, userId, email, statusParam, router]);

  if (phase === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (phase === "failed") {
    return (
      <Wrapper accent="rose">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full mb-6">
          <FaExclamationTriangle className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Payment didn't go through
        </h1>
        <p className="text-slate-600 mb-8">
          Your card or UPI wasn't charged. You can try a different payment
          method, or reach out and we'll help sort it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => router.push("/pricing")}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Try again
          </Button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Payment%20failed%20on%20S3Console`}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-primary underline"
          >
            <FaEnvelope className="h-3.5 w-3.5" /> Contact support
          </a>
        </div>
      </Wrapper>
    );
  }

  if (phase === "timeout") {
    return (
      <Wrapper accent="amber">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
          <FaExclamationTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Still confirming your payment
        </h1>
        <p className="text-slate-600 mb-2">
          Dodo took longer than expected to confirm. Your card may have been
          charged successfully — we just haven't received confirmation yet.
        </p>
        <p className="text-slate-600 mb-8">
          We've sent your license key to your email. If you don't see it within
          a few minutes, reach out and we'll get it to you immediately.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <FaSyncAlt className="mr-2 h-4 w-4" />
            Refresh status
          </Button>
          <Link
            href="/account/billing"
            className="inline-flex items-center text-sm text-slate-700 hover:text-primary underline"
          >
            View billing dashboard
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              paymentIdParam
                ? `Payment pending on S3Console (payment_id=${paymentIdParam})`
                : "Payment pending on S3Console"
            )}`}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-primary underline"
          >
            <FaEnvelope className="h-3.5 w-3.5" /> Email support
          </a>
        </div>
      </Wrapper>
    );
  }

  if (phase === "succeeded" && license) {
    return (
      <Wrapper accent="green">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <FaCheck className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Payment successful
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Thank you for upgrading to S3Console Pro. Your account is active.
        </p>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8 text-left">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaCrown className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-slate-900">
              {license.tier
                ? `${capitalize(license.tier)} plan`
                : "Pro license"}{" "}
              · Active
            </span>
          </div>
          {license.key && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                License key
              </p>
              <p className="font-mono text-sm text-slate-900 break-all">
                {license.key}
              </p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            Activate on your machine
          </p>
          <ol className="text-sm text-amber-800 list-decimal list-inside space-y-1">
            <li>Open the S3Console desktop app</li>
            <li>Enter your email and the license key above</li>
            <li>You can activate up to {license.licenseCount ?? 2} machines with the same key</li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => router.push("/downloads")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Open downloads
          </Button>
          <Link
            href="/account/billing"
            className="inline-flex items-center text-sm text-slate-700 hover:text-primary underline"
          >
            View billing
          </Link>
        </div>
      </Wrapper>
    );
  }

  // phase === "processing" — show spinner + reassuring optimistic copy.
  // If Dodo told us status=succeeded we tone the language up; otherwise more
  // neutral.
  const looksGood = statusParam === "succeeded";
  return (
    <Wrapper accent="slate">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
        <FaSpinner className="h-7 w-7 animate-spin text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">
        {looksGood ? "Payment received — finalizing…" : "Confirming your payment…"}
      </h1>
      <p className="text-slate-600 mb-2">
        {looksGood
          ? "Dodo confirmed the charge. We're waiting for the activation webhook."
          : "We're checking with Dodo. This usually takes a few seconds."}
      </p>
      <p className="text-sm text-slate-500">
        You can leave this page open — we'll update it the moment we hear back.
      </p>
    </Wrapper>
  );
}

function Wrapper({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: "green" | "rose" | "amber" | "slate";
}) {
  const bgClass: Record<typeof accent, string> = {
    green: "from-green-50 to-green-100",
    rose: "from-rose-50 to-rose-100",
    amber: "from-amber-50 to-amber-100",
    slate: "from-slate-50 to-slate-100",
  };
  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgClass[accent]} px-4 py-16`}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-12 max-w-2xl w-full mx-auto text-center">
        {children}
      </div>
    </main>
  );
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
