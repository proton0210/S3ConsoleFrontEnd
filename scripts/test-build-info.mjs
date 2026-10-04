import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveCommit, writeBuildInfo } from "./write-build-info.mjs";

const amplify = "a".repeat(40), github = "b".repeat(40), local = "c".repeat(40);
test("prefers full Amplify commit, then GitHub, with Git fallback for rebuilds", () => {
  const git = () => local + "\n";
  assert.equal(resolveCommit({ AWS_COMMIT_ID: amplify, GITHUB_SHA: github }, git), amplify);
  assert.equal(resolveCommit({ GITHUB_SHA: github }, git), github);
  assert.equal(resolveCommit({ AWS_COMMIT_ID: "HEAD" }, git), local);
  assert.equal(resolveCommit({}, git), local);
});
test("never emits arbitrary environment text or an abbreviated SHA", () => {
  assert.equal(resolveCommit({ AWS_COMMIT_ID: "private-value", GITHUB_SHA: "1234567" }, () => local), local);
  assert.throws(() => resolveCommit({}, () => "HEAD"), /full source commit/);
});
test("writes only public provenance fields, independent of unrelated secrets", () => {
  const dir = mkdtempSync(join(tmpdir(), "frontend-build-info-"));
  try {
    writeBuildInfo(dir, { AWS_COMMIT_ID: amplify, CLERK_SECRET_KEY: "not-for-public-output", Buckets_NAME: "untrusted" });
    const info = JSON.parse(readFileSync(join(dir, "public/build-info.json"), "utf8"));
    assert.deepEqual(Object.keys(info).sort(), ["builtAt", "commit", "product"]);
    assert.equal(info.commit, amplify);
    assert.equal(info.product, "Buckets");
    assert.ok(Number.isFinite(Date.parse(info.builtAt)));
    assert.ok(!JSON.stringify(info).includes("not-for-public-output"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
