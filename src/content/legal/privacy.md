# Buckets by ServerlessCreed — Privacy Policy

**Effective Date:** 22 May 2026
**Last Updated:** 10 September 2026
**Version:** 1.3

This Privacy Policy describes how **Serverless Creed** ("**ServerlessCreed**", "**we**", "**us**", or "**our**") — a sole proprietorship organized under the laws of India, operating under GSTIN 27FZZPS3310E1ZX, with principal place of business at Khetwadi-11, Mumbai, India — collects, uses, shares, and protects personal information in connection with the Buckets by ServerlessCreed desktop application, the website at https://buckets.serverlesscreed.com, and related services (collectively, the "**Services**").

For the avoidance of doubt and for purposes of statutory disclosure under Indian law, Serverless Creed is the registered trade name of a sole proprietorship of which Mr. Vidit Jinesh Shah is the proprietor. The proprietor is the natural person who is the Data Fiduciary under the Digital Personal Data Protection Act, 2023, acting through the business known as Serverless Creed.

This Policy is intended to comply with the **Digital Personal Data Protection Act, 2023** ("**DPDP Act**") and the **Information Technology Act, 2000** of India, and to provide additional rights commonly granted to users in other jurisdictions (such as the EU/UK GDPR). It is incorporated by reference into the [Terms and Conditions](/terms).

By using the Services, you acknowledge that you have read and understood this Policy. If you do not agree with this Policy, please do not use the Services.

---

## 1. Summary in Plain English

Before the legal detail, here is what matters most:

- **Buckets by ServerlessCreed runs locally on your computer.** S3 file transfers and AWS API requests go **directly from your machine to AWS** using credentials you provide. ServerlessCreed does not proxy those transfers or collect AWS secret keys or S3 file contents. **Account-connected folder-sync profile metadata is sent to our account service**, as described in Section 4.1(e).
- We collect only the personal information needed to operate the Services: your **email and authentication identity** (through Clerk), a **device fingerprint** (to prevent license abuse), **payment information** (handled by Dodo Payments — we do not store card numbers), and **optional diagnostics**.
- Our website uses **Google Analytics** for traffic measurement and **Reddit and Twitter (X) conversion pixels** for marketing attribution. These providers may set or read cookies and similar identifiers as described below.
- We do not sell your personal information.
- You have rights — including access, correction, and erasure — that you can exercise by emailing vidit@serverlesscreed.com.

The rest of this Policy provides the legal detail.

---

## 2. Definitions

For purposes of this Policy:

2.1 **"Personal Information"** or **"Personal Data"** means any information that relates to an identified or identifiable natural person, as defined under applicable data-protection law (including "personal data" under the DPDP Act).

2.2 **"Data Principal"** means the natural person to whom Personal Information relates (referred to as "you" or "your" in this Policy). This term is used in the sense given under the DPDP Act and is broadly equivalent to a "data subject" under GDPR.

2.3 **"Data Fiduciary"** means the entity that determines the purpose and means of processing Personal Information. ServerlessCreed is the Data Fiduciary for Personal Information processed in connection with the Services. This term is broadly equivalent to a "data controller" under GDPR.

2.4 **"Data Processor"** means a third party that processes Personal Information on behalf of the Data Fiduciary.

2.5 **"Processing"** means any operation performed on Personal Information, including collection, storage, use, disclosure, alteration, and erasure.

2.6 **"Customer Content"** means data accessed, viewed, modified, uploaded, or downloaded by you using Buckets by ServerlessCreed in connection with your own AWS account (including S3 object contents, bucket listings, metadata, and AWS credentials). You control Customer Content in your AWS account. The limited folder-sync metadata processed by our account service is covered by this Policy and may include Personal Information, as described in Section 4.1(e).

---

## 3. Scope

3.1 This Policy applies to:

(a) the **Buckets by ServerlessCreed desktop application** distributed by ServerlessCreed;
(b) the **website at https://buckets.serverlesscreed.com** and any subdomains; and
(c) related sales, billing, licensing, and support interactions you have with us.

3.2 This Policy does **not** apply to:

(a) **Amazon Web Services (AWS)**, which is operated independently by Amazon Web Services, Inc. Your use of AWS is governed by AWS's own privacy notices and your agreement with AWS.
(b) **Third-party services** linked from the Services (e.g., payment processors, identity providers). These services have their own privacy policies, which you should review.
(c) Processing of Customer Content within your AWS account, which you control. Our processing of the limited folder-sync metadata described in Section 4.1(e) is covered by this Policy.

---

## 4. Information We Collect

We collect Personal Information in three ways: (a) you provide it directly, (b) it is collected automatically when you use the Services, and (c) we receive it from third parties (e.g., identity providers and payment processors).

### 4.1 Information You Provide

(a) **Account, authentication, and licensing information.** When you sign up or sign in through **Clerk**, start a free trial, purchase a Subscription, or activate a License Key, we and Clerk collect or receive:

- Email address
- Name (if provided)
- Country / billing region (if provided)
- Clerk user ID (the stable account subject), provider identifiers, and session/security metadata
- Profile picture and OAuth profile subset (if provided by you or the provider)
- License Key (generated by us and tied to you)
- Acceptance status of our legal documents (Terms, Privacy Policy, EULA) and the version accepted

(b) **Payment information.** When you purchase a Subscription, payment information (card number, billing address, transaction details) is collected and processed by **Dodo Payments**. We **do not store full card numbers or CVV** on our systems. We retain only the customer/payment/subscription or transaction reference, amount, currency, billing country, tax information, and partial-card metadata when returned, as needed for invoicing, refund processing, fraud prevention, and accounting.

(c) **Support communications.** When you contact us by email or other channels, we receive any information you choose to provide, including your name, email, the content of your message, and any attachments.

(d) **Feedback and surveys.** If you voluntarily participate in surveys, beta programs, or product feedback, we receive the responses you provide.

(e) **Account-connected folder-sync metadata.** When you are signed in and create or update a folder-sync profile, the app sends profile metadata to ServerlessCreed's account service. This includes the profile and device identifiers, device name and platform, local folder path, bucket name, S3 prefix, AWS region and account/profile identifier, include/exclude patterns, sync settings, configured event-queue URL, and sync timestamps, status, and error text. Paths and error text may contain personal or project information. The service uses these records to display and maintain your sync profiles and status across signed-in devices. These records do not contain AWS secret keys or S3 file contents. Deleting a sync profile while connected also requests deletion of its account-service record; if the network is unavailable, the remote deletion may fail and you can contact support to remove the record. Account-data deletion and backup retention are described in Sections 8 and 10. Simply disabling a sync profile does not delete its stored metadata.

### 4.2 Information Collected Automatically

(a) **License validation telemetry.** Each time the Software validates your License Key against our licensing servers, we collect:

- License Key identifier
- Email address associated with the License
- A **device fingerprint** (a one-way derived identifier — such as a hash of selected hardware and OS characteristics — used to bind a license to authorized devices and prevent abuse). The device fingerprint is **not** a globally unique device ID and does not by itself identify you outside our system.
- IP address of the request
- Operating system, OS version, and Software version
- Timestamp of the request

(b) **Update checks.** The Software periodically checks for updates. These checks send the current Software version, OS, and locale to our update servers.

(c) **Crash and error diagnostics (optional).** If enabled, the Software may transmit crash reports and diagnostic data (stack traces, system metadata, anonymous session identifier) to help us identify and fix bugs. You can disable this in the Software's settings.

(d) **Usage analytics (optional).** If enabled, the Software may transmit anonymized usage analytics (e.g., which features are used, button clicks, screen views) to help us improve the product. Analytics events do not include Customer Content. You can disable this in the Software's settings.

(e) **Website analytics and advertising.** When you visit https://buckets.serverlesscreed.com, **Google Analytics** measures page views, referrers, browser/device information, interactions, and coarse location. **Reddit and Twitter (X) conversion pixels** measure download, checkout, and related campaign events. These services may process cookie or campaign identifiers, visit metadata, and conversion events under their own privacy terms. They do not receive Customer Content from the desktop data path.

(f) **Control-plane security events.** Our control plane records the request time, route, method, response status, response size, latency, authenticated account subject, source IP address, and user-agent string for security monitoring, incident investigation, and abuse prevention. Before the long-term security archive is written, the account subject, source IP address, and user-agent string are replaced with one-way digests. Request or response bodies, AWS credentials, and Customer Content are not included in these access records.

### 4.3 Information We Receive from Third Parties

(a) **Payment processor data (Dodo Payments).** Dodo Payments confirms transaction status and may provide customer, transaction, subscription, partial-card, billing-country, tax, amount, currency, renewal, cancellation, and refund metadata.

(b) **Identity provider data (Clerk).** Clerk provides the verified authentication subject and the profile subset (typically email, name, profile picture, verified provider identifiers, and session metadata) shared under your provider authorization.

(c) **Analytics and advertising platforms.** Google Analytics provides website-traffic reports. Reddit and Twitter (X) may provide campaign and conversion reports attributable to our advertising. Their reports may be aggregated, while the providers may process cookie, device, visit, and campaign identifiers under their own terms.

(d) **AWS Marketplace.** If you buy through AWS Marketplace, AWS provides the AWS account ID of the buyer, product code, License ARN, agreement identifier, entitlement quantities and dimensions, and agreement or license status required to fulfill and reconcile the purchase. The short-lived AWS registration token is consumed server-side and is not retained in a browser cookie; the browser receives only a separate, opaque onboarding token that expires after thirty (30) minutes. You enter a contact email during registration, and it must match the verified email on your signed-in ServerlessCreed account.

### 4.4 Information We Do **Not** Collect

Except for the account-connected folder-sync metadata described in Section 4.1(e) and information you deliberately send to support, ServerlessCreed does not collect the following through the desktop AWS data path:

- The contents of S3 objects (files, blobs, documents) stored in your AWS account.
- Full bucket listings, object contents, object metadata, and tags from ordinary AWS browsing. Bucket names, configured prefixes, local paths, and sync status/error text are included in account-connected sync-profile records.
- AWS access keys, secret keys, session tokens, SSO tokens, or other AWS credentials.
- IAM role names, IAM policies, or account-level AWS configuration.
- Other AWS service data accessed through the Software (e.g., CloudFront distributions, Lambda functions, DynamoDB tables) within your account.

AWS credentials are stored locally on your device using operating-system-provided secure storage (such as the macOS Keychain, Windows Credential Manager, or Linux secret-service) where available. AWS API calls made by the Software go **directly from your device to AWS**, not through ServerlessCreed's servers.

---

## 5. How We Use Your Information

We process Personal Information for the following purposes. Under the Digital Personal Data Protection Act, 2023, processing is lawful only on the basis of (a) your **consent** under Section 6, or (b) **"certain legitimate uses"** enumerated in Section 7 of the Act. The Act does **not** recognize the GDPR concepts of "performance of contract" or "legitimate interests" as standalone bases.

For each purpose below, the **DPDP basis** column identifies whether we rely on consent (§6) or a legitimate use (§7), with the specific clause of §7 cited where relevant. Where additional jurisdictional bases apply (e.g., for users in the EEA/UK/California), those are addressed in Section 16.

| Purpose | Categories Used | DPDP Basis (India) |
|---|---|---|
| Provide, operate, authenticate, and maintain the Services you signed up for | Email, Clerk subject/provider/session metadata, License Key, device fingerprint, IP, OS, Software version | Consent (§6) for sign-up/sign-in; and §7(a) — data voluntarily provided for the specified purpose of obtaining the Services |
| Fulfill and reconcile an AWS Marketplace agreement | Verified email, Clerk user ID, AWS buyer account ID, License ARN, agreement ID, product code, entitlement and agreement status | Consent (§6) and §7(a) — information voluntarily provided or linked for the specified purpose of obtaining the Marketplace purchase |
| Process payments and prevent fraud | Email, payment metadata, transaction history, IP | §7(g) — compliance with applicable law (Income Tax Act, GST law, anti-money-laundering rules); and consent (§6) for the underlying transaction |
| Validate license activations and enforce per-user licensing | Email, License Key, device fingerprint, IP | Consent (§6) given at the time of License acceptance; and §7(a) — for the specified purpose of license enforcement |
| Provide customer support and respond to enquiries you initiate | Email, support message content | §7(a) — data voluntarily provided for the specified purpose of receiving support; consent (§6) for any sensitive information you choose to share |
| Notify you about Software updates, security advisories, and material changes to the Services or to legal documents | Email | §7(a) — voluntarily provided for the purpose of receiving the Services; transactional communications inherent to the License relationship |
| Improve product quality through diagnostics and usage analytics (only if you have **not opted out**) | Crash data, anonymous usage events, OS, Software version | Consent (§6) — opt-out architecture; consent is deemed withdrawn upon disabling in Settings |
| Comply with legal obligations (e.g., tax, accounting, anti-money-laundering, court orders, regulatory requests) | Email, billing details, transaction history | §7(g) — compliance with any law in force in India |
| Defend, investigate, and resolve disputes; enforce our [Terms and Conditions](/terms) and [EULA](/eula) | All categories as relevant | §7(i) — purposes connected with employment, or the exercise or defence of legal claims (read with the residual statutory power to process for lawful purposes) |

We do **not**:

- Sell Personal Information.
- Rent or lease Personal Information.
- Use Customer Content for advertising or create a behavioral profile from desktop AWS activity. Website conversion providers may process visit and campaign events under their own terms.
- Process Personal Information through automated decision-making with legal or similarly significant effects on you.

---

## 6. How We Share Personal Information

We share Personal Information only with the categories of recipients below, and only as necessary for the purposes described in Section 5.

### 6.1 Service Providers (Data Processors)

We engage third-party service providers to operate the Services. These providers process Personal Information for the stated purpose under their terms and our applicable agreements. Current providers include:

- **Amazon Web Services (AWS)** — website, identity/licensing control plane, protected metadata stores, logs, backups, and update delivery. AWS hosts the account-connected sync metadata described in Section 4.1(e); S3 file contents and AWS credentials remain in the direct desktop-to-customer-AWS data path.
- **Clerk** — account authentication, OAuth/provider linkage, session management, and profile data.
- **Dodo Payments** — checkout, payment, subscription, tax, fraud, and refund processing. We do not receive full card numbers or CVVs.
- **Resend** — transactional account, license, receipt, support, and security email delivery.
- **Google Analytics** — website traffic and interaction measurement, including page, referrer, browser/device, and coarse-location information.
- **Reddit and Twitter (X) Ads** — website visit, campaign, cookie, and conversion-event processing for advertising attribution.
- **Google Workspace** — receives the messages, sender information, delivery metadata, and attachments that you choose to send to our security, privacy, legal, or support mailbox.
- **GitHub** — source control, CI security checks, build/release metadata, and public release notes; it does not receive Customer Content through the desktop data path.

We do not currently use a continuously connected third-party desktop crash-reporting service. Optional diagnostic information is processed only when an in-product diagnostic control is enabled or when you deliberately submit it to support. We will update this list before connecting an additional provider to production diagnostic data.

We periodically review service providers for compliance with applicable data-protection law.

Account-connected folder-sync metadata is stored by our AWS-hosted account service, associated with your authenticated account and registered device. It is not used for advertising.

### 6.2 Legal and Regulatory Disclosures

We may disclose Personal Information when we believe in good faith that disclosure is required to:

(a) comply with applicable law, regulation, legal process, or governmental request (including from authorities in India under the DPDP Act, the IT Act, or court orders);
(b) enforce our [Terms and Conditions](/terms) or other agreements;
(c) detect, prevent, or address fraud, security incidents, or technical issues; or
(d) protect the rights, property, or safety of ServerlessCreed, our users, or the public.

Where legally permitted, we will notify you before such disclosure and give you a reasonable opportunity to challenge it.

### 6.3 Business Transfers

If ServerlessCreed (or substantially all of its assets relating to the Services) is acquired, merged with another entity, or undergoes a bankruptcy or similar proceeding, Personal Information may be transferred to the successor entity. We will give you reasonable notice — by email or via the Services — before Personal Information becomes subject to a different privacy policy.

### 6.4 With Your Consent

We may share Personal Information with third parties when you have specifically consented to such sharing.

### 6.5 No Sale of Personal Information

We do not sell, rent, or otherwise commercially trade Personal Information.

---

## 7. International Data Transfers

7.1 Because we use cloud infrastructure (such as AWS) and service providers that may operate outside India, your Personal Information may be transferred to, processed in, and stored in countries other than the country in which you reside.

7.2 Where required by Section 16 of the DPDP Act, we will only transfer Personal Information to countries not restricted by the Central Government, and we will rely on appropriate safeguards (such as contractual commitments with our service providers).

7.3 If you are in the European Economic Area (EEA) or the United Kingdom, transfers outside the EEA/UK are made on the basis of (a) European Commission / UK adequacy decisions, where available; (b) Standard Contractual Clauses; or (c) other legally recognized transfer mechanisms.

---

## 8. Data Retention

We retain Personal Information only for as long as necessary for the purposes set out in this Policy, after which we securely delete or anonymize it. Specific retention periods include:

| Category | Retention Period |
|---|---|
| Active Subscription and licensing data | For the life of the License plus seven (7) years for tax/accounting compliance |
| Payment transaction records | Seven (7) years (Indian tax and accounting requirements) |
| Support communications | Up to three (3) years after the last contact, unless we are required to retain longer |
| Crash and diagnostic data | Up to thirteen (13) months in identifiable form, then anonymized or deleted |
| Usage analytics | Anonymized at collection; aggregate analytics retained without identifiability |
| Website analytics / advertising / conversion data | As retained by Google, Reddit, and Twitter/X under their own policies; we retain aggregate reporting and configured event history |
| Control-plane security and access events | Four hundred (400) days; long-term records are protected in an immutable archive and direct account, IP, and user-agent identifiers are replaced with one-way digests |
| Account-connected folder-sync profiles and status | Retained until the profile is deleted through the connected app or an account-data deletion request is fulfilled; retained backup copies follow the backup schedule below |
| Backups | Up to ninety (90) days beyond the primary retention period |

If you request deletion of your data under Section 10 below, we will delete or anonymize within thirty (30) days, except where retention is required by law (e.g., tax records, fraud-prevention obligations).

---

## 9. Data Security

9.1 We implement reasonable technical and organizational measures to protect Personal Information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access, including:

- Encryption of data in transit (HTTPS/TLS) for all communications with our servers.
- Encryption of payment data at the payment processor's end (PCI-DSS compliant).
- Storage of AWS credentials locally through the standard credential chain, owner-only shared credential files, and operating-system-backed secure storage where available. New secrets are not persisted by the app when secure OS storage is unavailable. Prefer AWS SSO or short-lived roles and full-disk encryption.
- Access controls and least-privilege principles for ServerlessCreed staff.
- Periodic review of third-party processors.

9.2 **No method of transmission or storage is perfectly secure.** While we strive to protect Personal Information, we cannot guarantee absolute security. You play an important role too: keep your License Key, Account credentials, and AWS credentials confidential, and use strong device-level security (passwords, full-disk encryption, lock screen, etc.).

9.3 **Breach notification.** In the event of a personal data breach that is likely to result in harm to you, we will notify you and the Data Protection Board of India (or other appropriate authority) as required by the DPDP Act and other applicable law.

---

## 10. Your Rights and Choices

Subject to applicable law, you have the following rights with respect to your Personal Information. Many of these are explicitly granted under the DPDP Act; if you are in another jurisdiction, equivalent rights may apply under your local law (e.g., GDPR, CCPA).

### 10.1 Rights under the DPDP Act, 2023

(a) **Right to access information** (Section 11) — request confirmation of, and a summary of, the Personal Information we process about you.

(b) **Right to correction and erasure** (Section 12) — request correction of inaccurate or incomplete data, or erasure of Personal Information that is no longer necessary for the purposes for which it was collected (subject to legal-retention exceptions).

(c) **Right to grievance redressal** (Section 13) — file a grievance with our Grievance Officer (see Section 14) and receive a response within a reasonable time.

(d) **Right to nominate** (Section 14) — nominate another natural person to exercise your rights under the DPDP Act in the event of your death or incapacity. To exercise this, contact us in writing.

(e) **Right to withdraw consent** — where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal, and may limit our ability to provide the Services.

### 10.2 Additional Choices

(a) **Opt out of diagnostics and analytics** — disable crash reporting and usage analytics in the Software's settings.

(b) **Marketing emails** — we do not send promotional emails by default. Transactional emails (License Key delivery, billing receipts, security advisories, legal-document updates, expiry reminders) are part of the Services and cannot be opted out of while you have an active relationship with us.

(c) **Cancel your Subscription and request deletion** — see Section 22 of the Terms and email vidit@serverlesscreed.com to request account closure and data deletion.

### 10.3 How to Exercise Your Rights

Send your request to **vidit@serverlesscreed.com** with sufficient detail for us to verify your identity (typically the email associated with your Account). We may request additional verification if the request appears suspicious. We will respond within the timeframes required by applicable law (generally within thirty (30) days under the DPDP Act and GDPR).

### 10.4 No Discrimination

We will not discriminate against you for exercising any of your privacy rights. However, certain rights (such as deletion of licensing data) may necessarily affect your ability to continue using the Services.

---

## 11. Cookies and Similar Technologies

11.1 **Desktop application.** Buckets by ServerlessCreed is a desktop application and does not use HTTP cookies in the conventional web sense. The Software stores configuration data and preferences in local files, writes deliberately saved static AWS profiles to the owner-only shared AWS credentials file, and protects other persisted secrets with operating-system secure storage. When secure OS storage is unavailable, new secrets are not persistently stored.

11.2 **Website.** The website https://buckets.serverlesscreed.com may use a minimal set of cookies, local storage, and similar technologies, including:

- **Strictly necessary cookies** — required for the website to function (e.g., session, security).
- **Authentication cookies (Clerk)** — maintain your sign-in and protect authenticated account routes.
- **Preference cookies** — remember your settings (e.g., theme).
- **Analytics cookies and identifiers (Google Analytics)** — measure page views, referrers, browser/device information, interactions, and coarse location.
- **Advertising / conversion cookies and identifiers (Reddit and Twitter/X Ads)** — attribute events such as downloads and checkout steps to advertising campaigns.

You can manage cookies through your browser settings, through any cookie banner provided on the website, and through Google, Reddit, and Twitter/X privacy controls. Disabling certain cookies may affect website functionality, attribution, or your ability to stay signed in.

---

## 12. Children's Privacy

12.1 **Not directed at children.** The Services are not intended for, marketed to, or directed at children. For the purposes of this Section, a **"child"** means a person who has not completed eighteen (18) years of age, in line with the definition under the Digital Personal Data Protection Act, 2023 ("**DPDP Act**"). We do not knowingly collect Personal Information from children.

12.2 **Verifiable parental consent (DPDP Act §9(1)).** Where we become aware that we are about to process the Personal Information of a child, we will obtain **verifiable consent** from the parent or lawful guardian before doing so, in such manner as may be prescribed by the rules made under the DPDP Act. We will not process a child's Personal Information without such consent, except as expressly permitted by the Act or the rules thereunder.

12.3 **Statutory prohibitions (DPDP Act §9(3)).** We do **not**, and will not, with respect to children:

(a) undertake processing of Personal Information that is likely to cause any detrimental effect on the well-being of a child;
(b) engage in **tracking** or **behavioural monitoring** of children; or
(c) engage in **targeted advertising** directed at children.

These prohibitions apply irrespective of whether the parent has consented to other processing.

12.4 **Discovery and deletion.** If we become aware that we have collected Personal Information from a child without the required verifiable parental consent, we will **delete that information promptly** and take reasonable steps to prevent further such collection. If you believe we have collected Personal Information from a child, please contact us at vidit@serverlesscreed.com and we will investigate and act within thirty (30) days.

12.5 **Persons with disabilities.** Where we process the Personal Information of a person with disability who has a lawful guardian, we will obtain consent of the lawful guardian in the manner prescribed under the DPDP Act.

---

## 13. Third-Party Links and Services

13.1 The Services may contain links to third-party websites, services, or content (including AWS console pages, documentation, and payment processor pages). We are not responsible for the privacy practices of those third parties.

13.2 In particular, your use of **Amazon Web Services** is governed by the AWS Customer Agreement and the AWS Privacy Notice. ServerlessCreed has no control over how AWS processes your data.

13.3 Before providing Personal Information to any third party reached through the Services, please review that party's privacy practices.

---

## 14. Grievance Officer

In accordance with Rule 5 of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 and Sections 8(10) and 13 of the DPDP Act, 2023, we have appointed a Grievance Officer to address concerns and complaints regarding the processing of your Personal Information.

- **Name:** Vidit Jinesh Shah
- **Designation:** Proprietor and Grievance Officer
- **Email:** vidit@serverlesscreed.com
- **Postal Address:** Khetwadi-11, Mumbai, India

We will:

- **acknowledge** receipt of your grievance within **seven (7) business days**;
- **resolve** the grievance within **thirty (30) days** of receipt, in line with Rule 5(9) of the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 and the expectations under the DPDP Act, 2023; and
- inform you in writing of the outcome, including the steps taken and any further options available to you.

If we require additional information or time to investigate a complex grievance, we will communicate this to you before the 30-day period expires and provide a revised timeline.

If you are not satisfied with our response, you may approach the **Data Protection Board of India** (once established under the DPDP Act) or any other competent regulatory authority. Indian users may also approach the appropriate **Consumer Disputes Redressal Commission** under the Consumer Protection Act, 2019, where applicable.

---

## 15. Changes to this Privacy Policy

15.1 We may update this Privacy Policy from time to time to reflect changes in our practices, the Services, or applicable law. The "Last Updated" date at the top of this Policy indicates when it was most recently revised.

15.2 If we make **material changes** that affect how we process your Personal Information, we will notify you by email (to the address on file) or through a prominent notice in the Software or on our website, at least thirty (30) days before the change takes effect, except where a shorter notice period is required by law.

15.3 Your continued use of the Services after a change takes effect constitutes acceptance of the updated Policy.

---

## 16. Jurisdiction-Specific Notices

### 16.1 India (DPDP Act, 2023)

This Policy is intended to be read consistently with the DPDP Act. For purposes of the DPDP Act:

- **Data Fiduciary:** Serverless Creed (the sole proprietorship of Mr. Vidit Jinesh Shah).
- **Grievance Officer:** See Section 14.
- **Significant Data Fiduciary status:** We are not currently designated as a Significant Data Fiduciary under Section 10 of the DPDP Act. If that changes, we will appoint a Data Protection Officer and update this Policy.

### 16.2 European Economic Area / United Kingdom (GDPR / UK GDPR)

If you are in the EEA or the UK, you have additional rights under the GDPR / UK GDPR, including the rights to data portability and to lodge a complaint with your local supervisory authority. You may also object to processing based on legitimate interests. We do not currently have an EU/UK representative; if you require one for the exercise of your rights, please contact us, and we will work in good faith to facilitate.

### 16.3 California (CCPA / CPRA)

If you are a California resident, you have the right to know what categories of Personal Information we collect, to request deletion, to correct inaccurate information, and to opt out of "sale" or "sharing" of Personal Information. We do not "sell" or "share" Personal Information as those terms are defined under the CCPA/CPRA. To exercise California rights, contact vidit@serverlesscreed.com.

---

## 17. Contact Us

For any questions, requests, or complaints regarding this Privacy Policy or our processing of your Personal Information:

- **Email (General, Support, Privacy, and Grievance):** vidit@serverlesscreed.com
- **Postal Address:** Khetwadi-11, Mumbai, India
- **Website:** https://buckets.serverlesscreed.com
- **GSTIN:** 27FZZPS3310E1ZX

---
