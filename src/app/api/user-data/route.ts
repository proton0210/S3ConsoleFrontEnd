import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    console.log("Fetching user data for clerkId:", userId);

    // Fetch user data from DynamoDB using clerkId
    const command = new QueryCommand({
      TableName: "S3Console",
      IndexName: "clerkId-index",
      KeyConditionExpression: "clerkId = :clerkId",
      ExpressionAttributeValues: {
        ":clerkId": userId,
      },
    });

    const response = await docClient.send(command);
    const userData = response.Items?.[0];

    if (!userData) {
      console.log("User not found in database for clerkId:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("Found user:", {
      email: userData.email,
      paid: userData.paid,
      onTrial: userData.onTrial,
    });

    // Return user data
    return NextResponse.json({
      success: true,
      userData: userData,
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    console.error("Error details:", {
      message: (error as any)?.message,
      code: (error as any)?.code,
      statusCode: (error as any)?.$metadata?.httpStatusCode,
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch user data", 
        details: (error as any)?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}