import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
const RESEND_FROM_EMAIL = "Vidit <vidit@serverlesscreed.com>";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: "Thanks for purchasing S3Console",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to S3Console!</h2>
            <p>Hi${name ? ` ${name}` : ""},</p>
            <p>Thank you for purchasing <strong>S3Console</strong>. Your support means the world to us!</p>
            <p>You now have lifetime access to all features.</p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #1f2937;">Important: To activate your Pro license</p>
              <p style="margin: 8px 0 0 0; color: #4b5563;">If you're currently logged into the S3Console desktop application, please log out and log back in to see your updated Pro license status.</p>
            </div>
            <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
            <p style="margin-top: 30px;">Best regards,<br/>The S3Console Team</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}