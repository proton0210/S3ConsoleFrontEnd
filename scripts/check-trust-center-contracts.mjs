#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const files = {
  trust: read("src/content/legal/trust.md"),
  marketplace: read("src/content/legal/marketplace-eula.md"),
  privacy: read("src/content/legal/privacy.md"),
  middleware: read("src/middleware.ts"),
  sitemap: read("src/app/sitemap.ts"),
  navigation: read("src/components/sections/footer.tsx"),
  securityTxt: read("public/.well-known/security.txt"),
  marketplaceFulfillment: read("src/app/marketplace/route.ts"),
  marketplaceClaim: read("src/app/api/marketplace/claim/route.ts"),
  marketplaceStatus: read("src/app/account/marketplace/page.tsx"),
  marketplaceStatusApi: read("src/app/api/marketplace/status/route.ts"),
  marketplaceRegistrationForm: read("src/app/marketplace/complete/marketplace-registration-form.tsx"),
  directBillingPage: read("src/app/account/billing/page.tsx"),
};

const failures = [];
const requireText = (file, label, value) => {
  if (!file.toLowerCase().includes(value.toLowerCase())) failures.push(`${label} is missing: ${value}`);
};

[
  "not yet passed an AWS Foundational Technical Review",
  "do not currently claim the AWS Marketplace",
  "What ServerlessCreed collects",
  "What we do not collect",
  "Vulnerability disclosure policy",
  "at least 400 days",
  "independent penetration test",
  "not yet been completed",
].forEach((value) => requireText(files.trust, "Trust Center", value));
[
  "not represented here as currently available through AWS Marketplace",
  "one-time Marketplace registration token is consumed server-side",
  "Dodo Payments subscription is a separate billing source",
].forEach((value) => requireText(files.marketplace, "Marketplace EULA", value));
["Amazon Web Services", "Clerk", "DODO Payments", "Resend"].forEach((value) =>
  requireText(files.privacy, "Privacy Policy", value),
);
requireText(files.middleware, "Public routes", '"/trust"');
requireText(files.middleware, "Public routes", '"/marketplace-eula"');
requireText(files.middleware, "Public routes", '"/marketplace"');
requireText(files.sitemap, "Sitemap", "/trust");
requireText(files.sitemap, "Sitemap", "/marketplace-eula");
requireText(files.navigation, "Navigation", 'href: "/trust"');
requireText(files.securityTxt, "security.txt", "Contact: mailto:vidit@serverlesscreed.com");
requireText(files.securityTxt, "security.txt", "/trust#vulnerability-disclosure");
requireText(files.marketplaceFulfillment, "Marketplace fulfillment", "x-amzn-marketplace-token");
requireText(files.marketplaceFulfillment, "Marketplace fulfillment", "/v2/marketplace/fulfillment");
requireText(files.marketplaceFulfillment, "Marketplace fulfillment", "httpOnly: true");
requireText(files.marketplaceClaim, "Marketplace claim", "/v2/marketplace/register");
requireText(files.marketplaceStatus, "Marketplace status", "/v2/marketplace/status");
requireText(files.marketplaceStatusApi, "Marketplace status API", "/v2/marketplace/status");
requireText(files.marketplaceRegistrationForm, "Marketplace registration", "/account/marketplace");
requireText(files.directBillingPage, "Direct billing isolation", "/api/marketplace/status");
if (/cookies\.set\([^\n]*registrationToken/.test(files.marketplaceFulfillment)) {
  failures.push("AWS Marketplace registration token must never be written to a cookie");
}

if (failures.length > 0) {
  console.error("Trust Center contract check failed:");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log("Trust Center public-content contracts passed.");
