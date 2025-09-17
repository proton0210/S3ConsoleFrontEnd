"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function PaymentStatusPage() {
  const [status, setStatus] = useState<"processing" | "succeeded" | "error">(
    "processing"
  );
  const finalizedRef = useRef(false);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      try {
        const allowedOrigins = ["https://live.dodopayments.com"];
        if (!allowedOrigins.includes(String(event.origin))) return;

        const type = (event?.data && (event.data.type || event.data?.event_type)) as string | undefined;
        if (type !== "dodo-payment-success") return;
        if (finalizedRef.current) return;
        finalizedRef.current = true;

        // Get current user email
        setStatus("processing");
        const ud = await fetch("/api/user-data", { headers: { "Content-Type": "application/json" } });
        let email: string | undefined;
        if (ud.ok) {
          const j = await ud.json();
          email = j?.userData?.email as string | undefined;
        }
        if (!email) {
          setStatus("error");
          return;
        }

        // Mark payment success
        const resp = await fetch("/api/payment-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!resp.ok) {
          setStatus("error");
          return;
        }

        // Refresh to reflect paid status
        await fetch("/api/user-data", { headers: { "Content-Type": "application/json" } });
        setStatus("succeeded");
        try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch {}
      } catch {
        setStatus("error");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 max-w-md w-full text-center">
        {status === "processing" && <h2 className="text-xl">Processing your payment…</h2>}
        {status === "succeeded" && <h2 className="text-xl text-green-600">Payment Successful!</h2>}
        {status === "error" && <h2 className="text-xl text-red-600">We couldn’t verify the payment.</h2>}
        <div className="mt-6">
          <Button onClick={() => (window.location.href = "/downloads")}>Go to Downloads</Button>
        </div>
      </div>
    </main>
  );
}
