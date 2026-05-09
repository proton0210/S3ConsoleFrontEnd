#!/usr/bin/env node
/**
 * Phase 11 — bundle-time secret scrub.
 *
 * After `next build`, scan .next/static/chunks for AWS access-key patterns and
 * fail the build if any leak. Run this from the Amplify build pipeline as a
 * post-build step:
 *
 *   amplify.yml:
 *     build:
 *       commands:
 *         - npm run build
 *         - node scripts/check-bundle-for-secrets.js
 *
 * Patterns flagged:
 *   - AKIA[0-9A-Z]{16}        AWS access key id
 *   - aws_secret_access_key   any literal mention
 *   - accessKeyId             SDK config field
 *   - secretAccessKey         SDK config field
 */
const fs = require("fs");
const path = require("path");

const STATIC_DIR = path.join(__dirname, "..", ".next", "static", "chunks");

const PATTERNS = [
  /AKIA[0-9A-Z]{16}/,
  /aws_secret_access_key/i,
  /\baccessKeyId\b\s*[:=]\s*["'][^"']+["']/,
  /\bsecretAccessKey\b\s*[:=]\s*["'][^"']+["']/,
];

if (!fs.existsSync(STATIC_DIR)) {
  console.log(`[check-bundle] No bundle found at ${STATIC_DIR} — run \`next build\` first.`);
  process.exit(0);
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && full.endsWith(".js")) yield full;
  }
}

const findings = [];
for (const file of walk(STATIC_DIR)) {
  const contents = fs.readFileSync(file, "utf-8");
  for (const pattern of PATTERNS) {
    const match = contents.match(pattern);
    if (match) {
      findings.push({ file: path.relative(process.cwd(), file), pattern: pattern.toString(), excerpt: match[0].slice(0, 60) });
    }
  }
}

if (findings.length > 0) {
  console.error("\n❌ SECRETS DETECTED IN CLIENT BUNDLE — build BLOCKED.");
  for (const f of findings) {
    console.error(`  ${f.file}`);
    console.error(`    pattern: ${f.pattern}`);
    console.error(`    excerpt: ${f.excerpt}`);
  }
  console.error(
    "\n  Fix: ensure no NEXT_PUBLIC_* env var contains an AWS key, and no\n" +
    "  client component imports `@/lib/dynamodb` (which is now server-only)."
  );
  process.exit(1);
}

console.log("✅ Bundle scrub passed — no AWS credential patterns found in client chunks.");
