import { NextRequest, NextResponse } from "next/server";

type CreateCheckoutBody = {
  productId?: string;
  quantity?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { productId, quantity }: CreateCheckoutBody = await req.json();

    const token =
      "VEtp9hW3wxisLkpT.k9FiYOoxLSj_kYXYOB4-LwsoU5aYMyyj2BPzOut7buHd5VaV";
    if (!token) {
      return NextResponse.json(
        { error: "Missing DODO_API_KEY server env" },
        { status: 500 }
      );
    }

    const chosenProductId =
      productId || process.env.DODO_PRODUCT_ID || "pdt_HAAaTSsGKpgkDFzHYprZM"; // default product

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl?.origin || "";

    const payload = {
      product_cart: [
        {
          product_id: chosenProductId,
          quantity: Math.max(1, Number(quantity) || 1),
        },
      ],
      return_url: `${origin}/payment-status`,
    } as const;

    const resp = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Failed to create checkout session",
          details: data,
        },
        { status: resp.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: data?.checkout_url,
      session_id: data?.session_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error creating checkout" },
      { status: 500 }
    );
  }
}
