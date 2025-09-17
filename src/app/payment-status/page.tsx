"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

type UiStatus = "processing" | "succeeded" | "failed";

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full h-full p-10 pb-0">
          <div className="bg-white dark:bg-slate-800 rounded-[20px] flex flex-col p-10 max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl mb-6">Payment Status</h1>
            <div className="text-yellow-600">Loading status…</div>
          </div>
        </main>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const finalizeOnce = useRef(false);
  const [uiStatus, setUiStatus] = useState<UiStatus>("processing");

  const statusParam = (searchParams.get("status") || "processing").toLowerCase();

  useEffect(() => {
    if (statusParam === "failed") setUiStatus("failed");
    else if (statusParam === "succeeded") setUiStatus("succeeded");
    else setUiStatus("processing");
  }, [statusParam]);

  useEffect(() => {
    if (statusParam !== "succeeded" || finalizeOnce.current) return;
    finalizeOnce.current = true;

    const run = async () => {
      try {
        const ud = await fetch("/api/user-data", {
          headers: { "Content-Type": "application/json" },
        });
        if (!ud.ok) throw new Error("Unable to load user data");
        const j = await ud.json();
        const email = j?.userData?.email as string | undefined;
        const name = j?.userData?.name as string | undefined;
        if (!email) throw new Error("Missing user email");

        const resp = await fetch("/api/payment-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        });
        if (!resp.ok) throw new Error("Failed to update payment status");

        await fetch("/api/user-data", { headers: { "Content-Type": "application/json" } });
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        } catch {}
      } catch (e) {
        console.error("Finalize error:", e);
      }
    };
    run();
  }, [statusParam]);

  return (
    <main className="w-full h-full p-10 pb-0">
      <div className="bg-white dark:bg-slate-800 rounded-[20px] flex flex-col p-10 max-w-3xl mx-auto text-center">
        <h1 className="font-display text-3xl mb-6">Payment Status</h1>
        {uiStatus === "succeeded" && (
          <div className="text-green-600">Your payment has been processed successfully.</div>
        )}
        {uiStatus === "failed" && (
          <div className="text-red-600">We couldn't process your payment. Please try again.</div>
        )}
        {uiStatus === "processing" && (
          <div className="text-yellow-600">Your payment is being processed…</div>
        )}

        <div className="mt-8">
          <Button onClick={() => (window.location.href = "/downloads")}>Return to Downloads</Button>
        </div>
      </div>
    </main>
  );
}
