import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Cloud,
  Database,
  ExternalLink,
  FileCheck2,
  HardDrive,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  RefreshCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type Product = "tables" | "buckets";

const products = {
  tables: {
    name: "Serverless Tables",
    awsService: "Amazon DynamoDB",
    customerData: "DynamoDB table items",
    awsResource: "tables",
    credentialStorage:
      "Serverless Tables resolves the standard AWS credential chain locally, including SSO, roles, temporary tokens, environment variables, and shared AWS profiles. If you choose to save a static profile, it is written to the standard shared credentials file with owner-only permissions. In-app protected values use Electron safeStorage when the operating-system keychain is available; otherwise the app uses a reduced-protection, owner-only local fallback and warns through its security posture. Secrets are never sent to ServerlessCreed.",
  },
  buckets: {
    name: "Serverless Buckets",
    awsService: "Amazon S3",
    customerData: "S3 objects",
    awsResource: "buckets",
    credentialStorage:
      "Serverless Buckets resolves AWS CLI, SSO, role, temporary-token, and static profiles locally. Credentials saved through the app are passed to a main-process encrypted store protected by Electron safeStorage when the operating-system keychain is available. Legacy browser storage is migrated once and removed. If secure OS storage is unavailable, the app uses a reduced-protection local encrypted fallback; use AWS SSO or short-lived roles plus full-disk encryption on such systems. Secrets are never sent to ServerlessCreed.",
  },
} as const;

const subprocessors = [
  ["Amazon Web Services", "Website, identity/licensing control plane, protected metadata stores, logs, backups, and update delivery", "Account, entitlement, device, operational, and delivery metadata — not customer AWS content"],
  ["Clerk", "Account authentication and session management", "Verified email, stable subject, profile subset, OAuth/provider and session metadata"],
  ["Dodo Payments", "Checkout, payment, subscription, tax, and refund processing", "Billing contact and transaction/subscription metadata; full card number and CVV do not reach ServerlessCreed"],
  ["Resend", "Transactional email delivery", "Recipient address and delivery/message metadata"],
  ["Google Analytics", "Website traffic measurement", "Page, referrer, browser/device, interaction, and coarse-location data"],
  ["Reddit and X", "Website advertising attribution", "Visit, cookie, campaign, and conversion-event data"],
  ["Google Workspace", "Security, privacy, legal, and support communications", "Message, sender, attachment, and delivery metadata you choose to provide"],
  ["GitHub", "Source control, CI security checks, and public release notes", "Build/release metadata; no customer AWS content"],
] as const;

const retention = [
  ["Account and entitlement", "Life of the account/license or subscription, plus 7 years where required for tax, accounting, fraud prevention, or legal claims"],
  ["Payment records", "7 years; payment processor retention may also apply"],
  ["Support and security correspondence", "Up to 3 years after the last contact, unless a longer legal hold is required"],
  ["Optional identifiable diagnostics", "Up to 13 months, then deleted or anonymized"],
  ["Aggregated usage reports", "Anonymized or aggregated; retained without direct account identifiers"],
  ["Backups", "Up to 90 days beyond deletion from the primary store"],
  ["Verified deletion request", "Targeted within 30 days, except information subject to a lawful retention duty or hold"],
] as const;

const releases = [
  {
    product: "Serverless Tables",
    version: "3.2.5",
    date: "23 August 2026",
    summary: "Runtime packaging repair and platform startup validation, with publication kept behind release gates.",
    href: "https://github.com/proton0210/DynoConsole/releases/tag/v3.2.5",
  },
  {
    product: "Serverless Buckets",
    version: "2.7.3",
    date: "23 August 2026",
    summary: "Branded multi-platform packages and atomic versioned delivery, with public updater publication gated on all platforms.",
    href: "https://github.com/proton0210/s3Console/releases/tag/v2.7.3",
  },
] as const;

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{copy}</p>
    </div>
  );
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "slate" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function TrustCenter({ product }: { product: Product }) {
  const current = products[product];

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-10 sm:py-28">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill>Public Trust Center</StatusPill>
            <span className="text-sm text-muted-foreground">Last reviewed 24 August 2026</span>
          </div>
          <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
            Your AWS account remains the data plane.
          </h1>
          <blockquote className="mt-8 max-w-4xl border-l-4 border-primary pl-5 text-xl font-medium leading-8 sm:text-2xl sm:leading-9">
            Your AWS data stays between your desktop and your AWS account. ServerlessCreed does not proxy or store table items or S3 objects.
          </blockquote>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {current.name} sends signed AWS API requests from your computer directly to {current.awsService}. Our separate control plane handles account identity, device ownership, billing state, and short-lived product entitlements — never your {current.customerData}.
          </p>
          <nav aria-label="Trust Center sections" className="mt-10 flex flex-wrap gap-3 text-sm font-medium">
            {["architecture", "data", "credentials", "security", "policies", "releases"].map((section) => (
              <a key={section} href={`#${section}`} className="rounded-full border bg-white px-4 py-2 capitalize shadow-sm transition hover:border-primary hover:text-primary">
                {section}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/10 px-5 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
          {[
            ["Customer data path", "Direct to your AWS account", "verified"],
            ["Control-plane hardening", "V2 subject/device controls in rollout", "progress"],
            ["Independent pentest", "Required before Marketplace launch", "planned"],
            ["Release assurance", "Windows signing/checksums still gated", "progress"],
          ].map(([label, value, status]) => (
            <div key={label} className="bg-slate-950 px-5 py-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-2 text-sm leading-6 text-white">{value}</p>
              <p className={`mt-3 text-xs font-semibold ${status === "verified" ? "text-emerald-400" : status === "planned" ? "text-sky-300" : "text-amber-300"}`}>
                {status === "verified" ? "Verified architecture" : status === "planned" ? "Planned external assurance" : "Open launch gate"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="architecture" className="scroll-mt-24 border-b py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <SectionHeading eyebrow="Architecture" title="Two paths, deliberately separated" copy="Customer AWS content follows the direct data path. Identity, payment state, and entitlements use the ServerlessCreed control path. The control plane cannot read the payloads travelling on the data path." />

          <div className="mt-12 rounded-3xl border bg-slate-50 p-5 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Customer data path</p>
            <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border bg-white p-6">
                <Laptop className="h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">Your desktop</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Resolves the AWS profile you select and signs requests locally with the AWS SDK.</p>
              </div>
              <div className="flex items-center justify-center gap-2 px-2 py-1 text-center text-sm font-semibold text-emerald-800 lg:flex-col">
                <ArrowRight className="hidden h-6 w-6 lg:block" aria-hidden="true" />
                <ArrowDown className="h-6 w-6 lg:hidden" aria-hidden="true" />
                <span>HTTPS directly to AWS</span>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <Cloud className="h-7 w-7 text-emerald-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">Your AWS account</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-950/70">{current.awsService} authorizes each action with your IAM permissions and returns data only to the desktop.</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm leading-6 text-emerald-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <p><strong>ServerlessCreed is not in this network path.</strong> We do not proxy, persist, inspect, back up, or have access to the {current.customerData} returned by AWS.</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Identity and entitlement control path</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                [KeyRound, "Clerk identity", "System-browser OIDC sign-in establishes a verified, stable account subject."],
                [ShieldCheck, "ServerlessCreed control plane", "Binds the subject to owned devices and the effective product entitlement."],
                [FileCheck2, "Desktop entitlement", "Returns a minimized, short-lived signed assertion for offline product access."],
              ].map(([Icon, title, copy]) => {
                const IconComponent = Icon as typeof KeyRound;
                return (
                  <div key={title as string} className="rounded-2xl border bg-slate-50 p-6">
                    <IconComponent className="h-7 w-7 text-sky-700" aria-hidden="true" />
                    <h3 className="mt-4 font-semibold">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy as string}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">Dodo Payments sends verified payment lifecycle events to the control plane. A control-plane outage can affect a new login, activation, or entitlement refresh, but it does not become a proxy for direct AWS operations already authorized on your desktop.</p>
          </div>
        </div>
      </section>

      <section id="data" className="scroll-mt-24 border-b bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <SectionHeading eyebrow="Data inventory" title="What ServerlessCreed collects" copy="This is the operational inventory for the website, desktop licensing services, payments, support, and optional diagnostics. The Privacy Policy remains the controlling legal notice." />
          <div className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Information</th><th className="px-5 py-4 font-semibold">Purpose</th></tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Account and authentication", "Verified email, name/profile subset, Clerk subject, provider identifiers, session/security metadata, and accepted legal-document version", "Sign-in, account security, ownership, and notices"],
                    ["Entitlement and device", "Product, plan, status, legacy license identifier where applicable, subject, pseudonymous machine/device identifier, device count, assertion issue/expiry, app version, OS, locale, and request IP", "Activation, device limits, fraud prevention, entitlement refresh, and support"],
                    ["Payment", "Dodo customer, payment, subscription and transaction references; amount, currency, billing country, tax and partial-card metadata when returned", "Checkout, invoices, subscription lifecycle, refunds, tax, and reconciliation"],
                    ["Website telemetry", "Page, referrer, browser/device, coarse location, cookie or campaign identifiers, and download/purchase conversion events", "Site operations, analytics, abuse prevention, and marketing attribution"],
                    ["Support and security", "Sender details, message, attachments, screenshots, logs, or redacted schemas that you choose to send", "Responding to the request and investigating issues"],
                    ["Optional diagnostics", "Crash/error details, app version, OS, performance and feature events when the diagnostic control is enabled or you submit them", "Reliability and product improvement"],
                    ["Transactional email", "Recipient, message type, send/delivery/bounce metadata", "Receipts, account, license, support, and security communications"],
                    ["Application forms", "If a hiring/internship form is open: contact, education, location, experience, availability, environment, community role, proof, and portfolio links that you submit", "Evaluating and contacting applicants"],
                  ].map(([category, info, purpose]) => (
                    <tr key={category} className="align-top"><th className="px-5 py-4 font-semibold text-foreground">{category}</th><td className="px-5 py-4 leading-6 text-muted-foreground">{info}</td><td className="px-5 py-4 leading-6 text-muted-foreground">{purpose}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-emerald-950"><LockKeyhole className="h-5 w-5" aria-hidden="true" />What we do not collect</h3>
            <p className="mt-3 text-sm leading-6 text-emerald-950/80">ServerlessCreed does not receive or store DynamoDB item contents, S3 objects, AWS access keys, AWS secret keys, session/SSO tokens, table or object query payloads, or full payment-card numbers and CVVs. If you voluntarily attach AWS-derived information to a support request, that copy is treated as support data and follows the support retention period.</p>
          </div>
        </div>
      </section>

      <section id="credentials" className="scroll-mt-24 border-b py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading eyebrow="Credential storage" title="AWS credentials stay under your device and IAM controls" copy="We recommend AWS IAM Identity Center (SSO), role assumption, and other short-lived credentials with the minimum permissions needed for your work." />
          <div className="rounded-3xl border bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <HardDrive className="h-8 w-8 text-orange-300" aria-hidden="true" />
            <h3 className="mt-5 text-xl font-semibold">{current.name} local-storage behavior</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">{current.credentialStorage}</p>
            <div className="mt-6 border-t border-white/10 pt-6 text-sm leading-6 text-slate-300">
              <strong className="text-white">Your responsibility:</strong> secure the workstation, keep the AWS files and OS account private, enable full-disk encryption, prefer short-lived sessions, and scope IAM permissions. The desktop can perform only the AWS actions granted to the selected identity.
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 border-b bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <SectionHeading eyebrow="Security operations" title="Prevention, recovery, and accountable disclosure" copy="These summaries describe the current control intent and the remaining pre-Marketplace assurance gates. They are not a claim of certification." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border bg-white p-7 shadow-sm">
              <Database className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold">Backup and disaster recovery</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Hardened v2 entitlement stores use DynamoDB point-in-time recovery and deletion protection. Daily AWS Backup recovery points are retained for 35 days, and restore procedures are exercised and recorded. Website and infrastructure definitions are version controlled.</p>
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><strong>Customer AWS content is excluded.</strong> Because we do not store it, customers remain responsible for DynamoDB PITR/backups and S3 versioning, replication, retention, or Object Lock as appropriate.</p>
            </article>
            <article id="incident-response" className="scroll-mt-24 rounded-2xl border bg-white p-7 shadow-sm">
              <RefreshCcw className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold">Incident response</h3>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {["Detect and triage with severity, scope, ownership, and an incident record.", "Contain affected identities, devices, services, keys, or deployment paths while preserving evidence.", "Eradicate the cause, rotate exposed material, recover from verified state, and monitor for recurrence.", "Notify affected customers without undue delay and as applicable law requires, using account email and this site.", "Complete a post-incident review, track corrective actions, and retain evidence under access control."].map((item, index) => <li key={item} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</span><span>{item}</span></li>)}
              </ol>
            </article>
            <article id="vulnerability-disclosure" className="scroll-mt-24 rounded-2xl border bg-white p-7 shadow-sm lg:col-span-2">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold">Vulnerability disclosure policy</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Email <a className="font-medium text-primary underline underline-offset-4" href="mailto:vidit@serverlesscreed.com?subject=%5BSECURITY%5D%20ServerlessCreed%20vulnerability">vidit@serverlesscreed.com</a> with <strong>[SECURITY]</strong>, the affected product/version, reproducible steps, impact, and safely redacted evidence. We target acknowledgment within 3 business days and initial triage within 7 business days; these targets are not a contractual SLA.</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">Do not access another person’s data, disrupt service, destroy or alter data, exfiltrate secrets, maintain persistence, use social engineering, or test real payment transactions. Stop and report immediately if customer data appears. Use test accounts and the minimum proof needed.</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm leading-6 text-emerald-950/80">
                  <h4 className="font-semibold text-emerald-950">Good-faith safe harbor</h4>
                  <p className="mt-3">We will treat research that follows this policy, is conducted in good faith, and is promptly reported as authorized to the extent we can grant authorization. We will not initiate legal action solely for that compliant research. This does not authorize activity against third-party systems, including customer AWS accounts.</p>
                  <a href="/.well-known/security.txt" className="mt-4 inline-flex items-center gap-1 font-semibold text-emerald-900 underline underline-offset-4">security.txt <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
              <TriangleAlert className="h-7 w-7 text-amber-700" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold text-amber-950">Independent penetration test</h3>
              <StatusPill tone="amber">Planned — not yet completed</StatusPill>
              <p className="mt-4 text-sm leading-6 text-amber-950/75">An independent security professional must test identity, cross-tenant authorization, device ownership, entitlements, webhooks, desktop credential/IPC boundaries, updater integrity, and the AWS perimeter before Marketplace launch. The acceptance gate is zero open critical or high findings, with retest evidence.</p>
              <p className="mt-3 text-sm leading-6 text-amber-950/75">A publishable executive summary or remediation attestation will be linked here only after the assessment and required remediation are complete. No pentest certification is claimed today.</p>
            </article>
            <article className="rounded-2xl border bg-white p-7 shadow-sm">
              <BadgeCheck className="h-7 w-7 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-semibold">Desktop updates and code signing</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li><strong className="text-foreground">macOS:</strong> current artifacts are Developer ID signed, notarized, and stapled.</li>
                <li><strong className="text-foreground">Windows:</strong> current public installers are not Authenticode signed. A future public release is gated on a trusted signing provider and successful verification.</li>
                <li><strong className="text-foreground">Checksums:</strong> release workflows generate SHA-256 manifests, but the current public versions do not yet have publisher-authenticated manifests. Publication remains a launch blocker.</li>
                <li><strong className="text-foreground">Release policy:</strong> candidates stay unpublished until required platform, signing, notarization, packaging, and checksum gates pass.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="policies" className="scroll-mt-24 border-b py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <SectionHeading eyebrow="Policies and commitments" title="Terms you can review before purchase" copy="These public documents and operational summaries apply to direct purchases. The Marketplace addendum becomes effective only when an AWS Marketplace listing expressly references it." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Privacy Policy", "/privacy", "Collection, use, rights, security, and retention"],
              ["Terms of Service", "/terms", "Commercial terms, support, warranties, and liability"],
              ["Desktop EULA", "/eula", "Software license, use restrictions, updates, and AWS responsibilities"],
              ["Marketplace EULA", "/marketplace-eula", "Future Marketplace order and entitlement addendum"],
            ].map(([title, href, copy]) => (
              <Link key={href} href={href} className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary">
                <FileCheck2 className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold group-hover:text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <article>
              <h3 className="text-2xl font-semibold">Data retention</h3>
              <div className="mt-5 divide-y overflow-hidden rounded-2xl border bg-white">
                {retention.map(([category, period]) => <div key={category} className="grid gap-1 px-5 py-4 sm:grid-cols-[0.8fr_1.2fr] sm:gap-5"><p className="text-sm font-semibold">{category}</p><p className="text-sm leading-6 text-muted-foreground">{period}</p></div>)}
              </div>
            </article>
            <article>
              <h3 className="text-2xl font-semibold">Support and uptime commitment</h3>
              <div className="mt-5 rounded-2xl border bg-slate-50 p-6">
                <Clock3 className="h-7 w-7 text-primary" aria-hidden="true" />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Current public support is best-effort email support at <a className="font-medium text-primary underline underline-offset-4" href="mailto:vidit@serverlesscreed.com">vidit@serverlesscreed.com</a>. Unless a separate signed order or Marketplace listing states otherwise, there is no guaranteed response or resolution time and no contractual uptime percentage.</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">The desktop-to-AWS data path has no ServerlessCreed proxy. Availability of AWS services and your network is governed by your AWS relationship. ServerlessCreed control-plane availability affects functions such as new login, activation, account management, and entitlement refresh.</p>
              </div>
            </article>
          </div>

          <article className="mt-12">
            <h3 className="text-2xl font-semibold">Current subprocessors and service providers</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">No desktop crash-reporting provider is currently listed as continuously receiving customer AWS content. Optional diagnostics are user-controlled or deliberately submitted. Provider scope can change only with corresponding notice and policy updates.</p>
            <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-950 text-white"><tr><th className="px-5 py-4">Provider</th><th className="px-5 py-4">Purpose</th><th className="px-5 py-4">Data involved</th></tr></thead>
                  <tbody className="divide-y">{subprocessors.map(([name, purpose, data]) => <tr key={name} className="align-top"><th className="px-5 py-4 font-semibold">{name}</th><td className="px-5 py-4 leading-6 text-muted-foreground">{purpose}</td><td className="px-5 py-4 leading-6 text-muted-foreground">{data}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="releases" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Versions and release notes</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Current public desktop releases</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">Release notes are published from the product repositories. The assurance status above applies even when a version is downloadable.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {releases.map((release) => (
              <article key={release.product} className="rounded-2xl border border-white/10 bg-white/5 p-7">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold">{release.product}</h3><StatusPill tone="slate">v{release.version}</StatusPill></div>
                <p className="mt-3 text-sm text-slate-400">Published {release.date}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">{release.summary}</p>
                <a href={release.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-200">Read release notes <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-semibold">Security, privacy, or procurement question?</h3><p className="mt-2 text-sm text-slate-300">Use [SECURITY] for vulnerability reports so they are triaged separately.</p></div>
            <a href="mailto:vidit@serverlesscreed.com" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"><Mail className="h-4 w-4" aria-hidden="true" />vidit@serverlesscreed.com</a>
          </div>
        </div>
      </section>
    </main>
  );
}
