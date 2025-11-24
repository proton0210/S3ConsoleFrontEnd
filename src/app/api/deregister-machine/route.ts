import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "https://mg1hzgzyxh.execute-api.ap-south-1.amazonaws.com/prod";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "BXGFrlXS1u4zZOoiSQrnI2ppBJZl3p77S7bslQR9";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, machineId } = body;

    if (!email || !machineId) {
      return NextResponse.json(
        { success: false, error: "Missing email or machineId" },
        { status: 400 }
      );
    }

    // Call backend API Gateway
    const response = await fetch(`${API_URL}/license/deregister`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ email, machineId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to deregister machine" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error in deregister-machine API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deregister machine",
        details: (error as any)?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

