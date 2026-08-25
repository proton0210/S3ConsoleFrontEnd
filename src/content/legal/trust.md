# Serverless Buckets Trust Center

**Last reviewed:** 25 August 2026  
**Security contact:** [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com)

This page describes the current architecture and assurance posture of Serverless Buckets. It is a factual disclosure, not a claim that AWS has approved the product.

## Current assurance status

- Serverless Buckets has **not yet passed an AWS Foundational Technical Review (FTR)** and does not currently claim the AWS Qualified Software badge.
- An AWS Marketplace listing is in preparation. No Marketplace availability, AWS certification, sponsorship, or endorsement is claimed until AWS makes it active.
- We do not currently claim the AWS Marketplace **“deployed on AWS”** designation. Because the product is an Electron desktop client, qualification under AWS's customer-side agent exception requires written confirmation from AWS Marketplace.
- An independent penetration test has **not yet been completed**. It is planned, but is not represented as an existing assurance.

## Architecture and customer-data path

Serverless Buckets is a desktop Amazon S3 client. S3 API requests travel directly from the customer workstation to the customer's AWS account. ServerlessCreed does not proxy or store S3 objects, object contents, bucket listings, metadata, or transfer payloads through its control plane.

The ServerlessCreed control plane handles sign-in, subscription and entitlement state, registered-device state, and operational security events. Its infrastructure is implemented with AWS services including API Gateway, Lambda, DynamoDB, SQS, AWS Backup, WAF, CloudWatch, Secrets Manager, and EventBridge.

## What ServerlessCreed collects

- Authentication subject, verified email, and limited profile data supplied by Clerk.
- Direct-payment or AWS Marketplace agreement and entitlement references needed to grant access.
- A one-way device fingerprint and a customer-supplied device display name for license enforcement.
- Minimal API, security, backup, and operational audit events.
- Diagnostics that a user explicitly enables or deliberately sends to support.

## What we do not collect

- AWS access keys, secret keys, session tokens, SSO tokens, or IAM Roles Anywhere credentials.
- S3 objects, object contents, bucket listings, bucket metadata, object metadata, or transfer payloads through the ServerlessCreed control plane.
- Full payment-card numbers.

## Credential storage

AWS credentials are resolved locally through the standard AWS credential chain. When a user deliberately saves a static AWS profile, it is stored in the standard owner-only shared AWS credentials file. Other protected application values use Electron `safeStorage` and the operating-system keychain. When secure OS storage is unavailable, new secrets are not persistently stored by the app and the user may need to authenticate again.

Customers should prefer short-lived AWS SSO or role credentials, use least-privilege IAM policies, enable workstation encryption, and avoid long-lived access keys.

## Encryption and isolation

Control-plane traffic uses HTTPS/TLS. DynamoDB, queues, backups, logs, and secrets are configured for encryption at rest. Control-plane records are partitioned by an authenticated immutable account subject and product; device and entitlement mutations enforce ownership and conditional-write checks. The desktop's AWS requests remain subject to the customer's IAM policy, S3 bucket policy, and AWS account controls.

## Backup, recovery, and audit evidence

Control-plane DynamoDB infrastructure enables point-in-time recovery with a 35-day recovery window, deletion protection, retained daily backups, alarms for backup and restore failures, and retained infrastructure resources. Security-relevant audit evidence is designed for at least 400 days of retention in an S3 Object Lock compliance-mode archive. These controls must be verified in the production AWS account after deployment; infrastructure code alone is not evidence that a deployment succeeded.

## Incident response

Reports are triaged for severity and scope, then contained, investigated, remediated, and documented. When an incident materially affects customer information or service security, ServerlessCreed will notify affected customers and AWS where required, using the available account contact information and without unreasonable delay. Backup restoration and entitlement recovery procedures are exercised before Marketplace launch and after material architecture changes.

## Vulnerability disclosure policy

Send vulnerability reports to [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com) with the product, affected version, reproduction steps, and impact. Do not include AWS credentials or customer data. Good-faith testing must avoid privacy violations, destructive actions, service disruption, social engineering, or access to data that is not yours. We will acknowledge reports as soon as practicable, coordinate remediation and disclosure, and will not pursue action against good-faith research that follows this policy.

## Desktop updates and code signing

Release checks verify dependency and secret scanning, build integrity, checksums, and platform-specific signing evidence. macOS releases are intended to be Developer ID signed and notarized. Windows is distributed only as a Microsoft Store-certified MSIX, signed and updated through the Store. Linux package-signing status must be stated accurately for each release; an unsigned artifact is never represented as signed. Customers should install supported releases and verify published integrity evidence when available.

## Support and uptime commitment

Support is provided at [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com). Unless an AWS Marketplace listing or signed order says otherwise, support is best-effort and there is no contractual response time, resolution time, or uptime percentage. AWS service availability and charges are governed by the customer's agreement with AWS.

## Current subprocessors and service providers

Current providers include AWS (control-plane infrastructure), Clerk (authentication), Dodo Payments (direct billing), Resend (transactional email), Google Workspace (support and security email), GitHub (source control and release automation), Google Analytics (website analytics), and Reddit and X/Twitter (website conversion attribution). Details and retention disclosures are in the [Privacy Policy](/privacy).

## Data requests and deletion

Requests for access, correction, export, or deletion may be sent to [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com). Deletion is completed within the period stated in the Privacy Policy, except where legal, tax, fraud-prevention, security, or active-contract obligations require limited retention. Deleting ServerlessCreed account data does not delete resources in the customer's AWS account.
