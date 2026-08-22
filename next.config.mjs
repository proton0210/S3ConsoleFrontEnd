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
    value: "max-age=31536000",
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
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [{ hostname: "localhost" }, { hostname: "randomuser.me" }],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
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
    ];
  },
};

export default nextConfig;
