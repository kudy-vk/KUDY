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

import { FAST_WORKFLOWS, WINDOWS_ONLY_SKIP, buildSteps, chromiumEnv, coverageFailures, dedupeStepResult, jscpdVersion, parseWorkflowJobs, runStep, significantCommands } from './ci-local.mjs';

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

test('an exec-prefixed step command reaches the guard like its bare form (voka exec-drift-blindspot)', () => {
  // The `exec` builtin replaces the shell with the command it prefixes, so
  // `exec npm run x` runs the same check as `npm run x` and must be covered;
  // only the jscpd array expansion drops out (the normalized cmd=(...) line
  // already covers it).
  assert.deepEqual(significantCommands('exec npm run new-gate\n'), ['npm run new-gate']);
  assert.deepEqual(significantCommands('exec node tools/ci/check-required-checks.mjs\n'), ['node tools/ci/check-required-checks.mjs']);
  assert.deepEqual(significantCommands('exec npx --yes jscpd@5.1.2 --config "$CONFIG" --no-tips\n'), ['npx --yes jscpd@5.1.2 --config "$CONFIG" --no-tips']);
  assert.deepEqual(significantCommands('exec "${cmd[@]}"\n'), [], 'the array expansion is covered by the cmd=(...) line, not twice');
  assert.deepEqual(significantCommands('exec chmod +x bin/kudy\n'), [], 'exec of a non-npm/npx/node command is not a significant command');
});

test('revert: an exec-prefixed workflow command parses through the production path and fails coverage when uncovered (voka exec-drift-blindspot)', () => {
  const source = [
    'jobs:',
    '  guard:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - run: |',
    '          set -euo pipefail',
    '          exec npm run new-gate',
  ].join('\n');
  const jobs = parseWorkflowJobs(source);
  assert.deepEqual(jobs[0].commands, ['npm run new-gate'], 'exec npm must parse as the npm command it runs');
  const failures = coverageFailures([['guard-required-checks.yml', jobs]], buildSteps());
  assert.ok(
    failures.some((failure) => failure.includes('guard-required-checks.yml/guard') && failure.includes('npm run new-gate')),
    failures.join('\n'),
  );
});

test('significantCommands sees compound and env-prefixed commands, not only npm-prefixed lines (voka drift-guard-compound-blind-spot)', () => {
  assert.deepEqual(significantCommands('cd web && npm test\n'), ['cd web && npm test']);
  assert.deepEqual(significantCommands('ENV=val npm ci\n'), ['ENV=val npm ci']);
  assert.deepEqual(significantCommands('sudo npm ci\n'), ['npm ci'], 'sudo runs the command it prefixes, like exec');
  assert.deepEqual(significantCommands('sudo apt-get install libnss3\n'), [], 'sudo of a non-npm command is not a significant command');
  assert.deepEqual(significantCommands('export KUDY_CHROMIUM="$(node -e x)"\n'), [], 'plumbing stays plumbing: an export assignment never runs a check');
});

test('revert: a compound workflow command parses through the production path and fails coverage when uncovered (voka drift-guard-compound-blind-spot)', () => {
  const source = [
    'jobs:',
    '  tests:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - run: |',
    '          set -euo pipefail',
    '          cd web && npm test',
  ].join('\n');
  const jobs = parseWorkflowJobs(source);
  assert.deepEqual(jobs[0].commands, ['cd web && npm test'], 'a compound line is significant whole; its npm tail must not drop out');
  const failures = coverageFailures([['required-checks.yml', jobs]], buildSteps());
  assert.ok(
    failures.some((failure) => failure.includes('required-checks.yml/tests') && failure.includes('cd web && npm test')),
    failures.join('\n'),
  );
});

test('the local jscpd command uses the version pinned in jscpd.yml, not its own pin', () => {
  const version = jscpdVersion();
  const entry = buildSteps().find((step) => step.id === 'jscpd');
  assert.equal(entry.cmd, `npx --yes jscpd@${version} --config .jscpd.json --no-tips .`);
  assert.deepEqual(entry.ci, [`npx --yes jscpd@${version} --config "$CONFIG" --no-tips`]);
});

test('revert: a dedupe entry before its install must fail loudly, never pass silently (voka missing-dedupe-revert-guard)', () => {
  const installed = new Set();
  assert.deepEqual(dedupeStepResult(installed, 'root').code, 1, 'reached before its install — the order is broken');
  assert.match(dedupeStepResult(installed, 'root').message, /order is broken/);
  installed.add('root');
  assert.deepEqual(dedupeStepResult(installed, 'root').code, 0, 'after its install the dedupe is a printed note');
  // Reverting the caller to a silent `return 0` (or dropping the guard test)
  // turns this assertion red: the broken order must not read as a pass.
  assert.notDeepEqual(dedupeStepResult(new Set(), 'root'), { code: 0 });
  // The pin goes through the production runStep, not only the pure helper:
  // reverting runStep's dedupe branch to a silent `return 0` turns this red.
  const outOfOrder = runStep({ id: 'lint/install (root, deduped)', deduped: 'root' }, { installed: new Set(), chromiumProbe: () => ({}) });
  assert.equal(outOfOrder, 1, 'the production runStep must fail an out-of-order dedupe entry');
});

test('chromium resolution: managed download wins, the documented system fallback applies (voka system-chromium-doc-claim)', () => {
  const noAccess = () => {};
  const managed = chromiumEnv({ probe: () => '/ms-playwright/chrome', fileExists: (p) => p === '/ms-playwright/chrome', access: noAccess });
  assert.equal(managed.KUDY_CHROMIUM, '/ms-playwright/chrome');
  const system = chromiumEnv({ probe: () => null, fileExists: (p) => p === '/usr/bin/chromium', access: noAccess });
  assert.equal(system.KUDY_CHROMIUM, '/usr/bin/chromium', 'the documented system-Chromium alternative must work');
  assert.throws(() => chromiumEnv({ probe: () => null, fileExists: () => false, access: noAccess }), /no chromium for the web journeys/,
    'neither source — a named failure, never a silent pass');
});

test('the npm scripts point at the runners (runner wiring is guarded)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['ci:local'], 'node tools/ci/ci-local.mjs');
  // The shared entry routes by platform: #124's Windows path in-place, the
  // #132 Linux runner by delegation (judge finding #156).
  assert.equal(pkg.scripts['e2e:android:local'], 'node tools/ci/android-e2e-local.mjs');
});
