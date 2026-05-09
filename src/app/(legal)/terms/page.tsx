/**
 * Terms of Service — SCAFFOLD ONLY.
 *
 * This is starter copy. Get a real lawyer to review before launch.
 */
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

export const metadata = {
  title: "Terms of Service — S3Console",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
      <h1>Terms of Service</h1>
      <p>
        <em>Last updated: {LEGAL_VERSIONS.terms}</em>
      </p>

      <h2>1. Acceptance</h2>
      <p>
        By installing or using S3Console (the &ldquo;Software&rdquo;), you agree to these
        Terms. If you do not agree, do not use the Software.
      </p>

      <h2>2. Account &amp; License</h2>
      <p>
        S3Console grants you a non-exclusive, non-transferable license to use
        the Software on up to two (2) machines per active license. You agree
        not to share, sub-license, reverse-engineer, or redistribute the
        Software or its license keys.
      </p>

      <h2>3. Trial</h2>
      <p>
        We offer a 14-day free trial with full feature access. The trial is
        machine-locked and cannot be reset by reinstallation. No payment
        information is required to start.
      </p>

      <h2>4. Subscription &amp; Payment</h2>
      <p>
        Monthly and yearly plans automatically renew at the end of each
        billing cycle until canceled. You may cancel anytime from the in-app
        license menu or your customer portal. Lifetime is a one-time payment
        with no recurring billing.
      </p>

      <h2>5. Refunds</h2>
      <p>See the separate <a href="/refund-policy">Refund Policy</a>.</p>

      <h2>6. Acceptable Use</h2>
      <p>
        You may not use S3Console to violate AWS&rsquo; Acceptable Use Policy or any
        applicable law. You are responsible for the AWS credentials and
        actions taken under your account through the Software.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        S3Console is provided &ldquo;as is&rdquo;. To the maximum extent permitted by
        law, our liability is limited to the amount you paid for the
        Software in the 12 months preceding the claim.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your license for breach of these Terms,
        chargebacks, or fraud. License revocation halts all activated
        machines.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These Terms are governed by the laws of [JURISDICTION TO BE FILLED IN
        BY LEGAL REVIEW]. Disputes will be resolved in courts located in that
        jurisdiction.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions: <a href="mailto:vidit@serverlesscreed.com">vidit@serverlesscreed.com</a>.
      </p>
    </main>
  );
}
