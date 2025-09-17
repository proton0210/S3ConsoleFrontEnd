import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = 'nodejs';

// Creates a Dodo Checkout Session and returns { checkout_url, session_id }
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env["DODO_API_KEY"];
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing DODO_API_KEY" }, { status: 500 });
    }

    // Product is fixed for S3Console Pro
    const productId = "pdt_HAAaTSsGKpgkDFzHYprZM";

    // Optional body could allow quantity etc., but default to 1
    let quantity = 1;
    try {
      const body = await request.json();
      if (body && typeof body.quantity === 'number' && body.quantity > 0) {
        quantity = body.quantity;
      }
    } catch {}

    const resp = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { success: false, error: text || `Dodo API error: ${resp.status}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const checkoutUrl = data?.checkout_url;
    const sessionId = data?.session_id;

    if (!checkoutUrl || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Invalid response from Dodo: missing checkout_url/session_id" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, checkout_url: checkoutUrl, session_id: sessionId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to create session" }, { status: 500 });
  }
}

