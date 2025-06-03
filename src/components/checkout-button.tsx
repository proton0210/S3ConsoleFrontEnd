"use client";
import { Button } from "@/components/ui/button";

export default function CheckoutButton() {
  const handleClick = async () => {
    const res = await fetch("/api/polar/checkout", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }
  };

  return (
    <Button size="lg" onClick={handleClick}>
      Buy LifeTime Access now
    </Button>
  );
}
