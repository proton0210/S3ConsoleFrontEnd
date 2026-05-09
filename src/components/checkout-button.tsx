"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { FaCrown, FaSpinner } from "react-icons/fa";

type Tier = "monthly" | "yearly" | "lifetime";

interface CheckoutButtonProps {
  text?: string;
  className?: string;
  quantity?: number;
  /** Tier-based checkout (preferred). Maps to env-backed product IDs server-side. */
  tier?: Tier;
  /** Optional pre-fill for the customer's email at Dodo checkout. */
  email?: string;
  /**
   * Legacy direct product ID. Kept for backward compatibility with the
   * seat-add buttons; will be removed in Phase 11 once the seat-add flow is
   * sunset. Do not use for new callers — pass `tier` instead.
   */
  productId?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function CheckoutButton({
  text = "Purchase S3Console",
  className,
  quantity = 1,
  tier,
  email,
  productId,
  variant = "default",
}: CheckoutButtonProps) {
  const { userId } = useAuth();
  const posthog = usePostHog();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      posthog.capture("checkout_initiated", {
        tier,
        productId,
        quantity,
        userId,
        location: "checkout_button",
      });

      // Build request body — prefer tier when available, fall back to productId
      // for legacy callers (seat-add buttons until Phase 11).
      const requestBody: Record<string, unknown> = {};
      if (tier) {
        requestBody.tier = tier;
      } else if (productId) {
        requestBody.productId = productId;
        requestBody.quantity = quantity;
      } else {
        throw new Error("CheckoutButton requires either `tier` or `productId`.");
      }
      if (email) requestBody.email = email;

      const resp = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
