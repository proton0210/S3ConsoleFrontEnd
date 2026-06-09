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
import { trackReddit, tierValue } from "@/lib/reddit";

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
// API load. UPI Autopay first-cycle settlement can take up to ~15 min, so we
// poll for 10 min on this page; if the user closes the tab earlier, the
// webhook still writes the row and we email the key.
const FAST_INTERVAL_MS = 2_000;
const SLOW_INTERVAL_MS = 5_000;
const FAST_WINDOW_MS = 30_000;
const TOTAL_TIMEOUT_MS = 10 * 60_000;
// Copy-stage thresholds inside the processing phase. As time passes, we
// gradually shift from "this is fast" → "some methods take a few minutes" →
// "you can safely close this — we'll email you".
const COPY_STAGE_PATIENT_MS = 30_000;
const COPY_STAGE_RELAXED_MS = 90_000;
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
  const subscriptionIdParam = searchParams.get("subscription_id");
  // Dodo's return URL only contains payment_id / subscription_id / status /
  // license_key / email — no payment_method hint. We fetch the method
  // separately (see effect below) and refine the copy when it lands.
  // Derive email outside the effect so the effect dep is a stable primitive,
  // not the whole `user` object (which Clerk re-emits on token refreshes).
  const email = user?.primaryEmailAddress?.emailAddress;

  const [phase, setPhase] = useState<UiPhase>("loading");
  const [license, setLicense] = useState<VerifiedLicense | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  // Method-type as reported by Dodo (e.g. "upi", "card", "netbanking", ...).
  // Loaded asynchronously after mount via /api/dodo/payment-method; null
  // until we know. The processing copy uses this when present.
  const [paymentMethodType, setPaymentMethodType] = useState<string | null>(
    null
  );
  const confettiFired = useRef(false);
  const purchaseTracked = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // While polling, tick a 1-Hz elapsed counter so the processing copy can
  // shift stages without forcing the polling effect to re-run.
  useEffect(() => {
    if (phase !== "processing") return;
    const startedAt = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Look up the payment method server-side so we can show method-specific
  // copy from t=0 (Dodo doesn't include payment_method_type in the return
  // URL — only payment_id, subscription_id, status, license_key, email).
  // Best-effort: 404s and network errors are silently ignored — the UI just
  // falls back to the subscription_id heuristic.
  useEffect(() => {
    if (!paymentIdParam && !subscriptionIdParam) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (paymentIdParam) params.set("payment_id", paymentIdParam);
    else if (subscriptionIdParam)
      params.set("subscription_id", subscriptionIdParam);
    fetch(`/api/dodo/payment-method?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const t = data.paymentMethodType;
        if (typeof t === "string" && t) setPaymentMethodType(t.toLowerCase());
      })
      .catch(() => {
        /* best-effort */
      });
    return () => controller.abort();
  }, [paymentIdParam, subscriptionIdParam]);

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

  // Fire the Reddit Purchase conversion exactly once when the webhook has
  // VERIFIED the payment (phase === "succeeded") — not on Dodo's optimistic
  // redirect hint. This is the revenue event that drives ROAS; value is the
  // tier price and transactionId dedupes against polling / refresh reloads.
  useEffect(() => {
    if (phase !== "succeeded" || purchaseTracked.current) return;
    purchaseTracked.current = true;
    const tier = license?.tier;
    trackReddit("Purchase", {
      currency: "USD",
      value: tierValue(tier),
      itemCount: 1,
      transactionId: paymentIdParam || subscriptionIdParam || undefined,
      products: tier
        ? [{ id: tier, name: `S3Console ${tier} plan` }]
        : undefined,
    });
  }, [phase, license, paymentIdParam, subscriptionIdParam]);

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
          <FaEnvelope className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          We'll email you when it's ready
        </h1>
        <p className="text-slate-600 mb-2">
          Your payment is still settling with your bank — this is normal for
          UPI Autopay and NACH on the first cycle, and can take up to a few
          hours in rare cases.
        </p>
        <p className="text-slate-600 mb-8">
          The moment it lands, your license key goes to{" "}
          {email ? (
            <span className="font-medium text-slate-800">{email}</span>
          ) : (
            "your email"
          )}{" "}
          and appears on your billing dashboard.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <FaSyncAlt className="mr-2 h-4 w-4" />
            Check again
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
            Email support
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

  // phase === "processing" — visual progress + adaptive copy.
  const isSubscription = !!subscriptionIdParam;
  const methodProfile = classifyPaymentMethod(paymentMethodType);
  // If the method is known-slow, skip the "few seconds" promise entirely; if
  // it's known-fast, keep the snappy default. Subscription with unknown
  // method falls between the two — skip the optimistic stage but don't claim
  // the wait will be long.
  const stageOffsetMs =
    methodProfile === "slow"
      ? COPY_STAGE_RELAXED_MS
      : methodProfile === "fast"
        ? 0
        : isSubscription
          ? COPY_STAGE_PATIENT_MS
          : 0;
  const effectiveElapsed = elapsedMs + stageOffsetMs;
  const stage =
    effectiveElapsed < COPY_STAGE_PATIENT_MS
      ? "fast"
      : effectiveElapsed < COPY_STAGE_RELAXED_MS
        ? "patient"
        : "relaxed";

  const methodLabel = methodDisplayName(paymentMethodType);

  const heading =
    stage === "fast"
      ? "Confirming your payment…"
      : stage === "patient"
        ? methodProfile === "slow"
          ? `Settling your ${methodLabel} payment`
          : "Confirming — almost there"
        : methodProfile === "slow"
          ? `${methodLabel} mandate settling with your bank`
          : isSubscription
            ? "Payment received — settling with your bank"
            : "Hang tight — your payment is being processed";

  const subhead =
    stage === "fast"
      ? "We're checking with your bank. This usually takes a few seconds."
      : stage === "patient"
        ? methodProfile === "slow"
          ? `${methodLabel} mandates clear through your bank in 5–15 minutes on the first cycle — nothing to do on your end.`
          : isSubscription
            ? "First-cycle subscription payments settle through your bank in a couple of minutes — this is normal."
            : "Some payment methods settle through your bank in 1–5 minutes — this is normal."
        : methodProfile === "slow"
          ? `${methodLabel} first-cycle settlement can take up to 15 minutes. Your bank is finishing up — we'll email your license the moment it lands.`
          : isSubscription
            ? "UPI Autopay and NACH mandates settle in 5–15 minutes on the first cycle. Nothing to do on your end — your bank takes it from here."
            : "Card 3DS or bank confirmation is taking longer than usual. We're still working on it.";

  return (
    <Wrapper accent="slate">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-primary/15" />
        <FaSpinner className="relative h-8 w-8 animate-spin text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">{heading}</h1>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">{subhead}</p>

      <ProgressStepper />

      {stage === "relaxed" && (
        <div className="mt-8 bg-primary/5 border border-primary/15 rounded-lg p-4 text-left max-w-md mx-auto">
          <p className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <FaEnvelope className="h-3.5 w-3.5 text-primary" />
            Feel free to close this tab
          </p>
          <p className="text-sm text-slate-600">
            We'll email your license key to{" "}
            <span className="font-medium text-slate-800">{email}</span> the
            moment your payment settles. Your license will also appear on the{" "}
            <Link
              href="/account/billing"
              className="text-primary hover:underline"
            >
              billing dashboard
            </Link>
            .
          </p>
        </div>
      )}

      {stage !== "relaxed" && (
        <p className="mt-6 text-sm text-slate-500">
          You can leave this page open — we'll update it the moment we hear back.
        </p>
      )}
    </Wrapper>
  );
}

function ProgressStepper() {
  // Three logical steps for the user's mental model: charge → settlement →
  // activation. Step 1 is "done" (Dodo redirected here, so the charge was at
  // least submitted). Step 2 is the live state during processing. Step 3
  // lights up only once we transition out of this phase on success — while
  // processing is showing, step 3 is always the "next" step.
  const steps = [
    { label: "Payment submitted", state: "done" as const },
    { label: "Confirming with bank", state: "active" as const },
    { label: "Activating license", state: "pending" as const },
  ];
  return (
    <ol className="flex items-start justify-between gap-2 max-w-md mx-auto">
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const next = steps[i + 1];
        const leftFilled = prev && (prev.state === "done" || prev.state === "active");
        const rightFilled = s.state === "done" || (s.state === "active" && next);
        return (
        <li
          key={s.label}
          className="flex-1 flex flex-col items-center text-center"
        >
          <div className="relative w-full flex items-center">
            {prev && (
              <span
                className={`absolute right-1/2 left-0 top-1/2 -translate-y-1/2 h-0.5 ${
                  leftFilled ? "bg-primary/70" : "bg-slate-200"
                }`}
                aria-hidden
              />
            )}
            <div
              className={`relative mx-auto z-10 inline-flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                s.state === "done"
                  ? "bg-primary border-primary text-white"
                  : s.state === "active"
                    ? "border-primary text-primary bg-white"
                    : "border-slate-300 text-slate-400 bg-white"
              }`}
            >
              {s.state === "done" ? (
                <FaCheck className="h-3.5 w-3.5" />
              ) : s.state === "active" ? (
                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </div>
            {next && (
              <span
                className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-0.5 ${
                  rightFilled ? "bg-primary/70" : "bg-slate-200"
                }`}
                aria-hidden
              />
            )}
          </div>
          <span
            className={`mt-2 text-xs font-medium ${
              s.state === "done" || s.state === "active"
                ? "text-slate-900"
                : "text-slate-400"
            }`}
          >
            {s.label}
          </span>
        </li>
        );
      })}
    </ol>
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

/**
 * Group Dodo's payment_method_type values into latency profiles. Known-slow
 * methods are those whose first-cycle settlement involves an async mandate
 * (UPI Autopay, NACH); known-fast are direct charges that confirm in seconds.
 * Anything we don't recognize stays "unknown" — the UI then falls back to
 * the subscription_id heuristic for tone.
 */
function classifyPaymentMethod(
  m: string | null
): "fast" | "slow" | "unknown" {
  if (!m) return "unknown";
  const v = m.toLowerCase();
  if (/(upi|nach|autopay|mandate|bank_transfer|netbanking|ach|sepa)/.test(v))
    return "slow";
  if (/(card|credit|debit|paypal|apple_pay|google_pay|wallet)/.test(v))
    return "fast";
  return "unknown";
}

/**
 * Human label for a payment method. Used inline in copy ("Settling your UPI
 * payment"). Defaults to a neutral "payment" so the sentence still scans
 * when the method is unrecognized.
 */
function methodDisplayName(m: string | null): string {
  if (!m) return "payment";
  const v = m.toLowerCase();
  if (v.includes("upi")) return "UPI Autopay";
  if (v.includes("nach")) return "NACH eMandate";
  if (v.includes("netbanking")) return "Net Banking";
  if (v.includes("bank_transfer")) return "Bank Transfer";
  if (v.includes("sepa")) return "SEPA Direct Debit";
  if (v.includes("ach")) return "ACH";
  if (v.includes("card")) return "Card";
  return "payment";
}
