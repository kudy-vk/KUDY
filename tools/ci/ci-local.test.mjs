// #132 criterion 1 — the drift guard over `ci:local`: the four fast workflow
// files are parsed fresh and every significant command of every job must be
// covered by an entry of tools/ci/ci-local.mjs, in the workflow's own job
// order. Adding, changing or reordering a CI check command without the
// matching ci:local entry turns this test red, so the local list cannot drift
// from CI (implementation-rules 1: the guard fails when the wiring reverts).
// The windows-portable job must stay listed as the skipped Windows-only job.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FAST_WORKFLOWS, WINDOWS_ONLY_SKIP, buildSteps, coverageFailures, jscpdVersion, parseWorkflowJobs, significantCommands } from './ci-local.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readWorkflow = (name) => fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');
const parsed = FAST_WORKFLOWS.map((name) => [name, parseWorkflowJobs(readWorkflow(name))]);

test('every fast workflow step command is covered by ci:local, in workflow job order', () => {
  const failures = coverageFailures(parsed, buildSteps());
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('revert: dropping a ci:local step leaves its workflow command uncovered', () => {
  const withoutTests = buildSteps().filter((step) => step.id !== 'tests');
  const failures = coverageFailures(parsed, withoutTests);
  assert.ok(
    failures.some((failure) => failure.includes('required-checks.yml/tests') && failure.includes('npm test')),
    failures.join('\n'),
  );
});

test('revert: a new workflow command that ci:local does not know fails the guard', () => {
  const mutated = parsed.map(([name, jobs]) => [
    name,
    name === 'guard-required-checks.yml'
      ? jobs.map((job) => (job.job === 'guard' ? { ...job, commands: [...job.commands, 'npm run new-gate'] } : job))
      : jobs,
  ]);
  const failures = coverageFailures(mutated, buildSteps());
  assert.ok(failures.some((failure) => failure.includes('npm run new-gate')), failures.join('\n'));
});

test('revert: reordering the workflow jobs fails the guard', () => {
  const mutated = parsed.map(([name, jobs]) => [
    name,
    name === 'required-checks.yml' ? [jobs[1], jobs[0], ...jobs.slice(2)] : jobs,
  ]);
  const failures = coverageFailures(mutated, buildSteps());
  assert.ok(failures.some((failure) => failure.includes('job order')), failures.join('\n'));
});

test('the Windows-only job is the only skipped one and still covers its commands', () => {
  const steps = buildSteps();
  const entry = steps.find((step) => step.job === 'windows-portable');
  assert.equal(entry.skip, WINDOWS_ONLY_SKIP);
  const jobs = parsed.find(([name]) => name === 'required-checks.yml')[1];
  const windowsJob = jobs.find((job) => job.job === 'windows-portable');
  assert.ok(windowsJob.runsOn.includes('windows-latest'), 'the job pinned by runs-on is the one skipped on Linux');
  for (const command of windowsJob.commands) {
    assert.ok(entry.ci.includes(command), `the skip entry must stand in for: ${command}`);
  }
  for (const step of steps) {
    if (step.job !== 'windows-portable') assert.equal(step.skip, undefined, `${step.id} must execute`);
  }
});

test('significantCommands keeps the check commands and drops the plumbing', () => {
  assert.deepEqual(
    significantCommands('set -euo pipefail\nexport KUDY_CHROMIUM="$(node -e x)"\ntest -x "$KUDY_CHROMIUM"\nnpm run e2e:web\n'),
    ['npm run e2e:web'],
  );
  assert.deepEqual(
    significantCommands('cmd=(npx --yes jscpd@5.1.2 --config "$CONFIG" --no-tips)\nexec "${cmd[@]}"\n'),
    ['npx --yes jscpd@5.1.2 --config "$CONFIG" --no-tips'],
  );
  assert.deepEqual(significantCommands('# run: npm test\nnpm test\n'), ['npm test'], 'a commented-out command is not a command');
});

test('the local jscpd command uses the version pinned in jscpd.yml, not its own pin', () => {
  const version = jscpdVersion();
  const entry = buildSteps().find((step) => step.job === 'jscpd');
  assert.equal(entry.cmd, `npx --yes jscpd@${version} --config .jscpd.json --no-tips .`);
  assert.deepEqual(entry.ci, [`npx --yes jscpd@${version} --config "$CONFIG" --no-tips`]);
});

test('the npm scripts point at the runners (runner wiring is guarded)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['ci:local'], 'node tools/ci/ci-local.mjs');
  assert.equal(pkg.scripts['e2e:android:local'], 'node tools/e2e-android/run-local.mjs');
});
