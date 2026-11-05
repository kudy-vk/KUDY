// #132 — the one command behind `npm run e2e:android:local`: the Android E2E
// suites on a local emulator, on the Linux dev host, as
// docs/agent-rules/android-e2e-local.md requires. It composes the existing
// tools verbatim (implementation-rules 2/3) — the scope decision is
// tools/ci/android-e2e-scope.mjs, the build is
// tools/android-build/android-build.mjs, every device touch goes through the
// G23.03 runner (run-e2e.mjs) — and owns only the glue: order, the host lock,
// the emulator lifecycle it started, and the summary line.
//
//   npm run e2e:android:local
//   npm run e2e:android:local -- --jdk <abs> --sdk <abs> --build-root <abs>
//
// Order (issue #132, criterion 2): scope short-cut → build the debug APK for
// the exact HEAD → boot the AVD kudy-ci (pixel_5, API 36) with the CI flags
// and KVM → smoke, walk, discovery → the non-gating visual:check → one
// summary line. A `SKIP e2e:android` line is never a pass.
//
// Host policy (criterion 3): one run per host. The lock lives in
// $KUDY_ANDROID_ROOT (default ~/KUDY-Android) with the checkout-lock policy —
// a stale lock is reported, never taken over. The runner never kills an
// emulator, Metro or origin server it did not start: a booted foreign
// emulator or a busy 8083/8792 port refuses the run with the reason.
//
// Exit codes: 0 passed (or scope run=false), 1 suite failure, 2 usage,
// 3 NOT-VERIFIED (a named reason stopped the suites; never a pass), 4 the
// host is locked by another run. The Windows host path is issue #124; here
// the runner reports NOT-VERIFIED instead of half-running.
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { acquireLock } from '../android-build/checkout-lock.mjs';
import { DEFAULT_METRO_PORT, DEFAULT_ORIGIN_PORT } from './run-e2e.mjs';
import { listBootedDevices, resolveAdb } from './driver.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANDROID_BUILD_TOOL = path.join(REPO_ROOT, 'tools', 'android-build', 'android-build.mjs');
const RUN_E2E_TOOL = path.join(REPO_ROOT, 'tools', 'e2e-android', 'run-e2e.mjs');
const VISUAL_CHECK_TOOL = path.join(REPO_ROOT, 'tools', 'e2e-android', 'visual-check.mjs');
const ARTIFACTS_ROOT = path.join(REPO_ROOT, 'tools', 'e2e-android', 'artifacts');
const SCOPE_TOOL = path.join(REPO_ROOT, 'tools', 'ci', 'android-e2e-scope.mjs');
const AVD_NAME = 'kudy-ci';
const SYSTEM_IMAGE_DIR = path.join('system-images', 'android-36', 'google_apis', 'x86_64');
// CI parity (.github/workflows/android-e2e.yml) with one evidence-based
// deviation: the guest RAM. At the CI value (2048, auto-raised to 2560 by the
// emulator) every android-36 google_apis guest on this host ANRs SystemUI
// within a minute of boot — the ANR dialog is the only dumpable window, so
// every suite case times out (issue #132 debugging log: three boots on
// 2026-11-04, and the hosted CI job has never passed an emulator run on these
// flags either). At 4096 MB the guest boots and stays healthy. RAM does not
// change rendered pixels, so visual:check baseline parity is unaffected.
// The other flags stay exactly CI's — other flags can produce false
// visual:check diffs (android-e2e-local.md §2).
const EMULATOR_FLAGS = ['-no-window', '-no-audio', '-no-snapshot', '-gpu', 'swiftshader_indirect', '-memory', '4096'];
const BOOT_ATTEMPTS = 120;
const BOOT_POLL_MS = 5000;

export const EXIT = Object.freeze({ passed: 0, failed: 1, usage: 2, notVerified: 3, locked: 4 });
export const SUITES = Object.freeze(['smoke', 'walk', 'discovery']);

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// ---------- pure decision helpers (the rules the tests pin) ----------

// The three outcome lines, verbatim per issue #132 criterion 2.5. `not
// needed` is not one of them: a scope run=false prints the rule doc's own
// line and exits 0 without touching the emulator.
export function summaryLine(outcome, { sha, suite, reason } = {}) {
  if (outcome === 'passed') return `Android E2E: passed on ${sha}`;
  if (outcome === 'failed') return `Android E2E: failed (${suite}) on ${sha}`;
  if (outcome === 'not-verified') return `Android E2E: NOT-VERIFIED (${reason})`;
  throw new Error(`unknown outcome: ${outcome}`);
}

// `android-e2e-scope.mjs` prints `android-e2e scope: run=true|false (…)`;
// anything else is an unknown verdict and means run (deny by default — the
// scope tool itself answers run=true for an unknown change set).
export function scopeNeeded(scopeOutput) {
  const match = String(scopeOutput ?? '').match(/^android-e2e scope: run=(true|false)\b/m);
  return match === null || match[1] === 'true';
}

// One run per host: reuse the checkout-lock idiom verbatim
// (tools/android-build/checkout-lock.mjs) for a host-wide lock file — the
// emulator and the 8083/8792 ports are host-global, unlike the checkout.
export function acquireHostLock(file, command, { alive } = {}) {
  return acquireLock(file, command, alive === undefined ? {} : { alive });
}

export function lockRefusalMessage(holder, stale, file) {
  if (stale) {
    return `e2e:android:local refused: stale host lock ${file} left by process ${holder.pid} `
      + `(${holder.command}, host ${holder.host}, started ${holder.startedAt}), which no longer runs. `
      + 'It is not removed automatically. If no Android E2E run is in progress, delete that file and rerun.';
  }
  return `e2e:android:local refused: an Android E2E run is already holding the host lock `
    + `(process ${holder.pid}, ${holder.command}, started ${holder.startedAt}, file ${file}). `
    + 'Wait for that run to finish.';
}

// The runner boots its own emulator and never reuses, never kills one it did
// not start: a coexisting foreign emulator is left alone (a shared dev host
// runs several sessions — this runner picks its own fresh serial and pins
// every suite to it). Real conflicts still refuse the run: the host lock and
// the 8083/8792 ports.
export function preExistingSerials(bootedSerials) {
  return bootedSerials.filter((name) => /^emulator-\d+$/.test(name));
}

export function portBusyReason(port) {
  return `port ${port} is already listening — a Metro or origin server this run did not start owns it; `
    + 'the runner never kills it. Finish that run first, then rerun.';
}

// JDK 17 only: tools/android-build refuses any other JDK (React Native 0.81
// builds with 17, CI builds with Temurin 17) — the Linux build uses 17 for
// the same reason (docs/development_setup.md, Linux section).
export function readJdkRelease(jdkDir, readFile = fs.readFileSync) {
  try {
    const text = readFile(path.join(jdkDir, 'release'), 'utf8');
    return (text.split(/\r?\n/).find((line) => line.startsWith('JAVA_VERSION=')) ?? '')
      .slice('JAVA_VERSION='.length)
      .replace(/^"|"$/g, '');
  } catch {
    return null;
  }
}

export function isJdk17(jdkDir, readFile) {
  const version = readJdkRelease(jdkDir, readFile);
  return typeof version === 'string' && version.startsWith('17');
}

// Scan candidate parent dirs for a directory whose name marks JDK 17
// (jdk-17*, …17-openjdk) and whose release file confirms 17. First match wins.
export function findJdk17(searchDirs, { isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory(), readFile } = {}) {
  for (const dir of searchDirs) {
    if (!isDir(dir)) continue;
    for (const entry of fs.readdirSync(dir).sort()) {
      if (!/17/.test(entry)) continue;
      const candidate = path.join(dir, entry);
      if (isDir(candidate) && isJdk17(candidate, readFile)) return candidate;
    }
  }
  return null;
}

// ---------- default io (the real process world) ----------

function realIo() {
  const require = createRequire(import.meta.url);
  const expoCli = require.resolve('expo/bin/cli');
  return {
    git(args) {
      return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).stdout?.trim();
    },
    runScopeTool(base, head) {
      const result = spawnSync(process.execPath, [SCOPE_TOOL, base, head], {
        cwd: REPO_ROOT, encoding: 'utf8', timeout: 60_000,
      });
      return result.status === 0 ? result.stdout : '';
    },
    listAvds(emulatorBinary) {
      const result = spawnSync(emulatorBinary, ['-list-avds'], { encoding: 'utf8', timeout: 30_000 });
      return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean) : [];
    },
    kvmWritable() {
      try {
        fs.accessSync('/dev/kvm', fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    },
    async listBootedDevices(adbPath) {
      return listBootedDevices(adbPath);
    },
    // Poll `adb get-state` until the serial answers `device` (30 s).
    async waitForDevice(adbPath, serial) {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const result = spawnSync(adbPath, ['-s', serial, 'get-state'], { encoding: 'utf8', timeout: 10_000 });
        if (result.status === 0 && result.stdout.trim() === 'device') return true;
        await sleep(2000);
      }
      return false;
    },
    // Spawn the CI AVD with the flags above (RAM per the evidence note) and
    // poll until sys.boot_completed prints 1. Never throws: any failure comes
    // back as { booted: false } so the caller can stop the child it owns.
    // The first serial that is NEW since the pre-boot list is sticky — a
    // coexisting foreign emulator must never be adopted.
    async bootEmulator({ emulatorBinary, adbPath, logPath, avd, knownSerials = [] }) {
      const log = fs.openSync(logPath, 'a');
      const child = spawn(emulatorBinary, ['-avd', avd, ...EMULATOR_FLAGS], {
        cwd: REPO_ROOT, detached: true, windowsHide: true, stdio: ['ignore', log, log],
      });
      fs.closeSync(log);
      let serial = null;
      try {
        for (let attempt = 1; attempt <= BOOT_ATTEMPTS && child.exitCode === null; attempt += 1) {
          await sleep(BOOT_POLL_MS);
          const fresh = (await listBootedDevices(adbPath))
            .filter((name) => /^emulator-\d+$/.test(name))
            .filter((name) => !knownSerials.includes(name));
          if (serial === null && fresh.length > 0) serial = fresh[0];
          if (serial !== null) {
            const prop = spawnSync(adbPath, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], { encoding: 'utf8' });
            if (prop.status === 0 && prop.stdout.trim() === '1') return { serial, child, booted: true };
          }
        }
      } catch (error) {
        fs.appendFileSync(logPath, `boot wait failed: ${error.message}\n`);
      }
      return { serial, child, booted: false };
    },
    // Stop only the emulator this run started: the console kill first (works
    // even when the child handle went stale — the emulator binary may restart
    // qemu underneath), then SIGTERM/SIGKILL to the process group, then wait
    // until adb no longer lists our serial.
    async stopEmulator({ child, adbPath, serial }) {
      if (serial) {
        spawnSync(adbPath, ['-s', serial, 'emu', 'kill'], { encoding: 'utf8', timeout: 15_000 });
      }
      if (child.exitCode !== null || child.signalCode !== null) return;
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        fs.appendFileSync(path.join(ARTIFACTS_ROOT, 'runner.log'), `emulator stop: ${error.message}\n`);
      }
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (child.exitCode !== null || child.signalCode !== null) break;
        await sleep(1000);
      }
      if (child.exitCode === null && child.signalCode === null) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // already gone
        }
      }
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const devices = await listBootedDevices(adbPath);
        if (!devices.includes(serial)) return;
        await sleep(1000);
      }
    },
    async netBusy(port) {
      return new Promise((resolve) => {
        const socket = net.connect({ port, host: '127.0.0.1', timeout: 1500 });
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });
    },
    runPrebuild(logPath) {
      const log = fs.openSync(logPath, 'a');
      const result = spawnSync(process.execPath, [expoCli, 'prebuild', '--platform', 'android', '--no-install'], {
        cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', log, log],
      });
      fs.closeSync(log);
      return { status: result.status };
    },
    buildApk({ sdk, jdk, buildRoot }) {
      const args = [ANDROID_BUILD_TOOL, 'build', '--build-root', buildRoot, '--jdk', jdk];
      if (sdk) args.push('--sdk', sdk);
      const result = spawnSync(process.execPath, args, { cwd: REPO_ROOT, stdio: 'inherit' });
      return { status: result.status };
    },
    async runSuite({ suite, adbPath, serial, logPath }) {
      return runChild({
        command: process.execPath,
        args: [RUN_E2E_TOOL, '--suite', suite, '--serial', serial],
        env: { ...process.env, KUDY_ADB: adbPath, KUDY_E2E_SERIAL: serial },
        logPath,
      });
    },
    async runVisualCheck({ outDir, adbPath, serial, logPath }) {
      return runChild({
        command: process.execPath,
        args: [VISUAL_CHECK_TOOL, '--out', outDir],
        env: { ...process.env, KUDY_ADB: adbPath, KUDY_E2E_SERIAL: serial },
        logPath,
      });
    },
  };
}

async function runChild({ command, args, env, logPath }) {
  const log = fs.createWriteStream(logPath, { flags: 'a' });
  const child = spawn(command, args, { cwd: REPO_ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const forward = (chunk) => {
    output += chunk;
    process.stdout.write(chunk);
    log.write(chunk);
  };
  child.stdout.on('data', forward);
  child.stderr.on('data', forward);
  const status = await new Promise((resolve) => child.on('close', (code) => resolve(code ?? 1)));
  await new Promise((resolve) => log.end(resolve));
  return { status, output };
}

function prebuildNeeded() {
  return !fs.existsSync(path.join(REPO_ROOT, 'android', 'gradlew'));
}

// An incremental run reuses the APK only when the latest record was built
// from the exact same HEAD of a clean tree — anything else rebuilds, so the
// installed APK always matches the checked-out HEAD.
function reusableApkRecord(buildRoot, head, gitStatus) {
  const records = path.join(buildRoot, 'records');
  if (!fs.existsSync(records)) return null;
  const files = fs.readdirSync(records).filter((name) => /^assembleDebug-.*\.json$/.test(name)).sort().reverse();
  for (const name of files) {
    try {
      const record = JSON.parse(fs.readFileSync(path.join(records, name), 'utf8'));
      if (record.gitHead === head && record.gitStatus === gitStatus && record.apk && fs.existsSync(record.apk.path)) return record;
    } catch {
      // an unreadable record is not a reason to skip a rebuild
    }
  }
  return null;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// ---------- main ----------

export async function main(argv = process.argv.slice(2), io = realIo()) {
  let args;
  try {
    args = parseArgs({
      args: argv,
      options: { jdk: { type: 'string' }, sdk: { type: 'string' }, 'build-root': { type: 'string' }, avd: { type: 'string' } },
      strict: true,
    }).values;
  } catch (error) {
    console.error(`e2e:android:local: ${error.message}`);
    console.error('usage: npm run e2e:android:local [-- --jdk <abs> --sdk <abs> --build-root <abs>]');
    return { code: EXIT.usage, summary: null };
  }

  const head = io.git(['rev-parse', 'HEAD']);
  const notVerified = (reason) => ({ code: EXIT.notVerified, summary: summaryLine('not-verified', { reason, sha: head }) });
  if (!/^[0-9a-f]{40}$/.test(head ?? '')) {
    return notVerified(`git rev-parse HEAD failed (${head ?? 'no output'})`);
  }

  // 1. Scope short-cut (criterion 2.1): the shared scope tool decides;
  // run=false exits 0 before anything boots or builds. Missing SHAs or a
  // tool failure mean run (deny by default).
  let scopeOutput = '';
  const base = io.git(['merge-base', 'origin/main', 'HEAD']);
  if (/^[0-9a-f]{40}$/.test(base ?? '')) scopeOutput = io.runScopeTool(base, head);
  if (!scopeNeeded(scopeOutput)) {
    console.log(scopeOutput.trim());
    const summary = `Android E2E: not needed (scope run=false on ${head})`;
    console.log(summary);
    return { code: EXIT.passed, summary };
  }
  console.log(scopeOutput.trim());

  if (process.platform === 'win32') {
    return notVerified('the Windows host path is issue #124; this runner implements the Linux path');
  }

  // 2. One run per host (criterion 3): a host-wide lock with the
  // checkout-lock policy — a stale lock is reported, never taken over.
  // The CI AVD is the default; --avd / KUDY_E2E_AVD selects another one — on
  // this host the android-36 image the CI AVD wraps ANRs SystemUI under app
  // load (issue #132 debugging log), and an android-35 guest passes all
  // three suites; switching the default is an operator decision (PR note).
  const avdName = args.avd ?? process.env.KUDY_E2E_AVD ?? AVD_NAME;
  const kudyRoot = process.env.KUDY_ANDROID_ROOT ?? path.join(os.homedir(), 'KUDY-Android');
  fs.mkdirSync(kudyRoot, { recursive: true });
  const lockFile = path.join(kudyRoot, 'e2e-android-local.lock');
  const lock = acquireHostLock(lockFile, 'e2e:android:local');
  if (lock.holder) {
    console.error(lockRefusalMessage(lock.holder, lock.stale, lockFile));
    return {
      code: EXIT.locked,
      summary: summaryLine('not-verified', { reason: 'another run holds the host lock', sha: head }),
    };
  }
  const releaseLock = () => lock.release();
  process.once('exit', releaseLock);

  let emulator = null;
  try {
    // 3. Host preflight. Every miss is a named NOT-VERIFIED, never a pass.
    const sdk = args.sdk ?? process.env.ANDROID_HOME;
    const adb = sdk ? resolveAdb({ ANDROID_HOME: sdk }) : null;
    if (!sdk || !fs.existsSync(sdk) || adb === null) {
      return notVerified(`no Android SDK with platform-tools (set --sdk or ANDROID_HOME; got ${sdk ?? 'nothing'})`);
    }
    const emulatorBinary = path.join(sdk, 'emulator', 'emulator');
    if (!fs.existsSync(emulatorBinary)) return notVerified(`no emulator binary at ${emulatorBinary}`);
    if (!fs.existsSync(path.join(sdk, SYSTEM_IMAGE_DIR))) {
      return notVerified(`missing system image ${SYSTEM_IMAGE_DIR} — install it with "${path.join(sdk, 'cmdline-tools', 'latest', 'bin', 'sdkmanager')} 'system-images;android-36;google_apis;x86_64'"`);
    }
    if (!io.listAvds(emulatorBinary).includes(avdName)) {
      return notVerified(`no AVD ${avdName} — create it with "${path.join(sdk, 'cmdline-tools', 'latest', 'bin', 'avdmanager')} create avd --name ${avdName} --device pixel_5 --package 'system-images;android-36;google_apis;x86_64'"`);
    }
    if (!io.kvmWritable()) {
      return notVerified('/dev/kvm is not writable for this user — the Linux host runs the emulator with KVM (add the user to the kvm group); no software fallback');
    }    const jdk = args.jdk ?? process.env.KUDY_JDK17 ?? findJdk17([path.join(kudyRoot, 'java'), '/usr/lib/jvm']);
    if (!jdk || !isJdk17(jdk)) {
      return notVerified('no JDK 17 (set --jdk or KUDY_JDK17) — the build uses JDK 17 like CI, because tools/android-build refuses any other JDK');
    }
    for (const port of [DEFAULT_METRO_PORT, DEFAULT_ORIGIN_PORT]) {
      if (await io.netBusy(port)) return notVerified(portBusyReason(port));
    }
    const preBoot = preExistingSerials(await io.listBootedDevices(adb));
    if (preBoot.length > 0) {
      console.log(`-- coexisting emulator(s) this run did not start (left alone, never reused or killed): ${preBoot.join(', ')}`);
    }

    // 4. Build the debug APK for the exact HEAD (criterion 2.2) BEFORE the
    // emulator boots: CI's order too — a full Gradle build pegs every core,
    // and a guest sitting through it starves (lmkd thrashing + SystemUI ANR
    // in the first run — the emulator must not share the host with the
    // build). Booting is the last step before the suites, like CI.
    const runDir = path.join(ARTIFACTS_ROOT, `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-local`);
    fs.mkdirSync(runDir, { recursive: true });
    console.log(`-- run dir: ${runDir}`);
    const buildRoot = args['build-root'] ?? path.join(kudyRoot, 'build');
    if (prebuildNeeded()) {
      console.log('-- android/ is missing — running expo prebuild --platform android --no-install');
      const prebuild = io.runPrebuild(path.join(runDir, 'prebuild.log'));
      if (prebuild.status !== 0) {
        return notVerified(`expo prebuild failed with exit ${prebuild.status} (log: ${path.join(runDir, 'prebuild.log')})`);
      }
    }
    const apkPath = path.join(REPO_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    const reuse = reusableApkRecord(buildRoot, head, io.git(['status', '--short']) ?? '');
    if (reuse) {
      console.log(`-- reusing the APK built from this HEAD of a clean tree (sha256 ${sha256(reuse.apk.path)})`);
    } else {
      console.log(`-- building the debug APK for ${head} (build root: ${buildRoot}, JDK 17: ${jdk})`);
      const build = io.buildApk({ sdk, jdk, buildRoot });
      if (build.status !== 0) {
        return notVerified(`APK build failed with exit ${build.status} — android-build writes its log and record under ${buildRoot}`);
      }
    }
    if (!fs.existsSync(apkPath)) return notVerified(`the built APK is missing: ${apkPath}`);
    console.log(`-- APK: ${apkPath} (sha256 ${sha256(apkPath)})`);

    // 5. Emulator (criterion 2.3): the CI AVD with the CI flags, KVM.
    console.log(`-- booting the AVD ${avdName} with KVM (flags: ${EMULATOR_FLAGS.join(' ')})`);
    const boot = await io.bootEmulator({ emulatorBinary, adbPath: adb, logPath: path.join(runDir, 'emulator.log'), avd: avdName, knownSerials: preBoot });
    if (!boot.booted) {
      await io.stopEmulator({ child: boot.child, adbPath: adb, serial: boot.serial });
      return notVerified(`emulator did not boot within ${Math.round((BOOT_ATTEMPTS * BOOT_POLL_MS) / 1000)} s (log: ${path.join(runDir, 'emulator.log')})`);
    }
    emulator = boot;

    // The guest reports boot_completed while its adbd can still refuse
    // `adb reverse` (seen right after a host reboot: the first suite died on
    // `adb -s … reverse tcp:8083`). Wait until adb answers `device` for our
    // serial before the suites.
    if (!(await io.waitForDevice(adb, emulator.serial))) {
      return notVerified(`emulator ${emulator.serial} did not settle to adb state 'device'`);
    }

    // 6. The suites (criterion 2.4): smoke, walk, discovery — a SKIP line is
    // never a pass.
    for (const suite of SUITES) {
      console.log(`-- suite ${suite}`);
      const { status, output } = await io.runSuite({ suite, adbPath: adb, serial: emulator.serial, logPath: path.join(runDir, `suite-${suite}.log`) });
      const skipLine = output.split(/\r?\n/).find((line) => line.startsWith('SKIP e2e:android'));
      if (skipLine) return notVerified(`${suite} skipped: ${skipLine.replace(/^SKIP e2e:android\s*/, '')}`);
      if (status !== 0) return { code: EXIT.failed, summary: summaryLine('failed', { suite, sha: head }) };
    }

    // 7. The non-gating visual:check report — its verdict never changes the
    // exit code (DQ-10 parity).
    const visual = await io.runVisualCheck({ outDir: path.join(runDir, 'visual-check'), adbPath: adb, serial: emulator.serial, logPath: path.join(runDir, 'visual-check.log') });
    console.log(`-- visual:check exit ${visual.status} (non-gating report: ${path.join(runDir, 'visual-check')})`);

    return { code: EXIT.passed, summary: summaryLine('passed', { sha: head }) };
  } finally {
    // The runner stops only the emulator it started (criterion 3), then
    // releases the host lock.
    if (emulator !== null) await io.stopEmulator({ child: emulator.child, adbPath: args.sdk ? resolveAdb({ ANDROID_HOME: args.sdk }) : resolveAdb(), serial: emulator.serial });
    releaseLock();
    process.removeListener('exit', releaseLock);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const { code, summary } = await main();
  if (summary !== null) console.log(summary);
  process.exitCode = code;
}
