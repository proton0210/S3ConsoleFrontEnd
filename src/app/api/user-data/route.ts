import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    console.log("=== USER DATA API CALLED ===");

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

    // Query DynamoDB for user data
    console.log("Querying DynamoDB for user data...");
    const command = new QueryCommand({
      TableName: "S3Console",
      IndexName: "clerkId-index",
      KeyConditionExpression: "clerkId = :clerkId",
      ExpressionAttributeValues: {
        ":clerkId": userId,
      },
    });

    console.log("Executing DynamoDB query...");
    const response = await docClient.send(command);
    console.log("DynamoDB response:", response);

    const userData = response.Items?.[0];
    console.log("User data found:", userData);

    if (!userData) {
      console.warn("No user data found for userId:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "User not found in database",
          userId: userId,
        },
        { status: 404 }
      );
    }

    console.log("Returning user data successfully");
    return NextResponse.json({
      success: true,
      userData: userData,
    });
  } catch (error) {
    console.error("Error in user-data API:", error);
    console.error("Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      statusCode: (error as any)?.$metadata?.httpStatusCode,
      requestId: (error as any)?.$metadata?.requestId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user data",
        details: (error as any)?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
