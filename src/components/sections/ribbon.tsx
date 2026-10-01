import Marquee from "@/components/magicui/marquee";

// Real Buckets capabilities. Keep in line with docs/MARKETING_CLAIMS_AND_VALIDATION.md.
const ROW_A = [
  "AWS SSO",
  "IAM Identity Center",
  "Account tabs",
  "Cross-bucket search",
  "Presigned links",
  "Drop Zones",
  "Time Travel",
  "Upload from URL",
  "Command palette",
];
const ROW_B = [
  "Folder Sync",
  "Object inspector",
  "Bucket policies",
  "CloudFront",
  "Athena",
  "S3 Tables",
  "Storage classes",
  "Code generation",
  "S3-compatible storage",
];

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))]" />
      {label}
    </span>
  );
}

/** Two counter-scrolling rows of capability chips under the hero. */
export default function Ribbon() {
  return (
    <section aria-label="Buckets capabilities" className="relative py-6">
      <ul className="sr-only">
        {[...ROW_A, ...ROW_B].map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <div
        aria-hidden
        className="relative mx-auto max-w-7xl [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <Marquee pauseOnHover repeat={2} className="[--duration:45s]">
          {ROW_A.map((l) => (
            <Chip key={l} label={l} />
          ))}
        </Marquee>
        <Marquee pauseOnHover reverse repeat={2} className="[--duration:50s]">
          {ROW_B.map((l) => (
            <Chip key={l} label={l} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
