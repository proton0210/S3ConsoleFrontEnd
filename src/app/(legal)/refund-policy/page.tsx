/** Refund Policy — scaffold; legal review required. */
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

export const metadata = {
  title: "Refund Policy — S3Console",
};

export default function RefundPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
      <h1>Refund Policy</h1>
      <p>
        <em>Last updated: {LEGAL_VERSIONS.refund}</em>
      </p>

      <h2>Trials are free — no refund needed</h2>
      <p>
        We offer a 14-day fully-featured trial precisely so you can decide
        before buying. If a trial converts to paid and the conversion was
        unintentional, contact support within 7 days for a refund.
      </p>

      <h2>Monthly &amp; Yearly subscriptions</h2>
      <p>
        14-day money-back guarantee from the date of initial purchase. Email
        <a href="mailto:vidit@serverlesscreed.com"> vidit@serverlesscreed.com</a> with
        your order details.
      </p>

      <h2>Lifetime ($99 one-time)</h2>
      <p>
        7-day money-back guarantee. Lifetime refunds outside this window are
        considered case-by-case and not guaranteed.
      </p>

      <h2>Chargebacks</h2>
      <p>
        Initiating a chargeback without first contacting support results in
        immediate license revocation. We always prefer to make it right —
        please reach out before disputing through your bank.
      </p>
    </main>
  );
}
