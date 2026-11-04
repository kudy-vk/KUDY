import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { DOCS_ONLY_PATTERNS, changedFiles, docsOnlyChange } from './docs-only-scope.mjs';
import { androidE2eNeeded } from './android-e2e-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readWorkflow = (name) => {
  const source = fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');
  return { source, workflow: YAML.parse(source) };
};

test('docs-only classification: every file must match the allowlist — deny by default', () => {
  assert.equal(docsOnlyChange(['docs/16_delivery_backlog.md', 'README.md']), true);
  assert.equal(docsOnlyChange(['docs/agent-tasks/web/G10.02.b.md', 'LICENSE', '.cursor/rules/x.mdc']), true);
  assert.equal(docsOnlyChange(['.github/ISSUE_TEMPLATE/agent-ready.md']), true);
  assert.equal(docsOnlyChange(['docs/design-qa/baselines/explore.png']), false, 'visual baselines re-run the gates');
  assert.equal(docsOnlyChange(['docs/x.md', 'app/y.tsx']), false, 'one code file fails the whole set');
  assert.equal(docsOnlyChange(['.github/workflows/required-checks.yml']), false, 'CI wiring is code');
  assert.equal(docsOnlyChange(['brand-new-dir/file.ts']), false, 'an unlisted path runs the gates');
  assert.equal(docsOnlyChange([]), false, 'an empty change set is unknown — deny');
  assert.equal(docsOnlyChange(undefined), false, 'an unknown change set is denied');
  // The directory skip excludes only design-qa binaries; prose under
  // docs/design-qa/ is still .md and still docs-only.
  assert.equal(DOCS_ONLY_PATTERNS.some((pattern) => pattern.test('docs/design-qa/design-qa.md')), true);
});

test('android-e2e-scope reuses the shared list: needed = not docs-only', () => {
  for (const files of [
    ['docs/a.md', 'README.md'],
    ['docs/a.md', 'app/y.tsx'],
    ['docs/design-qa/baselines/a.png'],
    ['.github/ISSUE_TEMPLATE/agent-ready.md', 'LICENSE'],
  ]) {
    assert.equal(androidE2eNeeded(files), !docsOnlyChange(files), JSON.stringify(files));
  }
  assert.equal(androidE2eNeeded(undefined), true, 'an unknown change set always runs the suites');
  assert.equal(androidE2eNeeded([]), true);
});

test('changedFiles: malformed input is an unknown change set', () => {
  const neverCalled = () => assert.fail('git must not run for invalid input');
  assert.equal(changedFiles('', 'b'.repeat(40), neverCalled), null);
  assert.equal(changedFiles('0'.repeat(40), 'b'.repeat(40), neverCalled), null);
  assert.equal(changedFiles('a'.repeat(40), 'HEAD; rm -rf /', neverCalled), null);
  assert.deepEqual(changedFiles('a'.repeat(40), 'b'.repeat(40), () => 'docs/x.md\n'), ['docs/x.md']);
});

test('docs-only scope CLI: true on a md-only diff, false on code, false on unknown', () => {
  const script = path.join(root, 'tools', 'ci', 'docs-only-scope.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-docs-scope-'));
  const git = (...args) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { encoding: 'utf8' }).trim();
  const scope = (base, head) => {
    const out = path.join(dir, 'github-output');
    fs.writeFileSync(out, '');
    const stdout = execFileSync(process.execPath, [script, base, head], { cwd: dir, env: { ...process.env, GITHUB_OUTPUT: out }, encoding: 'utf8' });
    return { stdout: stdout.trim(), output: fs.readFileSync(out, 'utf8') };
  };
  try {
    git('init', '-q');
    fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'docs', 'a.md'), 'a\n');
    git('add', '.');
    git('commit', '-q', '-m', 'base');
    const base = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(dir, 'docs', 'a.md'), 'b\n');
    git('commit', '-q', '-am', 'docs');
    const docs = git('rev-parse', 'HEAD');
    fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'app', 'x.ts'), 'x\n');
    git('add', '.');
    git('commit', '-q', '-m', 'app');
    const app = git('rev-parse', 'HEAD');
    const docsOnly = scope(base, docs);
    assert.equal(docsOnly.output, 'docs_only=true\n', 'GITHUB_OUTPUT carries the docs_only key');
    assert.match(docsOnly.stdout, /docs-only=true \(1 changed file\(s\)\)/);
    assert.match(scope(base, app).stdout, /docs-only=false/);
    assert.equal(scope('', docs).output, 'docs_only=false\n', 'an unknown change set must run the gates');
    assert.equal(scope('c'.repeat(40), docs).output, 'docs_only=false\n', 'a git failure must run the gates');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('required-checks.yml: code gates skip on docs-only, docs and secrets gates always run', () => {
  const { source, workflow } = readWorkflow('required-checks.yml');
  assert.ok(workflow.jobs.scope, 'the scope job exists');
  assert.match(source, /fetch-depth: 0/, 'the scope job needs full history for the merge-base diff');
  assert.match(source, /run: node tools\/ci\/docs-only-scope\.mjs/);
  assert.equal(workflow.jobs.scope.outputs.docs_only, '${{ steps.docs-only.outputs.docs_only }}');
  for (const job of ['windows-portable', 'lint', 'server-typecheck', 'engine-regressions', 'web-build']) {
    assert.deepEqual(workflow.jobs[job].needs, ['scope'], `${job} consumes the scope output`);
    assert.equal(workflow.jobs[job].if, "needs.scope.outputs.docs_only != 'true'", `${job} skips on docs-only`);
  }
  assert.equal(workflow.jobs.tests.needs, undefined, 'tests runs on every change set');
  assert.equal(workflow.jobs.tests.if, undefined);
  assert.equal(workflow.jobs.gitleaks.needs, undefined, 'gitleaks runs on every change set');
  assert.equal(workflow.jobs.gitleaks.if, undefined);
  assert.match(source, /run: npm test/, 'the full suite stays the docs guard');
});

test('jscpd and web-e2e skip their job on docs-only change sets', () => {
  for (const [name, job] of [['jscpd.yml', 'jscpd'], ['web-e2e.yml', 'journeys']]) {
    const { source, workflow } = readWorkflow(name);
    assert.ok(workflow.jobs.scope, `${name}: the scope job exists`);
    assert.match(source, /run: node tools\/ci\/docs-only-scope\.mjs/);
    assert.match(source, /fetch-depth: 0/);
    assert.deepEqual(workflow.jobs[job].needs, ['scope'], `${name}: ${job} consumes the scope output`);
    assert.equal(workflow.jobs[job].if, "needs.scope.outputs.docs_only != 'true'", `${name}: ${job} skips on docs-only`);
  }
});

test('check-required-checks pins the docs-only wiring (revert guard)', () => {
  const guard = fs.readFileSync(path.join(root, 'tools', 'ci', 'check-required-checks.mjs'), 'utf8');
  assert.match(guard, /docs-only scope wiring incomplete/, 'the guard must fail when the skip wiring is reverted');
  assert.match(guard, /docs-only-scope/, 'the guard must name the shared scope script');
  assert.match(guard, /tests and gitleaks must run on every change set/, 'the never-skip jobs are pinned too');
});

test('the agent rules name the docs-only CI behavior', () => {
  const rule = fs.readFileSync(path.join(root, 'docs', 'agent-rules', 'android-e2e-local.md'), 'utf8');
  assert.match(rule, /docs-only-scope\.mjs/, 'the rules describe the docs-only CI skip');
});
