import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const OS_OPTIONS = new Set(["Mac", "Windows", "Linux"]);
const DEADLINE = Date.parse("2026-07-31T18:29:00.000Z");
const wordCount = (value: unknown) =>
  typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0;

export async function POST(request: Request) {
  if (Date.now() >= DEADLINE) return NextResponse.json({ error: "Applications closed on 31 July 2026 at 11:59 PM IST." }, { status: 410 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to apply." }, { status: 401 });

  const user = await currentUser();
  const accountEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!accountEmail) return NextResponse.json({ error: "Your account needs a primary email address." }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  const { name, email, phone, experience, motivation, dailyCommitment, awsAccount, operatingSystem, links } = body;
  if (typeof name !== "string" || name.trim().length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (typeof email !== "string" || email.trim().toLowerCase() !== accountEmail) return NextResponse.json({ error: "Use the email address linked to your signed-in account." }, { status: 400 });
  if (typeof phone !== "string" || !/^\+?91[6-9]\d{9}$/.test(phone.replace(/[\s()-]/g, ""))) return NextResponse.json({ error: "Sorry, this internship is only valid for Indians. Use a +91 mobile number." }, { status: 400 });
  if (wordCount(experience) < 50) return NextResponse.json({ error: "Your AWS S3 experience must be at least 50 words." }, { status: 400 });
  if (wordCount(motivation) < 50) return NextResponse.json({ error: "Why you want to apply must be at least 50 words." }, { status: 400 });
  if (typeof dailyCommitment !== "boolean" || typeof awsAccount !== "boolean") return NextResponse.json({ error: "Please answer all Yes or No questions." }, { status: 400 });
  if (!OS_OPTIONS.has(operatingSystem)) return NextResponse.json({ error: "Please choose your operating system." }, { status: 400 });
  if (typeof links !== "string" || !links.trim()) return NextResponse.json({ error: "Project links, LinkedIn or X is mandatory." }, { status: 400 });

  const apiUrl = process.env.LICENSE_API_URL;
  const apiKey = process.env.LICENSE_API_KEY;
  if (!apiUrl || !apiKey) return NextResponse.json({ error: "The application service is not configured." }, { status: 500 });
  const upstream = await fetch(`${apiUrl.replace(/\/$/, "")}/internship`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey }, body: JSON.stringify({ ...body, email: accountEmail, clerkUserId: userId }), cache: "no-store" });
  const result = await upstream.json().catch(() => ({ error: "Invalid response from application service." }));
  return NextResponse.json(result, { status: upstream.status });
}
