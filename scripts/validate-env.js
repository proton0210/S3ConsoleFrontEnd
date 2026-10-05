#!/usr/bin/env node

/**
 * Simple environment variable validation script
 * Can be run with regular Node.js without TypeScript
 */

// Match Next.js's environment loading behavior for local builds. In Amplify,
// the same values are already present in the process environment.
require('@next/env').loadEnvConfig(process.cwd());

// Phase 11 — `NEXT_PUBLIC_DYNAMO_*` removed; DDB now goes through the Amplify
// SSR IAM role. `RESEND_API_KEY` moved to Secrets Manager (RESEND_SECRET_ARN).
const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_PRODUCT_NAME',
  'NEXT_PUBLIC_PRODUCT_DESCRIPTION',
  'LICENSE_API_URL',
  'LICENSE_API_KEY',
  'DODO_API_KEY'
];

// Either-or: prod uses Secrets Manager ARN, local dev uses raw env.
const eitherOr = [
  { label: 'Resend API key',      options: ['RESEND_API_KEY', 'RESEND_SECRET_ARN'] },
];

const productVars = ['MONTHLY', 'YEARLY', 'LIFETIME', 'TEAM'].map((tier) => ({
  label: `Buckets by ServerlessCreed ${tier.toLowerCase()} Dodo product`,
  options: [`BUCKETS_DODO_PRODUCT_ID_${tier}`, `S3CONSOLE_DODO_PRODUCT_ID_${tier}`],
}));

const warnings = [];
const missing = [];
const securityErrors = [];

console.log('🔍 Validating environment variables...\n');

// Phase 11 — flag leaked client-side AWS credentials as a hard failure.
[
  'NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID',
  'NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY',
  'DYNAMO_ACCESS_KEY_ID',
  'DYNAMO_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_RAZORPAY_KEY_SECRET',
].forEach((k) => {
  if (process.env[k]) {
    securityErrors.push(
      `🛑  ${k} is set — REMOVE IT. Private credentials must never use NEXT_PUBLIC_* or be embedded in a frontend build.`
    );
  }
});

// Check for missing required variables
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missing.push(varName);
  }
});

eitherOr.forEach(({ label, options }) => {
  const anySet = options.some((opt) => !!process.env[opt]);
  if (!anySet) {
    missing.push(`${label} — set one of: ${options.join(', ')}`);
  }
});

productVars.forEach(({ label, options }) => {
  if (!options.some((name) => !!process.env[name])) {
    missing.push(`${label} — set one of: ${options.join(', ')}`);
  }
});

// A retired Team product (listed in *_DODO_LEGACY_PRODUCT_IDS_TEAM; keep in sync
// with RETIRED_PRODUCT_IDS in src/lib/dodo.ts) can never be sold: a build whose
// Team product is retired would advertise a price checkout cannot charge, so
// fail the build and keep the current site live.
const retiredTeamProductIds = [
  ...['BUCKETS_DODO_LEGACY_PRODUCT_IDS_TEAM', 'S3CONSOLE_DODO_LEGACY_PRODUCT_IDS_TEAM']
    .flatMap((name) => (process.env[name] || '').split(',').map((id) => id.trim()).filter(Boolean)),
];
const teamProductIds = ['BUCKETS_DODO_PRODUCT_ID_TEAM', 'S3CONSOLE_DODO_PRODUCT_ID_TEAM']
  .map((name) => process.env[name])
  .filter(Boolean);
if (teamProductIds.length > 0 && !teamProductIds.some((id) => !retiredTeamProductIds.includes(id))) {
  missing.push(
    'BUCKETS_DODO_PRODUCT_ID_TEAM - is a retired Team product; set it to the current Team product in Dodo'
  );
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_APP_URL !== 'https://buckets.serverlesscreed.com'
) {
  missing.push('NEXT_PUBLIC_APP_URL - production must be https://buckets.serverlesscreed.com');
}

if (
  process.env.NODE_ENV === 'production' &&
  ![
    'Buckets by ServerlessCreed',
    'Buckets by Serverless Creed',
    'Serverless Buckets',
  ].includes(process.env.NEXT_PUBLIC_PRODUCT_NAME)
) {
  missing.push('NEXT_PUBLIC_PRODUCT_NAME - production must be Buckets by ServerlessCreed (legacy names are accepted during migration)');
}

// Security warnings

if (process.env.NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY) {
  warnings.push('⚠️  WARNING: Consider using IAM roles instead of embedding AWS credentials');
}

// Display results
if (warnings.length > 0) {
  console.log('Security Warnings:');
  warnings.forEach(warning => console.log(warning));
  console.log('');
}

if (securityErrors.length > 0) {
  console.error('Security Errors:');
  securityErrors.forEach(error => console.error(error));
  console.error('');
}

if (missing.length > 0) {
  console.log('❌ Missing required environment variables:');
  missing.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease set these in your .env.local file or Amplify environment settings.');
}

if (missing.length > 0 || securityErrors.length > 0) {
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('\n📦 Production build - ensure all secrets are properly secured in AWS!');
  }
}
