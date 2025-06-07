"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

interface CheckoutButtonProps {
  onClick?: () => void;
}

export default function CheckoutButton({ onClick }: CheckoutButtonProps) {
  const { userId } = useAuth();

  return (
    <Button size="lg" onClick={onClick}>
      Purchase S3Console
    </Button>
  );
}
