# S3Console — Privacy Policy

**Effective Date:** 22 May 2026
**Last Updated:** 22 May 2026
**Version:** 1.0

This Privacy Policy describes how **Serverless Creed** ("**ServerlessCreed**", "**we**", "**us**", or "**our**") — a sole proprietorship organized under the laws of India, operating under GSTIN 27FZZPS3310E1ZX, with principal place of business at Khetwadi-11, Mumbai, India — collects, uses, shares, and protects personal information in connection with the S3Console desktop application, the website at https://s3console.com, and related services (collectively, the "**Services**").

For the avoidance of doubt and for purposes of statutory disclosure under Indian law, Serverless Creed is the registered trade name of a sole proprietorship of which Mr. Vidit Jinesh Shah is the proprietor. The proprietor is the natural person who is the Data Fiduciary under the Digital Personal Data Protection Act, 2023, acting through the business known as Serverless Creed.

This Policy is intended to comply with the **Digital Personal Data Protection Act, 2023** ("**DPDP Act**") and the **Information Technology Act, 2000** of India, and to provide additional rights commonly granted to users in other jurisdictions (such as the EU/UK GDPR). It is incorporated by reference into the [Terms and Conditions](terms-and-conditions.md).

By using the Services, you acknowledge that you have read and understood this Policy. If you do not agree with this Policy, please do not use the Services.

---

## 1. Summary in Plain English

Before the legal detail, here is what matters most:

- **S3Console runs locally on your computer.** Your AWS credentials, S3 object contents, bucket listings, and other AWS data are sent **directly from your machine to AWS** using credentials you provide. They are **not routed through, stored on, or accessible to ServerlessCreed's servers**.
- We collect only the **minimum personal information** needed to operate the Services: your **email** (for licensing and support), a **device fingerprint** (to prevent license abuse), **payment information** (handled by our payment processor — we do not store card numbers), and **optional, opt-out diagnostics**.
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

2.6 **"Customer Content"** means data accessed, viewed, modified, uploaded, or downloaded by you using S3Console in connection with your own AWS account (including S3 object contents, bucket listings, metadata, and AWS credentials). Customer Content is **not** Personal Information of ServerlessCreed for purposes of this Policy; you are the data fiduciary/controller of Customer Content.

---

## 3. Scope

3.1 This Policy applies to:

(a) the **S3Console desktop application** distributed by ServerlessCreed;
(b) the **website at https://s3console.com** and any subdomains; and
(c) related sales, billing, licensing, and support interactions you have with us.

3.2 This Policy does **not** apply to:

(a) **Amazon Web Services (AWS)**, which is operated independently by Amazon Web Services, Inc. Your use of AWS is governed by AWS's own privacy notices and your agreement with AWS.
(b) **Third-party services** linked from the Services (e.g., payment processors, identity providers). These services have their own privacy policies, which you should review.
(c) **Customer Content**, which you control and which does not pass through our infrastructure.

---

## 4. Information We Collect

We collect Personal Information in three ways: (a) you provide it directly, (b) it is collected automatically when you use the Services, and (c) we receive it from third parties (e.g., payment processors).

### 4.1 Information You Provide

(a) **Account and licensing information.** When you start a free trial, purchase a Subscription, or activate a License Key, we collect:

- Email address
- Name (if provided)
- Country / billing region (if provided)
- License Key (generated by us and tied to you)
- Acceptance status of our legal documents (Terms, Privacy Policy, EULA) and the version accepted

(b) **Payment information.** When you purchase a Subscription, payment information (card number, billing address, transaction details) is collected and processed by our **third-party payment processor**. We **do not store full card numbers or CVV** on our systems. We retain only the transaction reference, the amount, the currency, and a partial card identifier (e.g., last 4 digits and brand) as needed for invoicing, refund processing, and accounting.

(c) **Support communications.** When you contact us by email or other channels, we receive any information you choose to provide, including your name, email, the content of your message, and any attachments.

(d) **Feedback and surveys.** If you voluntarily participate in surveys, beta programs, or product feedback, we receive the responses you provide.

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

(e) **Website analytics.** When you visit https://s3console.com, we may use privacy-conscious analytics (such as page-view counts, referrer, country-level location, browser type) to understand site traffic. We strive to minimize the use of tracking cookies.

### 4.3 Information We Receive from Third Parties

(a) **Payment processor data.** Our payment processor confirms the success or failure of transactions and provides a transaction reference, a partial card identifier, the billing country, and the amount.

(b) **Identity / login providers.** If we offer sign-in via a third-party identity provider (e.g., Google, GitHub) in future versions, we will receive a subset of your profile information (typically email, name) per your authorization with that provider.

### 4.4 Information We Do **Not** Collect

To be explicit, **the following Customer Content is NOT collected, transmitted to, or stored by ServerlessCreed**:

- The contents of S3 objects (files, blobs, documents) stored in your AWS account.
- Bucket listings, prefixes, object keys, object metadata, or tags from your AWS account.
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
| Provide, operate, and maintain the Services you signed up for | Email, License Key, device fingerprint, IP, OS, Software version | Consent (§6) for sign-up; and §7(a) — data voluntarily provided for the specified purpose of obtaining the Services |
| Process payments and prevent fraud | Email, payment metadata, transaction history, IP | §7(g) — compliance with applicable law (Income Tax Act, GST law, anti-money-laundering rules); and consent (§6) for the underlying transaction |
| Validate license activations and enforce per-user licensing | Email, License Key, device fingerprint, IP | Consent (§6) given at the time of License acceptance; and §7(a) — for the specified purpose of license enforcement |
| Provide customer support and respond to enquiries you initiate | Email, support message content | §7(a) — data voluntarily provided for the specified purpose of receiving support; consent (§6) for any sensitive information you choose to share |
| Notify you about Software updates, security advisories, and material changes to the Services or to legal documents | Email | §7(a) — voluntarily provided for the purpose of receiving the Services; transactional communications inherent to the License relationship |
| Improve product quality through diagnostics and usage analytics (only if you have **not opted out**) | Crash data, anonymous usage events, OS, Software version | Consent (§6) — opt-out architecture; consent is deemed withdrawn upon disabling in Settings |
| Comply with legal obligations (e.g., tax, accounting, anti-money-laundering, court orders, regulatory requests) | Email, billing details, transaction history | §7(g) — compliance with any law in force in India |
| Defend, investigate, and resolve disputes; enforce our [Terms and Conditions](terms-and-conditions.md) and [EULA](eula.md) | All categories as relevant | §7(i) — purposes connected with employment, or the exercise or defence of legal claims (read with the residual statutory power to process for lawful purposes) |

We do **not**:

- Sell Personal Information.
- Rent or lease Personal Information.
- Use Personal Information for "targeted advertising" or behavioral profiling.
- Process Personal Information through automated decision-making with legal or similarly significant effects on you.

---

## 6. How We Share Personal Information

We share Personal Information only with the categories of recipients below, and only as necessary for the purposes described in Section 5.

### 6.1 Service Providers (Data Processors)

We engage third-party service providers to operate the Services. These providers process Personal Information **on our behalf** under contracts that require them to protect it and use it only for the purposes we specify. Current categories include:

- **Cloud infrastructure providers** (e.g., Amazon Web Services) — host our licensing backend, update servers, and website. Data may be processed in AWS regions both inside and outside India.
- **Payment processors** — process payments and store cardholder data subject to PCI-DSS requirements. We do not have access to full card numbers.
- **Email delivery providers** — deliver transactional emails (license keys, receipts, support replies).
- **Error and crash reporting providers** — receive diagnostic data when you have not opted out.
- **Analytics providers** — receive anonymized usage data when you have not opted out.
- **Customer support tools** — store the content of your support tickets and our replies.

We periodically review service providers for compliance with applicable data-protection law.

### 6.2 Legal and Regulatory Disclosures

We may disclose Personal Information when we believe in good faith that disclosure is required to:

(a) comply with applicable law, regulation, legal process, or governmental request (including from authorities in India under the DPDP Act, the IT Act, or court orders);
(b) enforce our [Terms and Conditions](terms-and-conditions.md) or other agreements;
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
| Backups | Up to ninety (90) days beyond the primary retention period |

If you request deletion of your data under Section 10 below, we will delete or anonymize within thirty (30) days, except where retention is required by law (e.g., tax records, fraud-prevention obligations).

---

## 9. Data Security

9.1 We implement reasonable technical and organizational measures to protect Personal Information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access, including:

- Encryption of data in transit (HTTPS/TLS) for all communications with our servers.
- Encryption of payment data at the payment processor's end (PCI-DSS compliant).
- Storage of AWS credentials locally on your device using OS-level secure storage where available.
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

11.1 **Desktop application.** S3Console is a desktop application and does not use HTTP cookies in the conventional web sense. The Software stores configuration data, preferences, AWS credentials, and License Keys in **local files and operating-system-provided secure storage** on your device.

11.2 **Website.** The website https://s3console.com may use a minimal set of cookies, local storage, and similar technologies, including:

- **Strictly necessary cookies** — required for the website to function (e.g., session, security).
- **Preference cookies** — remember your settings (e.g., theme).
- **Analytics cookies (optional)** — anonymized aggregate visit statistics. Subject to your consent where required by law.

You can manage cookies through your browser settings and through any cookie banner provided on the website. Disabling certain cookies may affect website functionality.

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
- **Website:** https://s3console.com
- **GSTIN:** 27FZZPS3310E1ZX

---

> **Note on legal review.** This Privacy Policy is drafted to align with the Digital Personal Data Protection Act, 2023, the IT Act, 2000 and rules thereunder, and common international privacy regimes (GDPR, CCPA). Before publication, it should be reviewed and signed off by qualified Indian legal counsel — in particular for: alignment with the DPDP Rules once notified, accuracy of retention periods against your actual data-handling practices, alignment with the specific service providers you engage (payment processor, analytics provider, error reporter), and accuracy of the cross-border transfer language against any future Central Government notifications restricting destination countries.
