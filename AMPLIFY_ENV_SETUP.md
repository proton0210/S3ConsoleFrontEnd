# AWS Amplify Environment Variables Setup Guide

## Overview

This guide provides best practices for configuring environment variables when deploying to AWS Amplify.

## Environment Variables Categories

### 1. Public Variables (Client-side accessible)

These variables are prefixed with `NEXT_PUBLIC_` and will be exposed to the browser:

```
NEXT_PUBLIC_APP_URL=https://your-amplify-app-url.amplifyapp.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_POLAR_PRODUCT_ID=your_polar_product_id
NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID=your_dynamo_access_key
NEXT_PUBLIC_DYNAMO_SECRET_ACCESS_KEY=your_dynamo_secret_key
```

### 2. Private Variables (Server-side only)

These should never be exposed to the client:

```
CLERK_SECRET_KEY=your_clerk_secret_key
RESEND_API_KEY=your_resend_api_key
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_PAYMENTS_WEBHOOK_KEY=your_dodo_webhook_secret
DODO_PAYMENTS_ENVIRONMENT=live_mode
```

## Best Practices for AWS Amplify

### 1. Use AWS Systems Manager Parameter Store (Recommended)

Store sensitive values in Parameter Store and reference them in Amplify:

```bash
# Store secret in Parameter Store
aws ssm put-parameter \
  --name "/amplify/s3console/CLERK_SECRET_KEY" \
  --value "your-secret-value" \
  --type "SecureString"

# In Amplify, reference it as:
CLERK_SECRET_KEY=${SSM_CLERK_SECRET_KEY}
```

### 2. Use AWS Secrets Manager for Critical Secrets

For highly sensitive data like payment keys:

```bash
# Create secret
aws secretsmanager create-secret \
  --name "s3console/polar" \
  --secret-string '{"access_token":"xxx","webhook_secret":"yyy"}'
```

### 3. Environment-Specific Configuration

Create different environment configurations:

#### Production (.env.production)

```
NEXT_PUBLIC_APP_URL=https://s3console.com
NODE_ENV=production
```

#### Staging (.env.staging)

```
NEXT_PUBLIC_APP_URL=https://staging.s3console.com
NODE_ENV=staging
```

## Setting Environment Variables in AWS Amplify

### Method 1: Amplify Console UI

1. Go to AWS Amplify Console
2. Select your app
3. Navigate to "Environment variables" under "App settings"
4. Click "Manage variables"
5. Add each variable with its value

### Method 2: Amplify CLI

```bash
amplify update function
# Select "Update environment variables"
```

### Method 3: amplify.yml Configuration

Create an `amplify.yml` file in your project root:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - echo "Setting up environment variables"
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
  buildSpec: |
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - env | grep -E '^NEXT_PUBLIC_' > .env.production
            - npm run build
```

## Security Best Practices

### 1. Never commit sensitive values

Add to `.gitignore`:

```
.env.local
.env.production
.env*.local
```

### 2. Use least privilege AWS IAM roles

Create a specific IAM role for DynamoDB access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:Query", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:ap-south-1:*:table/S3Console"
    }
  ]
}
```

### 3. Rotate credentials regularly

Set up automatic rotation for:

- API keys
- AWS access keys
- Payment gateway secrets

### 4. Use separate credentials for each environment

- Development: Limited access, test accounts
- Staging: Production-like but isolated
- Production: Full access with monitoring

## Migration Strategy

### Step 1: Identify which variables can be public

Review each `NEXT_PUBLIC_` variable and ensure it doesn't contain sensitive data.

### Step 2: Create secure storage for secrets

```bash
# Example script to migrate secrets to Parameter Store
#!/bin/bash
aws ssm put-parameter --name "/amplify/s3console/CLERK_SECRET_KEY" --value "$CLERK_SECRET_KEY" --type "SecureString"
aws ssm put-parameter --name "/amplify/s3console/RESEND_API_KEY" --value "$RESEND_API_KEY" --type "SecureString"
aws ssm put-parameter --name "/amplify/s3console/POLAR_ACCESS_TOKEN" --value "$POLAR_ACCESS_TOKEN" --type "SecureString"
```

### Step 3: Update your code to handle missing variables

```typescript
// Add validation for required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## Monitoring and Debugging

### 1. Enable CloudWatch Logs

Monitor your application logs for environment variable issues:

```bash
amplify add analytics
```

### 2. Add health checks

Create an API endpoint to verify configuration:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    clerk: !!process.env.CLERK_SECRET_KEY,
    polar: !!process.env.POLAR_ACCESS_TOKEN,
    dynamo: !!process.env.NEXT_PUBLIC_DYNAMO_ACCESS_KEY_ID,
    resend: !!process.env.RESEND_API_KEY,
  };

  return Response.json({
    status: Object.values(checks).every((v) => v) ? "healthy" : "unhealthy",
    checks,
  });
}
```

## Environment Variables Checklist

Before deploying to Amplify, ensure:

- [ ] All `NEXT_PUBLIC_` variables contain only non-sensitive data
- [ ] Secret keys are stored in Parameter Store or Secrets Manager
- [ ] IAM roles have minimal required permissions
- [ ] Environment-specific variables are properly configured
- [ ] Health check endpoint is implemented
- [ ] CloudWatch logging is enabled
- [ ] Backup of all credentials exists in a secure location

## Example Amplify Environment Configuration

In Amplify Console, add these environment variables:

```
# Public variables (safe to expose)
NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Private variables (reference from Parameter Store)
CLERK_SECRET_KEY=${SSM_CLERK_SECRET_KEY}
RESEND_API_KEY=${SSM_RESEND_API_KEY}
POLAR_ACCESS_TOKEN=${SSM_POLAR_ACCESS_TOKEN}
POLAR_WEBHOOK_SECRET=${SSM_POLAR_WEBHOOK_SECRET}

# AWS credentials (use IAM role instead if possible)
AWS_REGION=ap-south-1
```

## Alternative: Use IAM Roles Instead of Access Keys

For DynamoDB access, consider using IAM roles instead of access keys:

1. Create an IAM role for your Amplify app
2. Attach DynamoDB permissions to the role
3. Update your code to use the AWS SDK without explicit credentials:

```typescript
// lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// SDK will automatically use IAM role credentials
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});
```

This is more secure than using access keys in environment variables.
