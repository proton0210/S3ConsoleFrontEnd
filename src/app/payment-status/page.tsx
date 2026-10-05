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
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/sections/header";
import { CopyField } from "@/components/account/kit";
import { trackReddit, tierValue } from "@/lib/reddit";
import { clearCheckout } from "@/lib/checkout-client";
import { paymentSignInUrl, waitForNextPoll, fetchPaymentConfirmation } from "@/lib/payment-confirmation";

type UiPhase =
  | "loading" // resolving Clerk session
  | "processing" // optimistic: payment may be in flight, polling
  | "succeeded" // verified paid by webhook
  | "failed" // Dodo reported failure
  | "cancelled" // buyer backed out of the hosted checkout
  | "timeout"; // polled the full window, still no webhook write

interface VerifiedLicense {
  key?: string;
  tier?: "monthly" | "yearly" | "lifetime" | "team";
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

const SUPPORT_EMAIL = "buckets@serverlesscreed.com";

export default function PaymentStatusPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="theme-scope flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background text-foreground">
            <p role="status" className="text-sm text-muted-foreground">Checking your purchase…</p>
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
  const checkoutAttemptId = searchParams.get("checkout_attempt_id");
  const expectedTier = searchParams.get("expected_tier");
  const returnQuery = searchParams.toString();
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

  // While polling, tick a 1-Hz elapsed counter so the processing copy can
  // shift stages without forcing the polling effect to re-run.
  useEffect(() => {
    if (phase !== "processing") return;
    const startedAt = Date.now();
    // Reset the timer when a new external polling lifecycle starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      transactionId: paymentIdParam || subscriptionIdParam || checkoutAttemptId || undefined,
      products: tier
        ? [{ id: tier, name: `Buckets by ServerlessCreed ${tier} plan` }]
        : undefined,
    });
  }, [phase, license, paymentIdParam, subscriptionIdParam, checkoutAttemptId]);

  // This effect owns the external request lifecycle and its visible states.
  /* eslint-disable react-hooks/set-state-in-effect */
  // Polling loop.
  useEffect(() => {
    // Wait for Clerk to fully resolve BOTH the session (auth) and the profile
    // (user). If we proceed on authLoaded alone, there's a window where
    // userId is set but user is still null — we'd see email=undefined and
    // wrongly flip to the timeout state for a few hundred ms.
    if (!authLoaded || !userLoaded) return;

    // Honor Dodo's terminal hints immediately — no point polling. A cancelled
    // checkout never produces a webhook write, so polling would only end on
    // the "couldn't confirm" card ten minutes later.
    if (statusParam === "failed") {
      if (userId) clearCheckout(userId);
      setPhase("failed");
      return;
    }
    if (statusParam === "cancelled" || statusParam === "canceled") {
      if (userId) clearCheckout(userId);
      setPhase("cancelled");
      return;
    }

    // Signed out → can't poll. Send them to sign-in with a return-to.
    if (!userId) {
      router.replace(paymentSignInUrl(returnQuery));
      return;
    }

    if (!email || (!checkoutAttemptId && !paymentIdParam && !subscriptionIdParam)) {
      // Clerk fully loaded but no primary email on this account — genuinely
      // unrecoverable from this page; surface the timeout/recovery UI.
      setPhase("timeout");
      return;
    }

    setLicense(null);
    confettiFired.current = false;
    purchaseTracked.current = false;
    setPhase("processing");
    const controller = new AbortController();
    const startedAt = Date.now();

    const pollOnce = async (): Promise<boolean> => {
      const { response: resp, data } = await fetchPaymentConfirmation(
        { checkoutAttemptId, paymentId: paymentIdParam, subscriptionId: subscriptionIdParam, expectedTier },
        controller.signal,
      );
      if (controller.signal.aborted) return true;
      if (resp.status === 401) {
        router.replace(paymentSignInUrl(returnQuery));
        return true;
      }
      if (resp.status === 400 || resp.status === 403) {
        setPhase("timeout");
        return true;
      }
      if (!resp.ok) return false;
      if (data?.status === "paid" && data?.userData?.paid) {
        clearCheckout(userId);
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
        } catch (err: unknown) {
          if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) return;
          // Network blip — swallow and retry on the next tick.
        }
        if (confirmed) return;
        const elapsed = Date.now() - startedAt;
        const wait = elapsed < FAST_WINDOW_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
        await waitForNextPoll(wait, controller.signal);
      }
      if (!controller.signal.aborted) setPhase("timeout");
    };

    void loop();

    return () => {
      controller.abort();
    };
  }, [authLoaded, userLoaded, userId, email, statusParam, paymentIdParam, subscriptionIdParam, checkoutAttemptId, expectedTier, returnQuery, router]);

  /* eslint-enable react-hooks/set-state-in-effect */

  if (phase === "loading") {
    return (
      <Wrapper>
        <div role="status" aria-label="Loading payment status" className="flex flex-col items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--acct-accent-ink))]" />
          <p className="mt-4 text-sm text-muted-foreground">Checking your purchase…</p>
        </div>
      </Wrapper>
    );
  }

  if (phase === "failed") {
    return (
      <Wrapper>
        <StatusIcon tone="danger"><AlertTriangle className="h-7 w-7" /></StatusIcon>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Payment didn&apos;t go through
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The checkout reported a failure. Check your billing dashboard and
          bank status before retrying, or contact us for help.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/pricing")}>
            Try again<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              "Payment failed on Buckets by ServerlessCreed"
            )}`}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-6 text-[15px] font-medium transition-colors hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> Contact support
          </a>
        </div>
      </Wrapper>
    );
  }

  if (phase === "cancelled") {
    return (
      <Wrapper>
        <StatusIcon tone="warning"><AlertTriangle className="h-7 w-7" /></StatusIcon>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Checkout cancelled
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Nothing was charged. You can pick a plan again whenever you&apos;re ready.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/pricing")}>
            Back to pricing<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link
            href="/account/billing"
            className="inline-flex h-12 items-center rounded-xl border border-input bg-card px-6 text-[15px] font-medium transition-colors hover:bg-muted"
          >
            View billing dashboard
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (phase === "timeout") {
    return (
      <Wrapper>
        <StatusIcon tone="warning"><Clock className="h-7 w-7" /></StatusIcon>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          We couldn&apos;t confirm this purchase yet
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Payment confirmation or license activation may still be processing.
          You can check again or view your current license on the billing dashboard.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Once payment and activation are confirmed, your license key goes to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}{" "}
          and appears on your billing dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Check again
          </Button>
          <Link
            href="/account/billing"
            className="inline-flex h-12 items-center rounded-xl border border-input bg-card px-6 text-[15px] font-medium transition-colors hover:bg-muted"
          >
            View billing dashboard
          </Link>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
            paymentIdParam
              ? `Payment pending on Buckets by ServerlessCreed (payment_id=${paymentIdParam})`
              : "Payment pending on Buckets by ServerlessCreed"
          )}`}
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Mail className="h-3.5 w-3.5" />Email support
        </a>
      </Wrapper>
    );
  }

  if (phase === "succeeded" && license) {
    return (
      <Wrapper>
        <StatusIcon tone="success"><Check className="h-8 w-8" /></StatusIcon>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          You&apos;re all set
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Payment confirmed — thank you for choosing Buckets by ServerlessCreed.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {license.tier ? `Buckets ${capitalize(license.tier)}` : "Buckets Pro"}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />Active
            </span>
          </div>
          {license.key && (
            <div className="mt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">License key</p>
              <CopyField value={license.key} label="Copy license key" className="mt-1.5 bg-card" />
            </div>
          )}
        </div>

        {license.tier === "team" && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[hsl(var(--acct-accent)/0.3)] bg-[hsl(var(--acct-accent)/0.06)] p-5 text-left">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--acct-accent-ink))]" />
            <div>
              <p className="text-sm font-semibold">Your team is ready — invite your members</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                You hold the first seat. Invite teammates by email from the team
                dashboard — each gets their own license key, valid on up to 2
                machines, delivered straight to their inbox.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-border p-5 text-left text-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Activate on your machine</p>
          <ol className="mt-3 space-y-3">
            {[
              "Open the Buckets desktop app",
              "Enter your email and the license key above",
              `Activate up to ${license.licenseCount ?? 2} machines with the same key`,
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--acct-accent)/0.12)] text-xs font-semibold text-[hsl(var(--acct-accent-ink))]">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {license.tier === "team" ? (
            <Button size="lg" onClick={() => router.push("/account/team")}>
              <Users className="mr-2 h-4 w-4" />Invite your team
            </Button>
          ) : (
            <Button size="lg" onClick={() => router.push("/downloads")}>
              <Download className="mr-2 h-4 w-4" />Open downloads
            </Button>
          )}
          {license.tier === "team" && (
            <Link
              href="/downloads"
              className="inline-flex h-12 items-center rounded-xl border border-input bg-card px-6 text-[15px] font-medium transition-colors hover:bg-muted"
            >
              Downloads
            </Link>
          )}
          <Link
            href="/account/billing"
            className="inline-flex h-12 items-center rounded-xl px-4 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
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
            ? "Waiting for payment confirmation"
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
    <Wrapper>
      <div className="relative mx-auto inline-flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--acct-accent)/0.12)] motion-reduce:animate-none" />
        <span className="absolute inset-2 rounded-full bg-[hsl(var(--acct-accent)/0.14)]" />
        <Loader2 className="relative h-8 w-8 animate-spin text-[hsl(var(--acct-accent-ink))]" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight" aria-live="polite">{heading}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">{subhead}</p>

      <ProgressStepper />

      {stage === "relaxed" && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[hsl(var(--acct-accent)/0.25)] bg-[hsl(var(--acct-accent)/0.05)] p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Mail className="h-4 w-4 text-[hsl(var(--acct-accent-ink))]" />
            Feel free to close this tab
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            We&apos;ll email your license key to{" "}
            <span className="font-medium text-foreground">{email}</span> the
            moment your payment settles. Your license will also appear on the{" "}
            <Link href="/account/billing" className="font-medium text-foreground underline underline-offset-2">
              billing dashboard
            </Link>
            .
          </p>
        </div>
      )}

      {stage !== "relaxed" && (
        <p className="mt-8 text-sm text-muted-foreground">
          You can leave this page open — we&apos;ll update it the moment we hear back.
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
    <ol className="mx-auto mt-10 flex max-w-md items-start justify-between gap-2">
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const next = steps[i + 1];
        const leftFilled = prev && (prev.state === "done" || prev.state === "active");
        const rightFilled = s.state === "done" || (s.state === "active" && next);
        return (
          <li key={s.label} className="flex flex-1 flex-col items-center text-center">
            <div className="relative flex w-full items-center">
              {prev && (
                <span
                  className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${leftFilled ? "bg-[hsl(var(--acct-accent)/0.7)]" : "bg-border"}`}
                  aria-hidden
                />
              )}
              <div
                className={`relative z-10 mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  s.state === "done"
                    ? "border-[hsl(var(--acct-accent))] bg-[hsl(var(--acct-accent))] text-white"
                    : s.state === "active"
                      ? "border-[hsl(var(--acct-accent))] bg-card text-[hsl(var(--acct-accent-ink))]"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {s.state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : s.state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </div>
              {next && (
                <span
                  className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${rightFilled ? "bg-[hsl(var(--acct-accent)/0.7)]" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </div>
            <span className={`mt-2 text-xs font-medium ${s.state === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StatusIcon({ tone, children }: { tone: "success" | "danger" | "warning"; children: React.ReactNode }) {
  const tones = {
    success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    danger: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
    warning: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  } as const;
  return (
    <span className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-8 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="theme-scope relative isolate flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--acct-accent)/0.12),transparent_70%)]" />
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_30px_60px_-30px_hsl(var(--foreground)/0.25)] sm:p-12">
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
