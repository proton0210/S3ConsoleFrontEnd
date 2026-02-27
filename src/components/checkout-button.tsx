"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { FaCrown, FaSpinner } from "react-icons/fa";

interface CheckoutButtonProps {
  text?: string;
  className?: string;
  quantity?: number;
  productId?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function CheckoutButton({
  text = "Purchase S3Console",
  className,
  quantity = 1,
  productId,
  variant = "default"
}: CheckoutButtonProps) {
  const { userId } = useAuth();
  const posthog = usePostHog();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const resolvedProductId = productId || "pdt_HAAaTSsGKpgkDFzHYprZM";

      posthog.capture('checkout_initiated', {
        productId: resolvedProductId,
        quantity: quantity,
        userId: userId,
        location: 'checkout_button'
      });

      // Get user email from Clerk if needed, but usually backend handles it via userId
      // or we fetch it from user-data endpoint if we want to be sure.
      // For now, we'll rely on the create-checkout endpoint.

      const resp = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: resolvedProductId,
          quantity: quantity,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.checkout_url) {
        throw new Error(data?.error || "Failed to create checkout session");
      }

      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FaCrown className="mr-2 h-4 w-4" />
      )}
      {loading ? "Processing..." : text}
    </Button>
  );
}
