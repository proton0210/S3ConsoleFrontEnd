/** EULA — scaffold; legal review required. */
import { LEGAL_VERSIONS } from "@/lib/legalVersions";

export const metadata = {
  title: "End User License Agreement — S3Console",
};

export default function EulaPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
      <h1>End User License Agreement</h1>
      <p>
        <em>Last updated: {LEGAL_VERSIONS.eula}</em>
      </p>

      <h2>1. License Grant</h2>
      <p>
        Subject to your compliance with these terms and timely payment of
        applicable fees, S3Console grants you a non-exclusive,
        non-transferable, revocable license to install and use the Software
        on up to two (2) machines per active license at any one time.
      </p>

      <h2>2. Restrictions</h2>
      <p>You may NOT:</p>
      <ul>
        <li>Reverse-engineer, decompile, or disassemble the Software.</li>
        <li>Modify or create derivative works of the Software.</li>
        <li>Distribute, sub-license, or rent the Software.</li>
        <li>Share your license key with others.</li>
        <li>Use the Software to violate any applicable law or AWS&rsquo; AUP.</li>
      </ul>

      <h2>3. Ownership</h2>
      <p>
        S3Console retains all right, title, and interest in the Software,
        including all intellectual property rights. This EULA does not
        transfer ownership.
      </p>

      <h2>4. Updates</h2>
      <p>
        Active subscriptions and lifetime licenses include all updates
        published during the license term. Updates are governed by this
        EULA.
      </p>

      <h2>5. Termination</h2>
      <p>
        Your license terminates automatically if you breach this EULA. Upon
        termination, you must uninstall and stop using the Software.
      </p>
    </main>
  );
}
