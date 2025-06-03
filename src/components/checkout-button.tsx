"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

export default function CheckoutButton() {
  const { userId } = useAuth();

  const handleClick = async () => {
    const res = await fetch(
      `/api/polar/checkout?products=d73f8220-66f4-45ee-8e7d-95ed4c877090`,
      {
        method: "GET",
      }
    );
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
