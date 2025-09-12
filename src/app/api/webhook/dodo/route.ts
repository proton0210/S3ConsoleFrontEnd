import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Verify webhook signature (replace with actual DodoPayments webhook secret)
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("DODO_WEBHOOK_SECRET not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== DODO WEBHOOK RECEIVED ===");

    const rawBody = await request.text();
    const signature = request.headers.get("x-dodo-signature") || "";

    // Verify webhook authenticity
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookData = JSON.parse(rawBody);
    console.log("Webhook data:", webhookData);

    // Only process successful payments
    if (
      webhookData.event_type !== "payment.completed" ||
      webhookData.status !== "completed"
    ) {
      console.log("Ignoring webhook - not a completed payment");
      return NextResponse.json({ received: true });
    }

    const { customer_email, customer_name, order_id, amount } = webhookData;

    if (!customer_email) {
      console.error("No customer email in webhook");
      return NextResponse.json(
        { error: "Customer email required" },
        { status: 400 }
      );
    }

    console.log("Processing confirmed payment for:", {
      email: customer_email,
      name: customer_name,
      orderId: order_id,
      amount: amount,
    });

    // Check if user exists and isn't already paid
    const queryCommand = new QueryCommand({
      TableName: "S3Console",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": customer_email,
      },
    });

    const queryResponse = await docClient.send(queryCommand);
    const user = queryResponse.Items?.[0];

    if (!user) {
      console.error("User not found:", customer_email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.paid) {
      console.log("User already marked as paid, skipping update");
      return NextResponse.json({
        received: true,
        message: "Already processed",
      });
    }

    // Update user's paid status with conditional check
    const updateCommand = new UpdateItemCommand({
      TableName: "S3Console",
      Key: { email: { S: customer_email } },
      UpdateExpression:
        "SET paid = :paid, onTrial = :onTrial, paidAt = :paidAt, orderId = :orderId",
      ConditionExpression: "paid = :notPaid", // Only update if not already paid
      ExpressionAttributeValues: {
        ":paid": { BOOL: true },
        ":onTrial": { BOOL: false },
        ":paidAt": { S: new Date().toISOString() },
        ":orderId": { S: order_id || "" },
        ":notPaid": { BOOL: false },
      },
    });

    await docClient.send(updateCommand);
    console.log("Successfully updated user payment status");

    // Send confirmation email
    try {
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: customer_email,
            name: customer_name,
          }),
        }
      );

      if (emailResponse.ok) {
        console.log("Confirmation email sent successfully");
      } else {
        console.warn("Failed to send email:", await emailResponse.text());
      }
    } catch (emailError) {
      console.warn("Email sending failed:", emailError);
    }

    return NextResponse.json({
      received: true,
      message: "Payment processed successfully",
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);

    // If it's a conditional check failed error, the payment was already processed
    if (error.name === "ConditionalCheckFailedException") {
      console.log("Payment already processed for this user");
      return NextResponse.json({
        received: true,
        message: "Payment already processed",
      });
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
