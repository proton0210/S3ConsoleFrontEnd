/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const fail = (message) => {
  throw new Error(`Payment identity contract failed: ${message}`);
};
const mustContain = (source, fragment, label) => {
  if (!source.includes(fragment)) fail(`${label} is missing ${fragment}`);
};
const mustNotMatch = (source, pattern, label) => {
  if (pattern.test(source)) fail(`${label} matched forbidden ${pattern}`);
};

const checkout = read("src/app/api/dodo/create-checkout/route.ts");
const changePlan = read("src/app/api/dodo/change-plan/route.ts");
const portal = read("src/app/api/dodo/portal-session/route.ts");
const paymentSuccess = read("src/app/api/payment-success/route.ts");
const teamSeats = read("src/app/api/team/seats/route.ts");

for (const [label, source] of [
  ["checkout", checkout],
  ["change-plan", changePlan],
  ["portal-session", portal],
  ["payment-success", paymentSuccess],
  ["team-seats", teamSeats],
]) {
  mustContain(source, "await auth()", label);
  mustContain(source, "await currentUser()", label);
  mustContain(source, "if (!userId)", label);
  mustNotMatch(
    source,
    /console\.(?:log|warn|error)[\s\S]{0,180}(?:accountSubject|accountEmail|subscriptionId|dodoCustomerId|paymentId|userId)/,
    label
  );
}

mustContain(checkout, "const accountEmail = clerkEmail;", "checkout");
mustContain(checkout, '"accountSubject"', "checkout protected metadata");
mustContain(checkout, "accountSubject: userId", "checkout metadata");
mustContain(checkout, 'app: "serverless-buckets"', "checkout product marker");
// The Suite is claimed by both products' webhooks; the origin marker is what
// stops the Tables webhook from binding a Buckets Clerk subject to its row.
mustContain(checkout, '"bundle"', "checkout protected metadata");
mustContain(checkout, '"originApp"', "checkout protected metadata");
mustContain(checkout, '"clerkId"', "checkout protected metadata");
mustContain(checkout, "app: SUITE_APP_ID, bundle: SUITE_BUNDLE_ID, originApp: SUITE_ORIGIN_APP", "checkout suite markers");
mustContain(read("src/lib/suite-offer.ts"), 'SUITE_ORIGIN_APP = "serverless-buckets"', "suite origin marker");

for (const [label, source] of [
  ["change-plan", changePlan],
  ["portal-session", portal],
  ["payment-success", paymentSuccess],
]) {
  mustNotMatch(source, /body\??\.email|body\[\s*["']email["']\s*\]/, label);
  mustContain(
    source,
    "primaryEmailAddress?.emailAddress",
    `${label} Clerk email ownership`
  );
}

for (const [label, source] of [
  ["change-plan", changePlan],
  ["team-seats", teamSeats],
]) {
  mustContain(source, "accountSubject: userId", `${label} metadata`);
  mustContain(source, 'app: "serverless-buckets"', `${label} product marker`);
}

console.log("Payment identity contracts passed for Buckets by ServerlessCreed.");
