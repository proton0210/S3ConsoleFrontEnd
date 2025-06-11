import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest, res: NextResponse) {
  const { amount } = await req.json();
  // Ensure environment variables are set
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

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

  // Generate a random receipt number
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const receiptId = `S3C_${timestamp}_${randomNum}`;

  try {
    const order = await instance.orders.create({
      amount: amount, // Ensure this is the correct amount
      currency: "USD",
      receipt: receiptId,
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
