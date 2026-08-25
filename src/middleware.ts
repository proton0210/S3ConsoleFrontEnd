import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/internship",
  "/privacy",
  "/terms",
  "/eula",
  "/marketplace-eula",
  "/marketplace",
  "/trust",
  "/refund-policy",
  "/downloads(.*)",
  "/pricing",
  "/aws-s3-client",
  "/aws-s3-gui",
  "/vs/(.*)",
  "/og",
  "/api/legal/current-versions",
  "/blog",
  "/blog/(.*)",
];
const isPublic = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  const hostname = (req.headers.get("host") || req.nextUrl.hostname)
    .split(":")[0]
    .toLowerCase();

  if (hostname === "s3console.com" || hostname === "www.s3console.com") {
    const destination = req.nextUrl.clone();
    destination.protocol = "https:";
    destination.hostname = "buckets.serverlesscreed.com";
    destination.port = "";

    return NextResponse.redirect(destination, 308);
  }

  if (!isPublic(req)) {
    const { userId } = await auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
