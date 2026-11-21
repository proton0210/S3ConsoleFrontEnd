import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/eula",
  "/marketplace-eula",
  "/marketplace",
  "/trust",
  "/refund-policy",
  "/downloads(.*)",
  "/pricing",
  "/suite",
  "/aws-s3-client",
  "/aws-s3-gui",
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

  // next.config.mjs sets skipTrailingSlashRedirect (PostHog's /relay paths
  // end in "/"), so restore the default /pricing/ -> /pricing redirect here.
  const { pathname } = req.nextUrl;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    // A plain URL: NextURL remembers the original trailing slash and would
    // put it back, redirecting /pricing/ to itself.
    const destination = new URL(req.url);
    destination.pathname = pathname.replace(/\/+$/, "") || "/";
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
  // /relay is the PostHog proxy (next.config.mjs rewrites). Clerk must never
  // see it, or every analytics request is redirected to /sign-in.
  matcher: ["/((?!relay(?:/|$)|.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
