#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const files = {
  trust: read("src/components/trust-center.tsx"),
  marketplace: read("src/content/legal/marketplace-eula.md"),
  privacy: read("src/content/legal/privacy.md"),
  middleware: read("src/middleware.ts"),
  sitemap: read("src/app/sitemap.ts"),
  config: read("src/lib/config.tsx"),
  legalVersions: read("src/lib/legalVersions.ts"),
  securityTxt: read("public/.well-known/security.txt"),
};

const failures = [];
const requireText = (file, label, text) => {
  if (!file.includes(text)) failures.push(`${label} is missing: ${text}`);
};
const requireTextCaseInsensitive = (file, label, text) => {
  if (!file.toLowerCase().includes(text.toLowerCase())) {
    failures.push(`${label} is missing: ${text}`);
  }
};

[
  "Your AWS data stays between your desktop and your AWS account. ServerlessCreed does not proxy or store table items or S3 objects.",
  "What ServerlessCreed collects",
  "What we do not collect",
  "Credential storage",
  "Backup and disaster recovery",
  "Incident response",
  "Vulnerability disclosure policy",
  "Independent penetration test",
  "Planned — not yet completed",
  "Desktop updates and code signing",
  "Support and uptime commitment",
  "Current subprocessors and service providers",
  "Current public desktop releases",
  "3.2.5",
  "2.7.3",
].forEach((text) => requireText(files.trust, "Trust Center", text));

[
  "not represented here as currently available through AWS Marketplace",
  "becomes effective for an order only when an active",
  "Dodo Payments subscription is a separate billing source",
  "does not proxy or store",
  "no contractual uptime percentage",
].forEach((text) => requireText(files.marketplace, "Marketplace EULA", text));

["Amazon Web Services", "Clerk", "Dodo Payments", "Resend", "Google Analytics", "Reddit", "Twitter (X)", "Google Workspace", "GitHub"].forEach(
  (text) => requireTextCaseInsensitive(files.privacy, "Privacy Policy", text)
);

requireText(files.middleware, "Public route policy", '"/trust"');
requireText(files.middleware, "Public route policy", '"/marketplace-eula"');
requireText(files.sitemap, "Sitemap", "/trust");
requireText(files.sitemap, "Sitemap", "/marketplace-eula");
requireText(files.config, "Navigation", 'href: "/trust"');
requireText(files.legalVersions, "Legal version", 'privacy: "2026-08-24"');
requireText(files.securityTxt, "security.txt", "Contact: mailto:vidit@serverlesscreed.com");
requireText(files.securityTxt, "security.txt", "/trust#vulnerability-disclosure");

if (!fs.existsSync(path.join(root, "src/app/trust/page.tsx"))) {
  failures.push("Public /trust page route is missing");
}

const marketplaceRoutes = [
  "src/app/marketplace-eula/page.tsx",
  "src/app/(legal)/marketplace-eula/page.tsx",
];
if (!marketplaceRoutes.some((relativePath) => fs.existsSync(path.join(root, relativePath)))) {
  failures.push("Public /marketplace-eula page route is missing");
}

if (/security@serverlesscreed\.com/i.test(Object.values(files).join("\n"))) {
  failures.push("Unprovisioned security@serverlesscreed.com address must not be published");
}

if (failures.length) {
  console.error("Trust Center contract check failed:");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log("Trust Center public-content contracts passed.");
