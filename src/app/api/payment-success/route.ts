import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@clerk/nextjs";

// Initialize DynamoDB client with server-side credentials
const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Helper function to send confirmation email
async function sendConfirmationEmail(email: string, name: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      console.warn("Failed to send confirmation email:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Get user data from request body (optional, for additional validation)
    const body = await req.json().catch(() => ({}));
    console.log("Payment success API called for userId:", userId);
    console.log("Request body:", body);

    // First, fetch the user's current data using clerkId
    console.log("Fetching user data from DynamoDB...");
    const queryCommand = new QueryCommand({
      TableName: "S3Console",
      IndexName: "clerkId-index",
      KeyConditionExpression: "clerkId = :clerkId",
      ExpressionAttributeValues: {
        ":clerkId": userId,
      },
    });

    const queryResponse = await docClient.send(queryCommand);
    const userData = queryResponse.Items?.[0];

    if (!userData) {
      console.error("User not found in database for clerkId:", userId);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log("Found user:", {
      email: userData.email,
      name: userData.name,
      currentPaidStatus: userData.paid,
      currentTrialStatus: userData.onTrial,
    });

    // Check if user is already paid (prevent duplicate processing)
    if (userData.paid === true) {
      console.log("User already has paid status, skipping update");
      return NextResponse.json({
        success: true,
        message: "User already has Pro license",
        userData: {
          email: userData.email,
          name: userData.name,
          paid: userData.paid,
          onTrial: userData.onTrial,
        },
      });
    }

    // Update user's payment status in DynamoDB
    console.log("Updating payment status for email:", userData.email);
    const updateCommand = new UpdateCommand({
      TableName: "S3Console",
      Key: { email: userData.email },
      UpdateExpression: "SET paid = :paid, onTrial = :onTrial",
      ExpressionAttributeValues: {
        ":paid": true,
        ":onTrial": false,
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await docClient.send(updateCommand);
    console.log("DynamoDB update successful:", {
      email: userData.email,
      newPaidStatus: updateResult.Attributes?.paid,
      newTrialStatus: updateResult.Attributes?.onTrial,
    });

    // Send confirmation email
    console.log("Sending confirmation email...");
    const emailSent = await sendConfirmationEmail(userData.email, userData.name);
    if (emailSent) {
      console.log("Confirmation email sent successfully");
    } else {
      console.warn("Failed to send confirmation email, but payment was processed");
    }

    // Return success response with updated user data
    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      userData: {
        email: updateResult.Attributes?.email,
        name: updateResult.Attributes?.name,
        paid: updateResult.Attributes?.paid,
        onTrial: updateResult.Attributes?.onTrial,
        key: updateResult.Attributes?.key,
      },
      emailSent,
    });

  } catch (error) {
    console.error("Error processing payment success:", error);
    console.error("Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      statusCode: (error as any)?.$metadata?.httpStatusCode,
      requestId: (error as any)?.$metadata?.requestId,
    });

    return NextResponse.json(
      { 
        error: "Failed to process payment", 
        details: (error as any)?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}