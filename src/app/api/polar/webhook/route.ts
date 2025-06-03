import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryItems, updateItem } from "@/lib/dynamodb";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("polar-signature") || "";
  const expected = crypto
    .createHmac("sha256", process.env.POLAR_WEBHOOK_SECRET || "")
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "payment.succeeded") {
    const userId = event.data?.userId || event.userId || event.metadata?.userId;
    if (userId) {
      const { Items } = await queryItems(
        "S3Console",
        "clerkId = :id",
        { ":id": userId }
      );
      const email = Items?.[0]?.email;
      if (email) {
        await updateItem(
          "S3Console",
          { email },
          "SET paid = :p",
          { ":p": true }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
