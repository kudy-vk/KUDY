import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { tempScopeRepo, runScopeScript } from './temp-scope-repo.mjs';
import { androidE2eNeeded, changedFiles } from './android-e2e-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (name) => {
  const source = fs.readFileSync(path.join(root, '.github', 'workflows', name), 'utf8');
  return { source, workflow: YAML.parse(source) };
};

test('web E2E runs on PRs with installed Chromium and the real build/test command', () => {
  const { source, workflow } = read('web-e2e.yml');
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  const steps = workflow.jobs.journeys.steps;
  assert.ok(steps.some((step) => step.run === 'npm ci' && step['working-directory'] === 'web'));
  assert.ok(steps.some((step) => step.run === 'npx playwright install --with-deps chromium'));
  assert.ok(steps.some((step) => step.run?.includes('npm run e2e:web')));
  assert.match(source, /KUDY_CHROMIUM=.*playwright.*chromium\.executablePath/);
  assert.ok(!/continue-on-error:\s*true/.test(source));
});

test('Android E2E workflow runs smoke, walk and discovery when started manually', () => {
  const { source, workflow } = read('android-e2e.yml');
  assert.ok(!JSON.stringify(workflow.jobs['smoke-and-walk'].env).includes('${{ runner.'), 'runner context is unavailable in jobs.env');
  const steps = workflow.jobs['smoke-and-walk'].steps;
  assert.ok(steps.some((step) => step.run?.includes('ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"') && step.run.includes('>> "$GITHUB_ENV"')));
  assert.ok(steps.some((step) => step.run?.includes('expo prebuild') && step.run.includes('assembleDebug')));
  assert.ok(steps.some((step) => step.run?.includes('test -f "$ANDROID_AVD_HOME/kudy-ci.ini"')));
  assert.ok(steps.some((step) => step.run?.includes('npm run e2e:android -- --suite "$suite"')));
  assert.match(source, /--device pixel_5/);
  assert.match(source, /for suite in smoke walk discovery; do/);
  assert.match(source, /SKIP e2e:android/);
  assert.ok(steps.some((step) => step.uses?.startsWith('actions/upload-artifact@') && step.if === 'failure()'));
  assert.match(source, /tools\/e2e-android\/artifacts\//);
});

// Owner decision 2026-11-04: the hosted emulator job (up to 90 min) no
// longer runs automatically; the PR-time check is the local pre-push rule.
test('Android E2E starts only manually; the local pre-push rule owns the PR check', () => {
  const { workflow } = read('android-e2e.yml');
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch'], 'no pull_request, push or schedule trigger');
  assert.deepEqual(Object.keys(workflow.jobs), ['smoke-and-walk']);
  assert.equal(workflow.jobs['smoke-and-walk'].needs, undefined, 'a manual run always runs the suites');
  const rule = fs.readFileSync(path.join(root, 'docs', 'agent-rules', 'android-e2e-local.md'), 'utf8');
  assert.match(rule, /node tools\/ci\/android-e2e-scope\.mjs/, 'the rule decides with the shared scope script');
  assert.match(rule, /npm run e2e:android:local/, 'the rule names the one-command local runner');
  assert.match(rule, /npm run ci:local/, 'the rule names the local fast-check command');
  for (const suite of ['smoke', 'walk', 'discovery']) assert.match(rule, new RegExp(`\\b${suite}\\b`), `the rule must run the ${suite} suite`);
  assert.match(rule, /NOT-VERIFIED/, 'a host without an emulator must report, not pass');
  for (const entry of ['AGENTS.md', 'CLAUDE.md', path.join('.cursor', 'rules', 'android-e2e-local.mdc')]) {
    assert.match(fs.readFileSync(path.join(root, entry), 'utf8'), /docs\/agent-rules\/android-e2e-local\.md/, `${entry} must route to the rule`);
  }
});

test('scope: docs-only change sets skip, anything else or an unknown set runs', () => {
  assert.equal(androidE2eNeeded(['docs/16_delivery_backlog.md', 'README.md', 'docs/demos/x.md']), false);
  assert.equal(androidE2eNeeded(['docs/agent-tasks/web/G10.02.b.md', 'tools/e2e-android/README.md']), false);
  assert.equal(androidE2eNeeded(['docs/readme.md', 'app/_layout.tsx']), true);
  assert.equal(androidE2eNeeded(['docs/design-qa/baselines/explore.png']), true, 'visual baselines feed visual:check');
  assert.equal(androidE2eNeeded(['.github/workflows/android-e2e.yml']), true);
  assert.equal(androidE2eNeeded(['brand-new-dir/file.ts']), true);
  assert.equal(androidE2eNeeded([]), true);
  assert.equal(androidE2eNeeded(undefined), true);
});

test('scope: missing, zero or malformed SHAs and git failures give an unknown change set', () => {
  const a = 'a'.repeat(40);
  const b = 'b'.repeat(40);
  const neverCalled = () => assert.fail('git must not run for invalid input');
  assert.equal(changedFiles('', b, neverCalled), null);
  assert.equal(changedFiles('0'.repeat(40), b, neverCalled), null);
  assert.equal(changedFiles(a, 'HEAD; rm -rf /', neverCalled), null);
  assert.equal(changedFiles(a, b, () => { throw new Error('bad object'); }), null);
  assert.deepEqual(changedFiles(a, b, (cmd, args) => {
    assert.deepEqual([cmd, args], ['git', ['diff', '--name-only', `${a}...${b}`]]);
    return 'docs/x.md\napp/y.tsx\n';
  }), ['docs/x.md', 'app/y.tsx']);
});

test('scope CLI writes run=false only for a real docs-only diff', () => {
  const script = path.join(root, 'tools', 'ci', 'android-e2e-scope.mjs');
  const { dir, base, docs, app, cleanup } = tempScopeRepo();
  const scope = (base, head) => runScopeScript(dir, script, base, head).output;
  try {
    assert.equal(scope(base, docs), 'run=false\n');
    assert.equal(scope(base, app), 'run=true\n');
    assert.equal(scope('', docs), 'run=true\n', 'an unknown change set must run the suites');
    assert.equal(scope('c'.repeat(40), docs), 'run=true\n', 'a git failure must run the suites');
  } finally {
    cleanup();
  }
});

test('Android E2E frees runner disk space before installing the SDK', () => {
  const { source, workflow } = read('android-e2e.yml');
  const steps = workflow.jobs['smoke-and-walk'].steps;
  const freeIndex = steps.findIndex((step) => step.run?.includes('/usr/share/dotnet'));
  const sdkIndex = steps.findIndex((step) => step.run?.includes('sdkmanager'));
  assert.ok(freeIndex !== -1, 'disk-free step missing');
  assert.ok(sdkIndex !== -1, 'SDK install step missing');
  assert.ok(freeIndex < sdkIndex, 'the disk-free step must run before the SDK install');
  assert.match(source, /df -h/, 'the disk-free step must log disk usage for evidence');
});

test('Android E2E waits up to 20 minutes for a fully booted emulator', () => {
  const { source } = read('android-e2e.yml');
  assert.match(source, /seq 1 240/, 'the boot wait must allow 20 minutes on slow cold boots');
  assert.match(source, /pm path android/, 'the boot wait must confirm the package manager answers, not only sys.boot_completed');
});

test('visual:check runs after the suites and always uploads its report as a non-gating artifact', () => {
  const { source, workflow } = read('android-e2e.yml');
  const steps = workflow.jobs['smoke-and-walk'].steps;
  const suiteIndex = steps.findIndex((step) => step.run?.includes('npm run e2e:android -- --suite "$suite"'));
  const visualIndex = steps.findIndex((step) => step.run?.includes('npm run visual:check'));
  assert.ok(suiteIndex !== -1, 'suites step missing');
  assert.ok(visualIndex > suiteIndex, 'visual:check must run after the e2e suites');
  const visual = steps[visualIndex];
  assert.equal(visual.if, 'always()', 'visual:check must run even when the suites fail');
  assert.match(visual.run, /--out visual-check-report/, 'the report must land in the artifact directory');
  assert.match(visual.run, /tee android-e2e-logs\/visual-check\.log/, 'the verdict log must be captured alongside the other e2e logs');
  assert.match(visual.run, /\|\| visual_status=\$\?/, 'the exit status must be captured, so a failing verdict cannot abort the step before the echo under bash -e');
  // Non-gating while unstable: the last command echoes the recorded status
  // instead of exiting with it, so the step can never fail the job.
  const lastLine = visual.run.trimEnd().split('\n').filter((line) => line.trim()).pop();
  assert.match(lastLine, /^echo /, 'the visual:check step must always end green (non-gating)');
  const uploadIndex = steps.findIndex((step) => step.uses?.startsWith('actions/upload-artifact@') && step.with?.name === 'visual-check-report');
  assert.ok(uploadIndex > visualIndex, 'the report upload must follow the visual:check step');
  const upload = steps[uploadIndex];
  assert.equal(upload.if, 'always()', 'the report artifact must upload on every run outcome');
  assert.match(upload.with.path, /visual-check-report/);
  assert.match(source, /name: visual-check-report/);
});

test('every action in the E2E workflows uses a full commit SHA', () => {
  for (const name of ['web-e2e.yml', 'android-e2e.yml']) {
    const { workflow } = read(name);
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps) {
        if (step.uses) assert.match(step.uses, /^[^@]+@[0-9a-f]{40}$/, `${name}: ${step.uses}`);
      }
    }
  }
});
