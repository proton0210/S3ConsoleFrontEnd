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
  
  // AWS Services
  {
    name: 'NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID',
    required: true,
    sensitive: false,
    description: 'AWS access key for DynamoDB'
  },
  {
    name: 'NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY',
    required: true,
    sensitive: true,
    description: 'AWS secret key for DynamoDB (consider using IAM roles)'
  },
  
  // Application
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    sensitive: false,
    description: 'Public URL of the application'
  },
  
];

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
