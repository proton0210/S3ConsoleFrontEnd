import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest, res: NextResponse) {
  const { amount } = await req.json();
  // Ensure environment variables are set
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay credentials are not set" },
      { status: 500 }
    );
  }

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const order = await instance.orders.create({
      amount: amount, // Ensure this is the correct amount
      currency: "USD",
      receipt: "order_rcptid_11",
    });
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error); // Log the error for debugging
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
