#!/usr/bin/env node

/**
 * Simple environment variable validation script
 * Can be run with regular Node.js without TypeScript
 */

// Phase 11 — `NEXT_PUBLIC_DYNAMO_*` removed; DDB now goes through the Amplify
// SSR IAM role. `RESEND_API_KEY` moved to Secrets Manager (RESEND_SECRET_ARN).
const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL'
];

// Either-or: prod uses Secrets Manager ARN, local dev uses raw env.
const eitherOr = [
  { label: 'Resend API key',      options: ['RESEND_API_KEY', 'RESEND_SECRET_ARN'] },
  { label: 'Dodo API key',        options: ['DODO_API_KEY', 'DODO_API_KEY_SECRET_ARN'] },
  { label: 'Dodo webhook secret', options: ['DODO_WEBHOOK_SECRET', 'DODO_WEBHOOK_SECRET_ARN'] },
];

const warnings = [];
const missing = [];

console.log('🔍 Validating environment variables...\n');

// Phase 11 — flag leaked client-side AWS credentials as a hard failure.
['NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID', 'NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY'].forEach((k) => {
  if (process.env[k]) {
    warnings.push(
      `🛑  ${k} is set — REMOVE IT. NEXT_PUBLIC_* values ship to every browser; this is a critical credential leak.`
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

if (missing.length > 0) {
  console.log('❌ Missing required environment variables:');
  missing.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease set these in your .env.local file or Amplify environment settings.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('\n📦 Production build - ensure all secrets are properly secured in AWS!');
  }
}
