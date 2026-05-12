/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Amplify SSR gotcha: env vars set in the Amplify Console are exposed at
  // BUILD time only — they do NOT flow into the SSR Lambda runtime. Forwarding
  // them here inlines the values at build time so route handlers can read them
  // via process.env at request time.
  env: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    FOUNDER_NOTIFICATION_EMAIL: process.env.FOUNDER_NOTIFICATION_EMAIL,
    FOUNDER_DIGEST_MODE: process.env.FOUNDER_DIGEST_MODE,
    DODO_API_KEY: process.env.DODO_API_KEY,
    DODO_API_BASE_URL: process.env.DODO_API_BASE_URL,
    // DODO_WEBHOOK_SECRET / DODO_WEBHOOK_SECRET_ARN are NOT forwarded:
    // the webhook now runs on a dedicated Lambda Function URL (see
    // backend-s3Console/src/handlers/dodo-webhook.ts). The Next.js app no
    // longer receives Dodo webhook traffic.
    RESEND_SECRET_ARN: process.env.RESEND_SECRET_ARN,
    LICENSE_SIGNING_SECRET_ARN: process.env.LICENSE_SIGNING_SECRET_ARN,
    CLERK_WEBHOOK_SECRET_ARN: process.env.CLERK_WEBHOOK_SECRET_ARN,
    S3CONSOLE_DODO_PRODUCT_ID_MONTHLY: process.env.S3CONSOLE_DODO_PRODUCT_ID_MONTHLY,
    S3CONSOLE_DODO_PRODUCT_ID_YEARLY: process.env.S3CONSOLE_DODO_PRODUCT_ID_YEARLY,
    S3CONSOLE_DODO_PRODUCT_ID_LIFETIME: process.env.S3CONSOLE_DODO_PRODUCT_ID_LIFETIME,
    DYNAMO_ACCESS_KEY_ID: process.env.DYNAMO_ACCESS_KEY_ID,
    DYNAMO_SECRET_ACCESS_KEY: process.env.DYNAMO_SECRET_ACCESS_KEY,
    // AWS_REGION intentionally NOT forwarded — Lambda's runtime sets it
    // automatically; baking the build-time value risks overriding it.
  },

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
