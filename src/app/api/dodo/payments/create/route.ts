import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, name } = body || {};
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing DODO_API_KEY" },
        { status: 500 }
      );
    }

    // Product is fixed for S3Console Pro
    const productId = "pdt_HAAaTSsGKpgkDFzHYprZM";

    // Create payment via Dodo REST API
    // Note: Endpoint path based on docs; adjust if needed in config
    const resp = await fetch("https://api.dodopayments.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        customer: { customer_id: userId, email, name },
        product_cart: [{ product_id: productId, quantity: 1 }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { success: false, error: text || `Dodo API error: ${resp.status}` },
        { status: 502 }
      );
    }

    const payment = await resp.json();
    const status = (payment && (payment.status || payment?.data?.status)) as string | undefined;
    const paymentId = (payment && (payment.id || payment?.data?.id)) as string | undefined;

    if (status === "completed") {
      // Immediately mark user as paid
      const updateCommand = new UpdateItemCommand({
        TableName: "S3Console",
        Key: { email: { S: email } },
        UpdateExpression:
          "SET paid = :paid, onTrial = :onTrial, paidAt = :paidAt, orderId = :orderId",
        // Assumes items have `paid` initialized to false
        ConditionExpression: "paid = :notPaid",
        ExpressionAttributeValues: {
          ":paid": { BOOL: true },
          ":onTrial": { BOOL: false },
          ":paidAt": { S: new Date().toISOString() },
          ":orderId": { S: paymentId || "" },
          ":notPaid": { BOOL: false },
        },
      });

      try {
        await docClient.send(updateCommand);
      } catch (err: any) {
        if (err?.name !== "ConditionalCheckFailedException") {
          throw err;
        }
        // Already marked paid — ignore
      }

      return NextResponse.json({
        success: true,
        completed: true,
        payment_id: paymentId,
      });
    }

    // If payment is not immediately completed, return a clear message
    return NextResponse.json(
      {
        success: false,
        completed: false,
        payment_id: paymentId,
        error:
          "Payment was created but not completed immediately. Please try again.",
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Payment creation failed",
      },
      { status: 500 }
    );
  }
}
