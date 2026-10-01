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
