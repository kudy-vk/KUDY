// #132 — the one command behind `npm run ci:local`: the fast CI checks, on
// the Linux dev host, in the same order as `.github/workflows/`. Since the
// hosted Android E2E job stopped running on pull requests (PR #125), this is
// the pre-push fast check an agent runs before every push; the Android suites
// are `npm run e2e:android:local` (tools/e2e-android/run-local.mjs) when the
// scope in tools/ci/android-e2e-scope.mjs says run=true.
//
//   npm run ci:local            # full list, stops at the first failure
//
// Order parity with CI is not restated here and then hoped for: the drift
// guard (tools/ci/ci-local.test.mjs) parses the four fast workflow files and
// fails when a workflow step's command is missing from buildSteps() below or
// when the job order drifts. Install steps (`npm ci`) run once per area —
// root and web — like the first CI job that uses them; the later jobs' `npm ci`
// entries stay in the list (the guard counts them) but execute as a printed
// dedupe note, because npm ci is idempotent and CI runners start empty while
// a dev host keeps its node_modules.
//
// The windows-portable job is listed as skipped on Linux: it is the
// Windows-only portable subset (runs-on: windows-latest) pinned by
// tools/ci/check-required-checks.mjs (G20.17, G21.36, G20.37).
//
// Exit codes: 0 every step green; the first failing step's own exit status
// otherwise. On Windows this runner refuses with exit 3 — the Windows host
// setup is issue #124, and a half-running list would be a false pass.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// The fast workflows in execution order (issue #132, criterion 1).
export const FAST_WORKFLOWS = ['required-checks.yml', 'web-e2e.yml', 'jscpd.yml', 'guard-required-checks.yml'];

export const WINDOWS_ONLY_SKIP = 'Windows-only job (runs-on: windows-latest) — skipped on the Linux host';

// A dedupe entry reached before its install step means the step list order
// broke — silently treating it as a pass would skip an npm ci (voka finding
// deduped-silent-skip). Pure so the revert guard can pin it: reverting the
// caller to a silent `return 0` must turn the guard test red
// (implementation-rules 1).
export function dedupeStepResult(installed, area) {
  if (installed.has(area)) return { code: 0 };
  return { code: 1, message: 'dedupe entry reached before its install step — the step list order is broken' };
}

// Read the pinned jscpd version from the CI workflow itself, so the local
// gate cannot drift from the CI gate (tools/ci/check-required-checks.mjs
// already forces the same version onto AGENTS.md).
export function jscpdVersion(workflowFile = path.join(REPO_ROOT, '.github', 'workflows', 'jscpd.yml')) {
  const version = fs.readFileSync(workflowFile, 'utf8').match(/jscpd@(\d+\.\d+\.\d+)/);
  if (!version) throw new Error(`jscpd.yml has no pinned jscpd@<version> — cannot derive the local command`);
  return version[1];
}

// The ordered local step list. `ci` carries the exact workflow command(s) an
// entry stands in for when the local command differs from the CI text (the
// skipped Windows job, the jscpd script construction); `install`/`deduped`
// carry the npm-ci area ('root' | 'web') that executes once / is deduped.
export function buildSteps({ jscpd: version = jscpdVersion() } = {}) {
  return [
    // --- required-checks.yml: tests ---
    { id: 'tests/install (root)', job: 'tests', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: '.', install: 'root' },
    { id: 'tests/install (web)', job: 'tests', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: 'web', install: 'web' },
    { id: 'tests', job: 'tests', workflow: 'required-checks.yml', cmd: 'npm test', cwd: '.' },
    // --- required-checks.yml: windows-portable (skipped on Linux) ---
    {
      id: 'windows-portable', job: 'windows-portable', workflow: 'required-checks.yml', skip: WINDOWS_ONLY_SKIP,
      ci: [
        'node --test --experimental-strip-types test/design-tokens.test.mjs supabase/functions/_shared/fixtures-hygiene.test.ts',
        'node --test "tools/android-build/*.test.mjs"',
        'npm ci',
        'npm ci',
        'node --test --experimental-strip-types --experimental-test-module-mocks tools/ci/adapter-revert-guard.test.mjs tools/ci/windows-android-build-guard.test.mjs tools/i18n/check-messages.test.mjs tools/i18n/generate-messages.test.mjs web/lib/content/attribution-guard.test.ts web/lib/content/exported-language.test.ts',
      ],
    },
    // --- required-checks.yml: lint ---
    { id: 'lint/install (root, deduped)', job: 'lint', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: '.', deduped: 'root' },
    { id: 'lint/install (web, deduped)', job: 'lint', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: 'web', deduped: 'web' },
    { id: 'lint/typecheck (root + services)', job: 'lint', workflow: 'required-checks.yml', cmd: 'npm run typecheck', cwd: '.' },
    { id: 'lint/typecheck (web)', job: 'lint', workflow: 'required-checks.yml', cmd: 'npx tsc --noEmit -p web', cwd: '.' },
    { id: 'lint/arch:check (real repository graph)', job: 'lint', workflow: 'required-checks.yml', cmd: 'npm run arch:check', cwd: '.' },
    // --- required-checks.yml: server-typecheck ---
    { id: 'server-typecheck', job: 'server-typecheck', workflow: 'required-checks.yml', cmd: 'npm run server:typecheck', cwd: '.' },
    // --- required-checks.yml: engine-regressions ---
    { id: 'engine-regressions/install (root, deduped)', job: 'engine-regressions', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: '.', deduped: 'root' },
    { id: 'engine-regressions', job: 'engine-regressions', workflow: 'required-checks.yml', cmd: 'npm run engine:regressions', cwd: '.' },
    // --- required-checks.yml: web-build ---
    { id: 'web-build/install (web, deduped)', job: 'web-build', workflow: 'required-checks.yml', cmd: 'npm ci', cwd: 'web', deduped: 'web' },
    { id: 'web-build', job: 'web-build', workflow: 'required-checks.yml', cmd: 'npm run build', cwd: 'web' },
    // --- required-checks.yml: gitleaks ---
    { id: 'gitleaks', job: 'gitleaks', workflow: 'required-checks.yml', cmd: 'node tools/ci/fetch-gitleaks.mjs', cwd: '.' },
    // --- web-e2e.yml: journeys ---
    { id: 'journeys/install (root, deduped)', job: 'journeys', workflow: 'web-e2e.yml', cmd: 'npm ci', cwd: '.', deduped: 'root' },
    { id: 'journeys/install (web, deduped)', job: 'journeys', workflow: 'web-e2e.yml', cmd: 'npm ci', cwd: 'web', deduped: 'web' },
    {
      id: 'journeys/install lockfile-pinned Chromium', job: 'journeys', workflow: 'web-e2e.yml',
      cmd: 'npx playwright install --with-deps chromium', cwd: '.',
      // On a Debian-family host this runs exactly like CI. Playwright's
      // --with-deps only knows Debian-family package managers, so on other
      // distros (Arch/CachyOS) it installs the browser without the distro
      // packages and says so — the deviation is printed, never silent.
      distroDeps: true,
    },
    { id: 'journeys/web journeys (build and test)', job: 'journeys', workflow: 'web-e2e.yml', cmd: 'npm run e2e:web', cwd: '.', needsChromium: true },
    // --- jscpd.yml: jscpd ---
    {
      id: 'jscpd', job: 'jscpd', workflow: 'jscpd.yml', cwd: '.',
      cmd: `npx --yes jscpd@${version} --config .jscpd.json --no-tips .`,
      ci: [`npx --yes jscpd@${version} --config "$CONFIG" --no-tips`],
    },
    // --- guard-required-checks.yml: guard ---
    { id: 'guard', job: 'guard', workflow: 'guard-required-checks.yml', cmd: 'node tools/ci/check-required-checks.mjs', cwd: '.' },
  ];
}

// Significant commands of one workflow `run:` script: the npm/npx/node
// invocations, with the jscpd workflow's `cmd=(npx …)` array construction
// normalized to the npx line it executes (`exec "${cmd[@]}"` is its only
// other line and runs the same array). Plumbing — set/export/test/echo/
// printf/mkdir/sudo/grep/read and shell assignments — never runs a check and
// is ignored.
const PLUMBING_PREFIXES = ['set ', 'export ', 'test ', 'echo ', 'printf ', 'mkdir ', 'sudo ', 'grep ', 'read ', 'exec ', '[ '];

export function significantCommands(runScript) {
  return runScript
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .filter((line) => !PLUMBING_PREFIXES.some((prefix) => line.startsWith(prefix)))
    .filter((line) => /^npm\s|^npx\s|^node\s|npx --yes jscpd@/.test(line))
    .map((line) => (line.startsWith('cmd=(') ? line.replace(/^cmd=\(/, '').replace(/\)$/, '') : line));
}

// { job, runsOn, commands[] } per job, in file order — the shape the drift
// guard consumes.
export function parseWorkflowJobs(source) {
  const workflow = YAML.parse(source);
  return Object.entries(workflow.jobs).map(([job, def]) => ({
    job,
    runsOn: def['runs-on'] ?? null,
    commands: (def.steps ?? []).flatMap((step) => (typeof step.run === 'string' ? significantCommands(step.run) : [])),
  }));
}

// Drift check: every significant command of every fast workflow job must be
// covered by exactly one entry of the same job, and the entry job order must
// match the workflow file order. Returns failure messages; an empty list
// means ci:local cannot drift from CI.
export function coverageFailures(workflows, steps) {
  const failures = [];
  const byWorkflow = new Map();
  for (const step of steps) {
    if (!byWorkflow.has(step.workflow)) byWorkflow.set(step.workflow, []);
    byWorkflow.get(step.workflow).push(step);
  }
  for (const [name, jobs] of workflows) {
    const entries = byWorkflow.get(name);
    if (!entries) {
      failures.push(`${name}: ci:local has no steps for this workflow`);
      continue;
    }
    const entryJobs = [...new Set(entries.map((entry) => entry.job))];
    const jobOrder = jobs.map(({ job }) => job).join(' → ');
    if (entryJobs.join(' → ') !== jobOrder) {
      failures.push(`${name}: ci:local job order ${entryJobs.join(' → ') || '(none)'} does not match the workflow order ${jobOrder}`);
    }
    for (const { job, commands } of jobs) {
      const jobEntries = entries.filter((entry) => entry.job === job);
      for (const command of commands) {
        // One entry can stand in for several workflow commands (the skipped
        // Windows job, the deduped npm ci), so entries are not consumed.
        if (!jobEntries.some((entry) => (entry.ci ?? [entry.cmd]).some((covered) => covered === command))) {
          failures.push(`${name}/${job}: workflow command missing from ci:local: ${command}`);
        }
      }
    }
  }
  for (const step of steps) {
    if (!FAST_WORKFLOWS.includes(step.workflow)) failures.push(`ci:local step ${step.id} names an unknown workflow ${step.workflow}`);
    if (step.skip && step.job !== 'windows-portable') failures.push(`ci:local step ${step.id} skips but is not the Windows-only job`);
    if (!step.skip && step.job === 'windows-portable') failures.push(`ci:local step ${step.id} must list the Windows-only job as skipped`);
  }
  return failures;
}

// Resolve the playwright chromium path the CI journey step exports as
// KUDY_CHROMIUM. Runs inside the journeys step: on a fresh host the
// Chromium install step has already run, and a missing binary fails that
// step with a named reason instead of crashing before the first step.
function chromiumEnv() {
  const probe = spawnSync(process.execPath, ['-e', `process.stdout.write(require('playwright').chromium.executablePath())`], {
    cwd: REPO_ROOT, encoding: 'utf8',
  });
  const executable = probe.status === 0 ? probe.stdout.trim() : '';
  if (!executable || !fs.existsSync(executable)) {
    throw new Error(`playwright chromium executable not found (${probe.stderr.trim() || executable || 'no output'}) — run the Chromium install step`);
  }
  fs.accessSync(executable, fs.constants.X_OK);
  return { KUDY_CHROMIUM: executable };
}

// One step of the local run: prints its outcome and returns the exit code
// the runner should propagate (0 = green/deduped/skipped). Exported for the
// revert guard: the dedupe-before-install branch must fail through THIS
// production path, not only through the pure helper (voka finding
// dedupe-guard-not-wired).
export function runStep(step, { installed, chromiumProbe }) {
  if (step.skip) {
    console.log(`SKIP [${step.workflow}/${step.job}] ${step.skip}`);
    return 0;
  }
  if (step.deduped !== undefined) {
    const dedupe = dedupeStepResult(installed, step.deduped);
    if (dedupe.code === 0) {
      console.log(`DEDUPED [${step.id}] npm ci for ${step.deduped} already ran above`);
      return 0;
    }
    console.error(`FAIL [${step.id}] ${dedupe.message}`);
    return 1;
  }
  if (step.install !== undefined) {
    installed.add(step.install);
  }
  let env = process.env;
  if (step.needsChromium === true) {
    try {
      env = { ...process.env, ...chromiumProbe() };
    } catch (error) {
      console.error(`FAIL [${step.id}] ${error.message}`);
      return 1;
    }
  }
  let command = step.cmd;
  if (step.distroDeps === true && !fs.existsSync('/etc/debian_version')) {
    command = step.cmd.replace(' --with-deps', '');
    console.log(`NOTE [${step.id}] not a Debian-family host — playwright --with-deps only knows Debian package managers; installing the browser without distro packages`);
  }
  console.log(`RUN [${step.id}] $ ${command}${step.cwd !== '.' ? ` (cwd: ${step.cwd})` : ''}`);
  const result = spawnSync(command, {
    shell: true,
    cwd: path.join(REPO_ROOT, step.cwd ?? '.'),
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) {
    console.error(`FAIL [${step.id}] exit ${result.status ?? `signal ${result.signal}`}`);
    return result.status ?? 1;
  }
  return 0;
}

async function main() {
  if (process.platform === 'win32') {
    console.error('ci:local: NOT-VERIFIED (win32) — the Windows host path is issue #124; refusing to run a half-list that would read as a pass');
    return 3;
  }
  const chromiumProbe = (() => {
    let resolved = null;
    return () => {
      if (resolved === null) resolved = chromiumEnv();
      return resolved;
    };
  })();
  const steps = buildSteps();
  const installed = new Set();
  for (const step of steps) {
    const status = runStep(step, { installed, chromiumProbe });
    if (status !== 0) return status;
  }
  const skipped = steps.filter((step) => step.skip).map((step) => step.id);
  console.log(`ci:local: OK — ${steps.length - skipped.length} step(s) green, skipped on Linux: ${skipped.join(', ') || 'none'}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  process.exitCode = await main();
}
