import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getLicenseByEmail, licenseApiRequest } from "@/lib/license-api";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: "No primary email on account" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const machineId = body?.machineId;
    if (typeof machineId !== "string" || !machineId.trim()) {
      return NextResponse.json({ success: false, error: "Missing machineId" }, { status: 400 });
    }

    const { response: licenseResponse, data: license } = await getLicenseByEmail(email);
    if (!licenseResponse.ok) {
      return NextResponse.json(
        { success: false, error: license.error || "License lookup failed" },
        { status: licenseResponse.status },
      );
    }
    if (license.clerkId && license.clerkId !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access to this account" }, { status: 403 });
    }

    const { response, data } = await licenseApiRequest("/license/deregister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, machineId: machineId.trim() }),
    });
    return NextResponse.json(
      { success: response.ok, ...data },
      { status: response.status },
    );
  } catch (error) {
    console.error("[deregister-machine] license service request failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to reach license service" },
      { status: 502 },
    );
  }
}
