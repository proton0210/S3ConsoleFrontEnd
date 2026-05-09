/**
 * Validates that all required environment variables are set
 * Run this during build time to catch missing variables early
 */

interface EnvVar {
  name: string;
  required: boolean;
  sensitive: boolean;
  description: string;
}

const environmentVariables: EnvVar[] = [
  // Authentication
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    sensitive: false,
    description: 'Clerk public key for authentication'
  },
  {
    name: 'CLERK_SECRET_KEY',
    required: true,
    sensitive: true,
    description: 'Clerk secret key for backend authentication'
  },
  
  // Payment Processing
  // Dodo Payments product ID is hardcoded: pdt_HAAaTSsGKpgkDFzHYprZM
  
  // Email Service
  {
    name: 'RESEND_API_KEY',
    required: true,
    sensitive: true,
    description: 'Resend API key for sending emails'
  },

  // AWS DynamoDB credentials are NO LONGER read from env vars.
  // Phase 11 migrated all DDB access to server-side routes that pick up
  // credentials from the Amplify SSR IAM role via the SDK default chain.
  // If NEXT_PUBLIC_DYNAMO_* is still set anywhere, that's a critical leak —
  // see the deprecation check in scripts/validate-env.js.

  // Application
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    sensitive: false,
    description: 'Public URL of the application'
  },
  
];

// Phase 11 — vars that MUST NOT be set; if present they leak AWS credentials
// to every browser via the NEXT_PUBLIC_ bundle. Surface as an error, not a
// warning, so CI catches them.
const DEPRECATED_LEAK_VARS = [
  'NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID',
  'NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY',
] as const;

export function validateEnvironmentVariables(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  environmentVariables.forEach(envVar => {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      missing.push(`${envVar.name} - ${envVar.description}`);
    }

    // Warn about sensitive variables that are public
    if (envVar.sensitive && envVar.name.startsWith('NEXT_PUBLIC_')) {
      warnings.push(
        `${envVar.name} is marked as sensitive but is exposed to the client. Consider moving to server-only.`
      );
    }
  });

  // Phase 11 — block the deprecated DynamoDB credential leak.
  DEPRECATED_LEAK_VARS.forEach((name) => {
    if (process.env[name]) {
      missing.push(
        `${name} is set — REMOVE IT. NEXT_PUBLIC_* values ship to every browser; AWS keys here = critical credential leak. DDB now goes through the Amplify SSR IAM role.`
      );
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

// Run validation if this file is executed directly
if (require.main === module) {
  console.log('🔍 Validating environment variables...\n');
  
  const result = validateEnvironmentVariables();
  
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  if (!result.valid) {
    console.log('❌ Missing required environment variables:');
    result.missing.forEach(missing => console.log(`   - ${missing}`));
    console.log('\nPlease set these variables in your .env.local file or Amplify environment settings.');
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are set!');
  }
}

export default validateEnvironmentVariables;
