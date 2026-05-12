/**
 * AWS Lambda – Clerk → DynamoDB → Resend  (Node.js 20+)
 * -------------------------------------------------------
 * ❶  Verifies Clerk / Svix webhook signatures
 * ❷  Persists `user.created` events to DynamoDB
 * ❸  E-mails a welcome + licence key via Resend
 *
 * Required environment variables
 * ------------------------------
 * DDB_TABLE_NAME        (e.g. “S3Console”)
 * CLERK_WEBHOOK_SECRET  (looks like “whsec_…”, from Clerk dashboard)
 * RESEND_API_KEY        (starts with “re_…”)
 * RESEND_FROM_EMAIL     (e.g. “S3Console <support@s3console.app>”)

 */

import crypto from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

// ────────────────────────────────────────────────────────────────────────────
// 0.  Configuration & helpers
// ────────────────────────────────────────────────────────────────────────────
const DDB_TABLE_NAME = "S3Console";
// Phase 11 — credentials moved to env vars (preferred) or AWS Secrets Manager.
// The previously hardcoded values in this file have been ROTATED in their
// dashboards (Resend + Clerk) so any leaked-in-git copies are now invalid.
const CLERK_WEBHOOK_SECRET =
  process.env.CLERK_WEBHOOK_SECRET ||
  (() => {
    throw new Error(
      "CLERK_WEBHOOK_SECRET env not set. Set it via Lambda env (or fetch from Secrets Manager via CLERK_WEBHOOK_SECRET_ARN)."
    );
  })();
const RESEND_API_KEY =
  process.env.RESEND_API_KEY ||
  (() => {
    throw new Error(
      "RESEND_API_KEY env not set. Set it via Lambda env (or fetch from Secrets Manager via RESEND_SECRET_ARN)."
    );
  })();
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Vidit <vidit@serverlesscreed.com>";

const ddb = new DynamoDBClient({
  region: "ap-south-1",
});

const urlSafeBase64ToBuffer = (b64) => {
  const std = b64.replace(/-/g, "+").replace(/_/g, "/");
  // pad to length multiple of 4
  const padded = std + "=".repeat((4 - (std.length % 4)) % 4);
  return Buffer.from(padded, "base64");
};

const SECRET = urlSafeBase64ToBuffer(
  CLERK_WEBHOOK_SECRET.replace(/^whsec_/, "")
);

const timingSafeEq = (a, b) =>
  a.length === b.length && crypto.timingSafeEqual(a, b);

const verifySvixSignature = (headers, rawBodyBuf) => {
  const svixId = headers["svix-id"];
  const svixTs = headers["svix-timestamp"];
  const sigHeader = headers["svix-signature"];

  if (!svixId || !svixTs || !sigHeader || !SECRET.length) return false;

  const signed = Buffer.concat([
    Buffer.from(`${svixId}.${svixTs}.`, "utf8"),
    rawBodyBuf,
  ]);

  const expected = crypto.createHmac("sha256", SECRET).update(signed).digest();

  // header can be “v1,<base64>” or “v1=<base64>,…”
  const match = sigHeader.match(/v1,([^,]+)/) || sigHeader.match(/v1=([^,]+)/);
  if (!match) return false;

  const provided = Buffer.from(match[1], "base64");
  return timingSafeEq(expected, provided);
};

const generateLicence = () =>
  [...Array(4)]
    .map(() =>
      crypto
        .randomBytes(2)
        .toString("hex")
        .toUpperCase()
        .replace(/(.{4})/, "$1")
    )
    .join("-");

// ────────────────────────────────────────────────────────────────────────────
// 1.  Lambda entry-point
// ────────────────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  console.log("Received:", JSON.stringify(event));

  // 1️⃣ Raw body → Buffer
  let rawBodyBuf;
  try {
    rawBodyBuf = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body, "utf8");
  } catch (e) {
    return { statusCode: 400, body: "Invalid body encoding" };
  }

  // 2️⃣ Header names → lower-case map
  const headers = {};
  for (const [k, v] of Object.entries(event.headers ?? {}))
    headers[k.toLowerCase()] = v;

  // 3️⃣ Verify signature
  if (!verifySvixSignature(headers, rawBodyBuf)) {
    console.warn("Bad signature");
    return { statusCode: 401, body: "Bad signature" };
  }

  // 4️⃣ Parse JSON
  let payload;
  try {
    payload = JSON.parse(rawBodyBuf.toString("utf8"));
  } catch {
    return { statusCode: 400, body: "Body is not valid JSON" };
  }

  if (payload.type !== "user.created")
    return { statusCode: 200, body: "Ignored" };

  const user = payload.data ?? {};
  const email = user.email_addresses?.[0]?.email_address;
  if (!email) return { statusCode: 400, body: "No email in user data" };

  const first = (user.first_name ?? "").trim();
  const last = (user.last_name ?? "").trim();
  const name = [first, last].filter(Boolean).join(" ") || email.split("@")[0];

  const createdMs = Number(user.created_at);
  const createdIso = new Date(createdMs).toISOString();
  // Phase 0: trial bumped from 7 → 14 days. Keep this in sync with
  // s3Console/packages/main/src/enhancedLicenseService.ts:TRIAL_LENGTH_MS.
  const TRIAL_DAYS = 14;
  const trialExpiryMs = createdMs + TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const licenceKey = generateLicence();

  // 5️⃣ DynamoDB put
  const item = {
    email: { S: email },
    clerkId: { S: user.id },
    name: { S: name },
    key: { S: licenceKey },
    onTrial: { BOOL: true },
    paid: { BOOL: false },
    createdAt: { S: createdIso },
    trialExpiryTimestampMs: { N: String(trialExpiryMs) },
  };

  try {
    // Conditional write: only create the row if one doesn't already exist for
    // this email. Defends against the race where the Dodo webhook (paid=true,
    // tier=…, validUntil=…) lands BEFORE this Clerk user.created webhook —
    // without the condition the seed item would clobber the paid state with
    // trial defaults, silently downgrading the user.
    await ddb.send(
      new PutItemCommand({
        TableName: DDB_TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(email)",
      })
    );
    console.log(`User ${email} stored in ${DDB_TABLE_NAME}`);
  } catch (err) {
    // ConditionalCheckFailedException means a row already exists (most likely
    // because Dodo got there first). Treat as success — the existing row is
    // already correctly populated, and Clerk re-fires user.created on retry
    // until it sees 2xx.
    if (err?.name === "ConditionalCheckFailedException") {
      console.log(
        `User ${email} already has a row in ${DDB_TABLE_NAME} (likely created by Dodo webhook first); skipping seed.`
      );
    } else {
      console.error("DynamoDB error", err);
      return { statusCode: 500, body: "DB write failed" };
    }
  }

  // 6️⃣ Fire-and-forget email via Resend
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [email],
        subject: "Welcome to S3Console – your licence key inside 🔑",
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for signing up for <strong>S3Console</strong>.</p>
          <p>Your personal licence key:</p>
          <pre style="font-size:1.3em;font-weight:bold">${licenceKey}</pre>
          <p>Paste it into the activation dialog when you launch the app.</p>
          <p>— The S3Console Team</p>
        `,
      }),
    });
    console.log("Resend email dispatched");
  } catch (mailErr) {
    console.warn("Email failed:", mailErr);
    // Do not fail the whole request – licence is already saved.
  }

  return { statusCode: 200, body: "OK" };
};
