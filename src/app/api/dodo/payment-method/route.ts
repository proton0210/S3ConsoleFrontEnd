/**
 * Resolve the payment method behind an in-flight Dodo checkout.
 *
 * Called from /payment-status while the customer is staring at the polling
 * spinner. Dodo's return URL doesn't include payment_method_type, so we look
 * it up server-side from the Dodo payment/subscription record. The page uses
 * it to show method-specific copy ("UPI Autopay — first cycle takes 5–15 min,
 * nothing to do on your end") right from t=0 instead of after a 90s timer.
 *
 * Auth: requires a Clerk session. We don't tie this to a specific email — the
 * payment_id was already exposed to the customer in the return URL, so any
 * signed-in user looking at their own checkout result can read its method.
 *
 * Lookup precedence: payment_id → /payments/{id}, falling back to
 * subscription_id → /subscriptions/{id}. The latter exposes the most-recent
 * payment_method_type on the subscription record.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDodoApiBaseUrl } from "@/lib/dodo";

type DodoPaymentRecord = {
  payment_method?: string | null;
  payment_method_type?: string | null;
  status?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentId = req.nextUrl.searchParams.get("payment_id");
    const subscriptionId = req.nextUrl.searchParams.get("subscription_id");
    if (!paymentId && !subscriptionId) {
      return NextResponse.json(
        { error: "Missing payment_id or subscription_id" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      console.error("[payment-method] DODO_API_KEY not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const baseUrl = getDodoApiBaseUrl();
    const url = paymentId
      ? `${baseUrl}/payments/${encodeURIComponent(paymentId)}`
      : `${baseUrl}/subscriptions/${encodeURIComponent(subscriptionId!)}`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    const data = (await resp.json().catch(() => ({}))) as DodoPaymentRecord;

    if (!resp.ok) {
      // Don't 5xx the page — return null so the UI just falls back to its
      // subscription_id-based heuristic. Dodo occasionally 404s a payment_id
      // for a few seconds right after creation.
      console.warn("[payment-method] Dodo lookup non-OK", {
        status: resp.status,
        usingSubscriptionId: !paymentId,
        message: (data as { message?: string })?.message,
      });
      return NextResponse.json(
        { paymentMethodType: null, paymentStatus: null },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const methodType =
      (typeof data.payment_method_type === "string" && data.payment_method_type) ||
      (typeof data.payment_method === "string" && data.payment_method) ||
      null;

    return NextResponse.json(
      {
        paymentMethodType: methodType,
        paymentStatus: data.status ?? null,
      },
      {
        status: 200,
        // The customer's method on a given payment never changes after the
        // fact, so a short browser cache is safe and avoids re-hitting Dodo
        // on every poll. The page also caches in memory, so this is belt +
        // suspenders.
        headers: { "Cache-Control": "private, max-age=60" },
      }
    );
  } catch (err: any) {
    console.error("[payment-method] unexpected", err);
    return NextResponse.json(
      { paymentMethodType: null, paymentStatus: null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
