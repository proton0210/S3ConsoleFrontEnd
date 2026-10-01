import { siteConfig } from "@/lib/config";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Bundle every asset with the function (same pattern as the font) so the
// image renders on preview deploys and never depends on the live site.
// The URLs must stay string literals so the bundler can see them.
const buf = (res: Response) => res.arrayBuffer();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postTitle = searchParams.get("title") || "Every S3 bucket. Every AWS account.";
  const [fontData, bg, screen, logo] = await Promise.all([
    fetch(new URL("../../assets/fonts/Inter-SemiBold.ttf", import.meta.url)).then(buf),
    fetch(new URL("../../assets/og/bg.png", import.meta.url)).then(buf),
    fetch(new URL("../../assets/og/screen.jpg", import.meta.url)).then(buf),
    fetch(new URL("../../assets/og/logo.png", import.meta.url)).then(buf),
  ]);
  // Satori accepts ArrayBuffers for <img src>; the DOM types only allow strings.
  const src = (buf: ArrayBuffer) => buf as unknown as string;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          backgroundColor: "#fbf8f5",
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={src(bg)} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0 }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 56,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={src(logo)} width={56} height={56} />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: postTitle.length > 48 ? "44px" : "56px",
              fontWeight: 600,
              marginTop: 20,
              textAlign: "center",
              maxWidth: "1000px",
              letterSpacing: "-0.04em",
              color: "#141216",
            }}
          >
            {postTitle}
          </div>
          <div style={{ display: "flex", fontSize: "18px", marginTop: 12, color: "#6e6460" }}>
            {siteConfig.name}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={src(screen)}
          width={900}
          height={563}
          style={{
            position: "absolute",
            top: 330,
            left: 150,
            borderRadius: 18,
            border: "1px solid #e7e2dc",
            boxShadow: "0 30px 80px -20px rgba(40, 20, 10, 0.35)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: fontData, style: "normal" }],
    }
  );
}
