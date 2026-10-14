# Buckets by ServerlessCreed Trust Center

**Last reviewed:** 13 October 2026
**Security contact:** [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com)

This page describes the current architecture and assurance posture of Buckets by ServerlessCreed. It is a factual disclosure, not a claim that AWS has approved the product.

## Current assurance status

- Buckets by ServerlessCreed has **not yet passed an AWS Foundational Technical Review (FTR)** and does not currently claim the AWS Qualified Software badge.
- An AWS Marketplace listing is in preparation. No Marketplace availability, AWS certification, sponsorship, or endorsement is claimed until AWS makes it active.
- We do not currently claim the AWS Marketplace **“deployed on AWS”** designation. Because the product is a cross-platform desktop client, qualification under AWS's customer-side agent exception requires written confirmation from AWS Marketplace.
- An independent penetration test has **not yet been completed**. It is planned, but is not represented as an existing assurance.

## Architecture and customer-data path

Buckets by ServerlessCreed is a desktop Amazon S3 client. S3 API requests travel directly from the customer workstation to the customer's AWS account. ServerlessCreed does not proxy S3 file transfers or collect their contents or AWS secret keys. Account-connected folder-sync metadata is sent to and stored by the account service: profile/device identifiers, device name, local paths, bucket names and prefixes, region/account identifiers, sync settings, and status/error text.

The ServerlessCreed control plane handles sign-in, subscription and entitlement state, registered-device state, and operational security events. Its infrastructure is implemented with AWS services including API Gateway, Lambda, DynamoDB, SQS, AWS Backup, WAF, CloudWatch, Secrets Manager, and EventBridge.

## What ServerlessCreed collects

- Authentication subject, verified email, and limited profile data supplied by Clerk.
- Direct-payment or AWS Marketplace agreement and entitlement references needed to grant access.
- A one-way device fingerprint and a customer-supplied device display name for license enforcement.
- Account-connected folder-sync profile metadata and status, as described in Privacy Policy Section 4.1(e).
- Minimal API, security, backup, and operational audit events.
- Diagnostics that a user explicitly enables or deliberately sends to support.

## What we do not collect

- AWS access keys, secret keys, session tokens, SSO tokens, or IAM Roles Anywhere credentials.
- S3 file contents and transfer payloads through the ServerlessCreed control plane. The sync-profile metadata exception is described above.
- Full payment-card numbers.

## No telemetry in the desktop app

The Buckets desktop app contains **no analytics, crash-reporting, or usage-tracking SDK**, and it has no setting that turns one on. (Release 2.7.55 and earlier also shipped an unused copy of the `posthog-js` library inside the app package. The app never loaded or called it, and it is removed from the next release.) It does not collect or send information about which features you use, what you click, or which buckets and objects you open to ServerlessCreed or to anyone else. Some features keep records only on your computer: a list of recently inspected objects, a local audit log of changes the app made (with bucket and key names), and, when AI agent access is turned on, a local activity feed of agent requests. These records never leave your device. AWS access keys, secret keys, and session tokens are never sent to ServerlessCreed.

This statement covers the **desktop app only**. This website uses Google Analytics and Reddit and X/Twitter conversion pixels, as listed under subprocessors below and in the [Privacy Policy](/privacy).

The desktop app does make the network connections below. This list was checked against the desktop source code for release 2.7.55 on 13 October 2026.

| Connection | Destination | When | What is sent |
|---|---|---|---|
| Your storage | AWS service endpoints for the services and regions you use (for example S3, CloudFront, STS, and IAM Identity Center), or the S3-compatible endpoint you configure | When you use a feature that needs it | AWS API requests signed with your credentials, sent directly from your computer. ServerlessCreed does not proxy them. |
| AWS sign-in | AWS IAM Identity Center and AWS sign-in pages, opened in your browser | When you sign in with SSO or the AWS CLI browser login | Standard AWS sign-in traffic between your computer, your browser, and AWS. |
| Update checks (direct downloads only) | GitHub Releases (api.github.com, github.com, and GitHub's download hosts) | At launch, every 30 minutes, and when the window regains focus (at most once per 15 minutes). Microsoft Store builds do not run this check; the Store updates them. | Standard HTTPS requests for release metadata. No account, license, or AWS information is included. New versions download automatically and install when you quit. |
| Trial and license | ServerlessCreed licensing API (Amazon API Gateway, Mumbai region) | When a trial starts, when you activate or deactivate a license, and when it is revalidated: every 24 hours, every 6 hours while a payment is past due, and every 10 seconds for up to 5 minutes after you open checkout | A one-way device fingerprint (a SHA-256 hash of a hardware identifier); for licenses, also your email and license key. At launch, a request with no identifiers also reads the server's clock to detect clock tampering. |
| Buckets account (only when signed in) | `clerk.buckets.serverlesscreed.com`, opened in your browser for sign-in, and the ServerlessCreed account API | Sign-in, token refresh, device registration and removal, and entitlement checks (checked every 30 minutes and renewed when close to expiry; every 10 seconds for up to 10 minutes after checkout) | OAuth tokens, the device fingerprint, and a generic device name ("Mac", "Windows PC", or "Linux device"). |
| Folder Sync metadata (only when signed in) | ServerlessCreed account API | When you create, update, run, or delete a Folder Sync profile while signed in | The profile metadata described above (paths, bucket names, prefixes, settings, status, and error text). Never file contents or AWS keys. |
| Legal document version | `buckets.serverlesscreed.com/api/legal/current-versions` | When you accept the terms while starting a trial, activating, or purchasing | A plain request with no account or device identifiers. The response is the current terms version, which is recorded with your acceptance. |
| Addresses you choose | The URL, server, or proxy you enter | When you use Upload from URL, mount an SFTP, WebDAV, or FTPS server (through rclone), or route connections through a proxy you configure | A download request to that URL; the file-protocol traffic you start, with the credentials you entered, sent directly to that server; or your normal AWS and storage traffic, sent through your proxy. |
| Spell-check dictionaries (not on macOS) | Google's Chromium dictionary download server | The built-in spell checker of Electron, the framework the app is built on, may download a dictionary for your system language the first time it needs one. macOS uses its own spell checker and downloads nothing. | A standard file download. The spell checker does not send what you type. |
| Links you open | Your default browser | When you click a link such as pricing, docs, or billing | Whatever your browser normally sends to that site. |

Some features run work that you start yourself:

- **Previews** use a local server that listens only on `127.0.0.1` and cannot be reached from other computers.
- The **bundled AWS CLI** and the **code runner** send whatever requests the commands or code you run make.
- In-app documentation is bundled with the app. Release 2.7.55 embeds no videos. If a future docs page embeds one, it will load from `youtube-nocookie.com` only when you open that page.

Every desktop release's GitHub page lists SHA-256 checksum files, a CycloneDX software bill of materials (SBOM), and a packaged-artifact audit alongside the installers. You can use them to check exactly what you are running.

## Credential storage

AWS credentials are resolved locally through the standard AWS credential chain. When a user deliberately saves a static AWS profile, it is stored in the standard owner-only shared AWS credentials file. Other protected application values use operating-system-backed secure storage. When secure OS storage is unavailable, new secrets are not persistently stored by the app and the user may need to authenticate again.

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

Release checks verify dependency and secret scanning, build integrity, checksums, and platform-specific signing evidence. Current signing status:

- **macOS:** the release job must sign the app with a Developer ID and get it notarized before a release can be published.
- **Windows (Microsoft Store):** the edition at [Microsoft Store](https://apps.microsoft.com/detail/9N62S7QSHBDN) is signed and distributed by Microsoft Store, which also manages its updates. New submissions become available after they pass Store certification.
- **Windows (direct installer):** the direct installer and portable ZIP are currently **not** Authenticode-signed. Windows may show a SmartScreen warning for them.
- **Linux:** packages are not currently signed.

An unsigned artifact is never represented as signed. Customers should install supported releases and compare downloads against the published SHA-256 checksums.

## Support and uptime commitment

Support is provided at [buckets@serverlesscreed.com](mailto:buckets@serverlesscreed.com). Unless an AWS Marketplace listing or signed order says otherwise, support is best-effort and there is no contractual response time, resolution time, or uptime percentage. AWS service availability and charges are governed by the customer's agreement with AWS.

## Current subprocessors and service providers

Current providers include AWS (control-plane infrastructure), Clerk (authentication), Dodo Payments (direct billing), Resend (transactional email), Google Workspace (support and security email), GitHub (source control and release automation), Google Analytics (website analytics), and Reddit and X/Twitter (website conversion attribution). Details and retention disclosures are in the [Privacy Policy](/privacy).

## Data requests and deletion

Requests for access, correction, export, or deletion may be sent to [vidit@serverlesscreed.com](mailto:vidit@serverlesscreed.com). Deletion is completed within the period stated in the Privacy Policy, except where legal, tax, fraud-prevention, security, or active-contract obligations require limited retention. Deleting ServerlessCreed account data does not delete resources in the customer's AWS account.
