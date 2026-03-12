import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - S3Console",
  description:
    "Privacy Policy for S3Console. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-16 sm:px-10">
        <header className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mt-6">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mt-2">
            Last updated: March 12, 2026
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              S3Console (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              operates the website at{" "}
              <a
                href="https://s3console.com"
                className="text-primary hover:underline"
              >
                s3console.com
              </a>{" "}
              and the S3Console desktop application. This Privacy Policy
              describes how we collect, use, store, and share your personal
              information when you use our website and services. By using
              S3Console, you consent to the practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-medium mt-4 mb-2">
              2.1 Account Information
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect your name, email address,
              and profile information through our authentication provider, Clerk.
              This information is necessary to provide you with access to your
              account, manage your license, and deliver customer support.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">
              2.2 Payment Information
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Payments are processed by Dodo Payments. We do not store your
              credit card number or full payment details on our servers. Dodo
              Payments handles all payment processing in accordance with PCI-DSS
              standards. We receive and store transaction identifiers, purchase
              status, and the product purchased to manage your license.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">
              2.3 Usage &amp; Analytics Data
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We use PostHog to collect anonymized usage analytics on our
              website, including pages visited, feature interactions, referral
              sources, browser type, device type, and session duration. This data
              helps us understand how users interact with S3Console so we can
              improve the product.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">
              2.4 License &amp; Device Data
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              To manage your software license, we store license keys, the number
              of machines registered, and machine identifiers in our database
              (AWS DynamoDB). This allows us to enforce license limits and
              provide you with device management features.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">
              2.5 AWS Credentials (Desktop App)
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              The S3Console desktop application requires your AWS credentials
              (access keys, SSO sessions, or profile configurations) to connect
              to your Amazon S3 buckets.{" "}
              <strong>
                Your AWS credentials are stored locally on your device only and
                are never transmitted to or stored on our servers.
              </strong>{" "}
              All S3 operations are executed directly between your machine and
              AWS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Account management:</strong> Authenticate your identity,
                manage your license, and provide access to downloads.
              </li>
              <li>
                <strong>Payment processing:</strong> Complete purchases, issue
                license keys, and handle refund requests.
              </li>
              <li>
                <strong>Product improvement:</strong> Analyze aggregated usage
                patterns to improve S3Console features and user experience.
              </li>
              <li>
                <strong>Communications:</strong> Send transactional emails
                (purchase confirmations, license keys, support responses) via
                Resend. We will never send marketing emails without your explicit
                consent.
              </li>
              <li>
                <strong>Advertising measurement:</strong> We use a Twitter
                (X) conversion tracking pixel to measure the effectiveness of
                our advertising campaigns. This pixel may collect anonymized
                interaction data.
              </li>
              <li>
                <strong>Security &amp; fraud prevention:</strong> Detect and
                prevent unauthorized access, license abuse, and fraudulent
                activity.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We rely on trusted third-party services to operate S3Console. Each
              has its own privacy policy governing how they handle your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Clerk</strong> &mdash; Authentication and user
                management.{" "}
                <a
                  href="https://clerk.com/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <strong>Dodo Payments</strong> &mdash; Payment processing.{" "}
                <a
                  href="https://dodopayments.com/legal/privacy-policy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <strong>PostHog</strong> &mdash; Product analytics.{" "}
                <a
                  href="https://posthog.com/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <strong>AWS DynamoDB</strong> &mdash; Data storage for license
                and account records.{" "}
                <a
                  href="https://aws.amazon.com/privacy/"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <strong>Resend</strong> &mdash; Transactional email delivery.{" "}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <strong>Twitter (X)</strong> &mdash; Conversion tracking pixel
                for advertising measurement.{" "}
                <a
                  href="https://twitter.com/en/privacy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              5. Cookies &amp; Tracking Technologies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website uses cookies and similar technologies for
              authentication sessions (Clerk), analytics (PostHog), and
              advertising measurement (Twitter pixel). These may include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-3">
              <li>
                <strong>Essential cookies:</strong> Required for authentication
                and core website functionality.
              </li>
              <li>
                <strong>Analytics cookies:</strong> Help us understand usage
                patterns and improve the product.
              </li>
              <li>
                <strong>Advertising cookies:</strong> Used by the Twitter pixel
                to measure ad campaign performance.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can control cookie preferences through your browser settings.
              Disabling certain cookies may affect your ability to use some
              features of the website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              6. Data Storage &amp; Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your account and license data is stored securely using AWS
              DynamoDB with encryption at rest. We implement
              industry-standard security measures including HTTPS encryption for
              all data in transit, access controls, and regular security reviews.
              While no method of transmission or storage is 100% secure, we
              strive to protect your personal information using commercially
              reasonable means.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              7. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account and license data for as long as your
              account is active or as needed to provide you with our services.
              If you request account deletion, we will remove your personal
              data within 30 days, except where we are required to retain it
              for legal or legitimate business purposes (e.g., transaction
              records for tax compliance).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              8. Data Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, rent, or trade your personal information to third
              parties. We only share data with the third-party service providers
              listed in Section 4, strictly for the purposes of operating
              S3Console. We may disclose your information if required by law,
              court order, or governmental regulation, or to protect the rights,
              property, or safety of S3Console, our users, or the public.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                data and account.
              </li>
              <li>
                <strong>Portability:</strong> Request your data in a structured,
                machine-readable format.
              </li>
              <li>
                <strong>Objection:</strong> Object to certain processing of your
                data, including direct marketing.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:vidit@serverlesscreed.com"
                className="text-primary hover:underline"
              >
                vidit@serverlesscreed.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              10. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              S3Console is not directed at individuals under the age of 16. We
              do not knowingly collect personal information from children. If we
              become aware that we have inadvertently collected data from a
              child under 16, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              11. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the updated policy
              on this page with a revised &quot;Last updated&quot; date. Your
              continued use of S3Console after any changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns about this Privacy Policy or
              our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-3">
              <strong>S3Console</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:vidit@serverlesscreed.com"
                className="text-primary hover:underline"
              >
                vidit@serverlesscreed.com
              </a>
              <br />
              Website:{" "}
              <a
                href="https://s3console.com"
                className="text-primary hover:underline"
              >
                s3console.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
