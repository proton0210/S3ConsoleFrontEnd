import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch("https://api.polar.sh/api/v1/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POLAR_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: process.env.POLAR_PRODUCT_ID,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/downloads/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/downloads/cancel`,
      userId,
    }),
  });

  if (!res.ok) {
    console.error("Polar API error", await res.text());
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ url: data.url });
}
