#!/usr/bin/env node

/**
 * Simple environment variable validation script
 * Can be run with regular Node.js without TypeScript
 */

const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_POLAR_PRODUCT_ID',
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID',
  'NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_APP_URL'
];

const warnings = [];
const missing = [];

console.log('🔍 Validating environment variables...\n');

// Check for missing required variables
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missing.push(varName);
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