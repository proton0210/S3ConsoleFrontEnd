import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

export async function POST(request: NextRequest) {
  try {
    console.log("=== PAYMENT SUCCESS API CALLED ===");

    // Get the authenticated user
    const { userId } = await auth();
    console.log("Authenticated userId:", userId);

    if (!userId) {
      console.error("No authenticated user found");
      return NextResponse.json(
        { success: false, error: "Unauthorized - no user ID" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);

    const { email, name } = body;

    if (!email) {
      console.error("No email provided in request");
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("Processing payment success for:", { email, name });

    // Update user's paid status in DynamoDB
    console.log("Updating DynamoDB for email:", email);

    const updateCommand = new UpdateItemCommand({
      TableName: "S3Console",
      Key: { email: { S: email } },
      UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
      ExpressionAttributeValues: {
        ":paid": { BOOL: true },
        ":onTrial": { BOOL: false },
      },
    });

    console.log("Update command details:", {
      TableName: "S3Console",
      Key: { email: { S: email } },
      UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
      ExpressionAttributeValues: {
        ":paid": { BOOL: true },
        ":onTrial": { BOOL: false },
      },
    });

    console.log("Sending update command to DynamoDB...");
    const updateResult = await docClient.send(updateCommand);
    console.log("DynamoDB update result:", updateResult);
    console.log(
      "Update successful! Status code:",
      updateResult.$metadata?.httpStatusCode
    );

    // Send confirmation email
    let emailSent = false;
    try {
      console.log("Sending confirmation email...");
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            name: name,
          }),
        }
      );

      if (emailResponse.ok) {
        console.log("Confirmation email sent successfully");
        emailSent = true;
      } else {
        console.warn("Failed to send email:", await emailResponse.text());
      }
    } catch (emailError) {
      console.warn("Email sending failed:", emailError);
    }

    // Fetch updated user data
    console.log("Fetching updated user data...");
    const refreshCommand = new QueryCommand({
      TableName: "S3Console",
      IndexName: "clerkId-index",
      KeyConditionExpression: "clerkId = :clerkId",
      ExpressionAttributeValues: {
        ":clerkId": userId,
      },
    });

    const refreshResponse = await docClient.send(refreshCommand);
    const refreshedUserData = refreshResponse.Items?.[0];
    console.log("Refreshed user data:", refreshedUserData);
    console.log("New paid status:", refreshedUserData?.paid);
    console.log("New onTrial status:", refreshedUserData?.onTrial);

    console.log("Payment processing completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      userData: {
        paid: true,
        onTrial: false,
        ...refreshedUserData,
      },
      emailSent: emailSent,
    });
  } catch (error) {
    console.error("Error in payment-success API:", error);
    console.error("Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      statusCode: (error as any)?.$metadata?.httpStatusCode,
      requestId: (error as any)?.$metadata?.requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment",
        details: (error as any)?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}