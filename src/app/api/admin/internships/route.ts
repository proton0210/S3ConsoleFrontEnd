import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const isAdmin = (metadata: Record<string, unknown>) => metadata.role === "admin" || metadata["role:"] === "admin";
export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const user = await currentUser();
  if (!user || !isAdmin(user.publicMetadata)) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  const apiUrl = process.env.LICENSE_API_URL, apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) return NextResponse.json({ error: "The application service is not configured." }, { status: 500 });
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unable to verify your session." }, { status: 401 });
  try {
    const upstream = await fetch(`${apiUrl.replace(/\/$/, "")}/internship/admin`, { headers: { "x-api-key": apiKey, Authorization: `Bearer ${token}`, "x-admin-authorized": "true" }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    const result = await upstream.json().catch(() => ({ error: "Invalid response from application service." }));
    return NextResponse.json(result, { status: upstream.status });
  } catch { return NextResponse.json({ error: "Unable to reach the application service." }, { status: 502 }); }
}
