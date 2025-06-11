import { NextRequest, NextResponse } from "next/server";
import { api } from "@/polar";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Get the signature from headers
    const signature = req.headers.get("x-polar-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify webhook signature
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");
    
    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    const event = JSON.parse(body);
    
    // Log the event for monitoring
    console.log(`Received Polar webhook: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
      customerEmail: event.data?.customer?.email,
    });
    
    // The actual payment processing is handled in the success page
    // This webhook is just for logging and verification
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}