import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const product = "Buckets";
const fullCommit = /^[a-f0-9]{40}$/i;

export function resolveCommit(env, readGitCommit) {
  // Amplify documents AWS_COMMIT_ID as "HEAD" for rebuilds; resolve that from
  // the checkout instead. Only full commit hashes may enter the public file.
  // https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html
  for (const candidate of [env.AWS_COMMIT_ID, env.GITHUB_SHA]) {
    if (typeof candidate === "string" && fullCommit.test(candidate)) return candidate.toLowerCase();
  }
  const commit = readGitCommit().trim();
  if (!fullCommit.test(commit)) throw new Error("A full source commit SHA is required for build provenance.");
  return commit.toLowerCase();
}

export function writeBuildInfo(cwd = process.cwd(), env = process.env) {
  const commit = resolveCommit(env, () => execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const info = { commit, product, builtAt: new Date().toISOString() };
  mkdirSync(resolve(cwd, "public"), { recursive: true });
  writeFileSync(resolve(cwd, "public/build-info.json"), JSON.stringify(info, null, 2) + "\n");
  return info;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const info = writeBuildInfo();
    console.log(`Build provenance: ${info.product} ${info.commit}`);
  } catch {
    console.error("Cannot generate build provenance: provide a full AWS_COMMIT_ID/GITHUB_SHA or build from a Git checkout.");
    process.exitCode = 1;
  }
}
