import { NextRequest, NextResponse } from "next/server";
import { api } from "@/polar";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const successUrl = searchParams.get("successUrl");
    const customerEmail = searchParams.get("customerEmail");
    const customerName = searchParams.get("customerName");
    const metadata = searchParams.get("metadata");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Create a checkout session with Polar
    const checkout = await api.checkouts.create({
      products: [productId], // Array of product IDs
      successUrl: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/downloads/success`,
      customerEmail: customerEmail ?? undefined,
      customerName: customerName ?? undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });

    // Redirect to Polar checkout
    return NextResponse.redirect(checkout.url);
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}