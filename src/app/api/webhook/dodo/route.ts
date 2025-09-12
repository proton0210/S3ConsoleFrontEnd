import { Webhooks } from "@dodopayments/nextjs";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const POST = Webhooks({
  webhookKey:
    process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET!,
  onPaymentSucceeded: async (payload) => {
    try {
      console.log("=== PAYMENT SUCCEEDED WEBHOOK ===");
      console.log("Payment payload:", payload);

      // Extract customer data from the payload
      const customer_email = payload.data?.customer?.email;
      const customer_name = payload.data?.customer?.name;
      const order_id =
        (payload as any)?.id || (payload.data as any)?.id || "unknown";
      const amount =
        (payload.data as any)?.amount || payload.data?.total_amount;

      console.log("Processing confirmed payment for:", {
        email: customer_email,
        name: customer_name,
        orderId: order_id,
        amount: amount,
      });

      if (!customer_email) {
        console.error("No customer email in webhook payload");
        return;
      }

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
        return;
      }

      if (user.paid) {
        console.log("User already marked as paid, skipping update");
        return;
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

      console.log("Payment webhook processing completed successfully!");
    } catch (error: any) {
      console.error("Webhook processing error:", error);

      // If it's a conditional check failed error, the payment was already processed
      if (error.name === "ConditionalCheckFailedException") {
        console.log("Payment already processed for this user");
        return;
      }

      throw error; // Re-throw other errors
    }
  },
  onPayload: async (payload) => {
    // Log all webhook events for debugging
    console.log("=== DODO WEBHOOK RECEIVED ===");
    console.log("Event type:", payload.type);
    console.log("Payload:", JSON.stringify(payload, null, 2));
  },
});
