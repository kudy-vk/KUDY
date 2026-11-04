// Decides whether a change set needs the Android E2E suites (emulator smoke,
// walk, discovery + visual:check). Since 2026-11-04 they run on a local
// emulator before each push (docs/agent-rules/android-e2e-local.md); the
// hosted workflow is manual-only and does not call this. Deny by default:
// the suites are skipped only when EVERY changed file matches the explicit
// allowlist of paths the Android app and its E2E/visual tooling never read.
// Any other path — including a new directory nobody listed yet — runs them,
// and so does an unknown change set (missing SHAs, git failure).
//
// CLI: node tools/ci/android-e2e-scope.mjs <base-sha> <head-sha>
// Prints `run=true|false` and appends it to $GITHUB_OUTPUT when set.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// docs/design-qa/ is excluded from the skip list: visual:check reads its
// approved baselines from docs/design-qa/baselines/.
export const SKIP_ONLY_PATTERNS = [
  /^docs\/(?!design-qa\/)/,
  /\.md$/i,
  /^\.cursor\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^LICENSE$/,
];

export function androidE2eNeeded(files) {
  if (!Array.isArray(files) || files.length === 0) return true;
  return files.some((file) => !SKIP_ONLY_PATTERNS.some((pattern) => pattern.test(file)));
}

const SHA = /^[0-9a-f]{40}$/;
const ZERO = /^0{40}$/;

export function changedFiles(base, head, git = execFileSync) {
  if (!SHA.test(base ?? '') || !SHA.test(head ?? '') || ZERO.test(base)) return null;
  try {
    const out = git('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' });
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const files = changedFiles(process.argv[2], process.argv[3]);
  const run = files === null ? true : androidE2eNeeded(files);
  const reason = files === null ? 'change set unknown' : `${files.length} changed file(s)`;
  console.log(`android-e2e scope: run=${run} (${reason})`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
}
