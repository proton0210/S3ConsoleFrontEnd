const forbiddenDynamoCredentialVars = [
  "NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID",
  "NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY",
  "DYNAMO_ACCESS_KEY_ID",
  "DYNAMO_SECRET_ACCESS_KEY",
];
const configuredDynamoCredentialVars = forbiddenDynamoCredentialVars.filter(
  (name) => Boolean(process.env[name])
);
if (configuredDynamoCredentialVars.length > 0) {
  throw new Error(
    `Remove ${configuredDynamoCredentialVars.join(", ")}. DynamoDB is owned by the backend API; AWS access keys must not be embedded in the frontend build.`
  );
}

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // PostHog's API paths end in "/" (e.g. /relay/e/). Without this, Next.js
  // answers each one with a 308 before the rewrite below runs. The site's own
  // trailing-slash redirect is re-implemented in src/middleware.ts.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [{ hostname: "localhost" }],
    // 90 keeps small UI text in the product screenshots crisp.
    qualities: [75, 90],
    // 2304 lets a ~1150px product shot on a 2x screen pick a 2304w file
    // instead of jumping straight to 3840w.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2304, 3840],
  },
  // Never put secrets in next.config `env`. Next replaces those values at
  // build time, which destroys the server/runtime boundary and can copy them
  // into generated JavaScript. Server code reads its runtime environment or
  // Secrets Manager directly; DynamoDB is accessed only by backend Lambdas.

  // PostHog reverse proxy. Analytics requests stay on our domain so ad
  // blockers don't drop them. Asset rules must come before the catch-all.
  // EU Cloud; src/middleware.ts must keep /relay out of Clerk's matcher.
  async rewrites() {
    return [
      { source: "/relay/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
      { source: "/relay/array/:path*", destination: "https://eu-assets.i.posthog.com/array/:path*" },
      { source: "/relay/:path*", destination: "https://eu.i.posthog.com/:path*" },
    ];
  },

  // Convenience aliases for the download CTA. /download (singular) and
  // /get are common shortcuts; map them to the canonical /downloads page.
  async redirects() {
    return [
      { source: "/download", destination: "/downloads", permanent: true },
      { source: "/get", destination: "/downloads", permanent: true },
      // Retired comparison pages. We focus on what Buckets does, not on
      // other products; keep old links and search results working.
      { source: "/vs/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
