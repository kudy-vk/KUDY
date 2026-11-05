// Shared docs-only classification for CI gates (issue #134). A change set is
// docs-only when EVERY changed file matches the explicit allowlist of paths
// that carry no product code: documentation prose, editor configuration,
// issue templates, LICENSE. Deny by default: any other path — including a new
// directory nobody listed yet — or an unknown change set (missing SHAs, git
// failure, empty diff) means "not docs-only", and every gate runs.
//
// docs/design-qa/ is excluded from the directory skip: visual:check reads its
// approved baselines from docs/design-qa/baselines/, so baseline binaries must
// re-run the gates (the .md pattern already covers prose inside design-qa).
//
// Consumers: tools/ci/android-e2e-scope.mjs (same list, Android decision) and
// the scope jobs in required-checks.yml, jscpd.yml and web-e2e.yml. The wiring
// is pinned by tools/ci/docs-only-scope.test.mjs and by the revert guard in
// tools/ci/check-required-checks.mjs.
//
// CLI: node tools/ci/docs-only-scope.mjs <base-sha> <head-sha>
// Prints `docs-only=true|false` and appends `docs_only=…` to $GITHUB_OUTPUT
// when set.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const DOCS_ONLY_PATTERNS = [
  /^docs\/(?!design-qa\/)/,
  /\.md$/i,
  /^\.cursor\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^LICENSE$/,
];

export function docsOnlyChange(files) {
  if (!Array.isArray(files) || files.length === 0) return false;
  return files.every((file) => DOCS_ONLY_PATTERNS.some((pattern) => pattern.test(file)));
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
  const docsOnly = files === null ? false : docsOnlyChange(files);
  const reason = files === null ? 'change set unknown' : `${files.length} changed file(s)`;
  console.log(`docs-only scope: docs-only=${docsOnly} (${reason})`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `docs_only=${docsOnly}\n`);
}
