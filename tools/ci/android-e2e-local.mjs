#!/usr/bin/env node
// #124 — the one command behind `npm run e2e:android:local`: run the Android
// E2E suites (smoke, walk, discovery) on a local emulator from one host
// directory (default D:\KUDY-Android), so an agent can prove a change before
// every push. The hosted android-e2e job is manual-only since 2026-11-04;
// this runner is its local replacement.
//
//   npm run e2e:android:local
//
// Steps: scope short-cut (docs-only change sets exit 0) → sync the calling
// checkout's exact HEAD into <root>\checkout (git fetch + checkout --detach)
// → npm ci when the lockfile changed → expo prebuild → debug APK through
// tools/android-build/android-build.mjs → hardware-accelerated emulator AVD
// kudy-ci → suites → non-gating visual:check → one summary line.
//
// Contract (issue #124): everything is written under <root> on drive D:;
// env vars (JAVA_HOME, ANDROID_HOME, ANDROID_SDK_ROOT, ANDROID_USER_HOME,
// ANDROID_AVD_HOME, GRADLE_USER_HOME, TEMP, TMP, npm_config_cache) are set
// only for this runner's child processes; one run at a time per host via a
// lock file with the checkout-lock.mjs policy (a stale lock is reported,
// never taken over); the runner never kills an emulator, Metro or origin
// server it did not start. A missing root/package answers
// `Android E2E: NOT-VERIFIED (<reason>)` with exit code 86 and never a pass.
//
// Exit codes: 0 pass (or scope skip), 1 suite/build/host failure, 64 usage,
// 75 stale local-runner lock, 86 NOT-VERIFIED.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { acquireLock } from '../android-build/checkout-lock.mjs';

const CALLING_CHECKOUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_ROOT = 'D:\\KUDY-Android';
const AVD_NAME = 'kudy-ci';
const SUITES = ['smoke', 'walk', 'discovery'];
const METRO_PORT = 8083;
const ORIGIN_PORT = 8792;
export const EXIT = Object.freeze({ ok: 0, fail: 1, usage: 64, lockStale: 75, notVerified: 86 });

const isWindows = process.platform === 'win32';
const exe = (name) => (isWindows ? `${name}.exe` : name);
// npm and npx are .cmd shims on Windows; since the 2024 spawn security patch
// they must go through cmd.exe (the android-build.mjs idiom), not a bare spawn.
const npmCommand = () => (isWindows ? 'cmd.exe' : 'npm');
const npmArgs = (args) => (isWindows ? ['/d', '/c', 'npm', ...args] : args);
const npxCommand = () => (isWindows ? 'cmd.exe' : 'npx');
const npxArgs = (args) => (isWindows ? ['/d', '/c', 'npx', ...args] : args);

// ---------- pure layout / policy helpers (unit-tested) ----------

// Windows drive root of an absolute path ('D:\'), or null for relative paths.
// win32 parsing is used on every host so the rule is one deterministic check.
export function driveOf(p) {
  const parsed = path.win32.parse(String(p));
  if (parsed.root === '') return null;
  return parsed.root.toUpperCase().replace(/\/$/, '\\');
}

// Pure path construction with no host rules: resolveLayout validates the
// D:-only rule on top of it, and the unit tests build POSIX-rooted layouts
// directly so the package checks stay testable on every platform (CI runs
// them on Ubuntu).
export function buildLayout(root) {
  return {
    root: String(root),
    java: path.join(root, 'java'),
    sdk: path.join(root, 'sdk'),
    checkout: path.join(root, 'checkout'),
    buildRoot: path.join(root, 'build'),
    avdHome: path.join(root, 'avd'),
    userHome: path.join(root, 'user-home'),
    tmp: path.join(root, 'tmp'),
    logs: path.join(root, 'logs'),
    visual: path.join(root, 'visual'),
    npmCache: path.join(root, 'npm-cache'),
    lockFile: path.join(root, 'runner.lock'),
    jdk: findJdk17(path.join(root, 'java')),
  };
}

export function resolveLayout(root) {
  const errors = [];
  if (driveOf(root) !== 'D:\\') errors.push(`root ${root} must be an absolute path on drive D:`);
  const layout = buildLayout(root);
  for (const [name, dir] of Object.entries(layout)) {
    if (name === 'jdk' || name === 'root') continue; // root is checked above
    if (driveOf(dir) !== 'D:\\') errors.push(`${name} path ${dir} is not on drive D:`);
  }
  return errors.length > 0 ? { errors } : { layout };
}

export function findJdk17(javaDir, { exists = fs.existsSync, list = (dir) => fs.readdirSync(dir) } = {}) {
  let entries = [];
  try {
    entries = list(javaDir).filter((name) => /^jdk-17/i.test(name) && exists(path.join(javaDir, name))).sort();
  } catch {
    return null;
  }
  return entries.length > 0 ? path.join(javaDir, entries[0]) : null;
}

// Every missing piece is one NOT-VERIFIED reason; the list is complete so the
// operator fixes all of them in one pass.
export function notVerifiedReasons(layout, { exists = fs.existsSync } = {}) {
  const reasons = [];
  const need = (dir, label) => {
    if (!exists(dir)) reasons.push(`missing ${label}: ${dir}`);
  };
  need(path.join(layout.sdk, 'platform-tools', exe('adb')), 'SDK platform-tools/adb');
  need(path.join(layout.sdk, 'cmdline-tools', 'latest', 'bin', `sdkmanager${isWindows ? '.bat' : ''}`),
    'SDK package cmdline-tools;latest');
  need(path.join(layout.sdk, 'build-tools', '36.0.0'), 'SDK package build-tools;36.0.0');
  need(path.join(layout.sdk, 'emulator', exe('emulator')), 'SDK emulator');
  need(path.join(layout.sdk, 'platforms', 'android-36'), 'SDK package platforms;android-36');
  need(path.join(layout.sdk, 'system-images', 'android-36', 'google_apis', 'x86_64'),
    'SDK package system-images;android-36;google_apis;x86_64');
  if (!layout.jdk) reasons.push(`missing JDK 17 under ${layout.java} (name a directory jdk-17*)`);
  else if (!exists(path.join(layout.jdk, 'bin', exe('java')))) reasons.push(`JDK at ${layout.jdk} has no bin/${exe('java')}`);
  need(path.join(layout.avdHome, `${AVD_NAME}.ini`), `AVD ${AVD_NAME}`);
  need(path.join(layout.checkout, '.git'), `build checkout (clone kudy-vk/KUDY into ${layout.checkout})`);
  if (!exists(layout.buildRoot)) reasons.push(`missing build root: ${layout.buildRoot} (create the directory)`);
  return reasons;
}

export const notVerifiedLine = (reason) => `Android E2E: NOT-VERIFIED (${reason})`;

// checkout-lock.mjs policy mapped to this runner's decisions: a lock owned by
// a live process means wait; a stale or unreadable lock is reported and never
// taken over — waiting on an unreadable holder would loop forever because its
// liveness can never be re-checked.
export function lockVerdict(lock) {
  if (lock.holder === undefined) return { action: 'acquired' };
  if (lock.stale || !Number.isInteger(lock.holder.pid)) return { action: 'stale', holder: lock.holder };
  return { action: 'wait', holder: lock.holder };
}

// The deps marker decides the npm ci short-cut; anything unreadable means
// reinstall (the marker only ever saves time, never correctness).
export function markerAllowsSkip(marker, lockHash, nodeModulesReady) {
  return Boolean(nodeModulesReady && marker && marker.lockHash && marker.lockHash === lockHash);
}

// The scope script's stdout decides the short-cut; anything unreadable keeps
// the full run (same fail-open rule as CI: an unknown change set runs the job).
export function scopeOutcome(stdout) {
  const match = String(stdout).match(/run=(true|false)\b/);
  return { run: match ? match[1] === 'true' : true, parsed: Boolean(match) };
}

export const summaryLine = ({ ok, suite, sha }) =>
  ok ? `Android E2E: passed on ${sha}` : `Android E2E: failed (${suite}) on ${sha}`;

// ---------- child process plumbing ----------

const childEnv = (layout, baseEnv) => {
  const env = { ...baseEnv };
  env.JAVA_HOME = layout.jdk;
  env.ANDROID_HOME = layout.sdk;
  env.ANDROID_SDK_ROOT = layout.sdk;
  env.ANDROID_USER_HOME = layout.userHome;
  env.ANDROID_AVD_HOME = layout.avdHome;
  env.KUDY_ADB = path.join(layout.sdk, 'platform-tools', exe('adb'));
  env.GRADLE_USER_HOME = path.join(layout.buildRoot, 'gradle-home');
  env.TEMP = layout.tmp;
  env.TMP = layout.tmp;
  // The emulator's netsim subsystem reads TMPDIR, not TEMP/TMP; without it the
  // emulator writes netsim.ini into the C: user temp (issue #124 AC 3).
  env.TMPDIR = layout.tmp;
  env.npm_config_cache = layout.npmCache;
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
  const prepend = [path.join(layout.sdk, 'platform-tools'), layout.jdk ? path.join(layout.jdk, 'bin') : null]
    .filter(Boolean);
  env[pathKey] = [...prepend, env[pathKey]].join(path.delimiter);
  return env;
};

const stamp = () => new Date().toISOString().replaceAll(/[:.]/g, '-');

// Runs a child to completion: streams output to the console, appends it to a
// log file under <root>\logs and returns { code, output }.
function runCommand(command, args, { cwd, env, logFile } = {}) {
  const log = logFile ? fs.createWriteStream(logFile, { flags: 'a' }) : null;
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, windowsHide: true });
    let output = '';
    const collect = (chunk) => {
      if (output.length < 64 * 1024 * 1024) output += chunk.toString();
      process.stdout.write(chunk);
      log?.write(chunk);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => {
      const message = `\n${command}: ${error.message}\n`;
      output += message;
      process.stderr.write(message);
      log?.write(message);
    });
    child.on('close', (code) => {
      log?.end();
      resolve({ code: code ?? 1, output });
    });
  });
}

// Quick TCP probe: true when something already listens on the port, so the
// runner can refuse instead of a foreign process being killed.
export function probePort(port, host = '127.0.0.1', timeoutMs = 750) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- steps ----------

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { code: result.status ?? 1, out: (result.stdout ?? '').trim(), err: (result.stderr ?? '').trim() };
}

async function syncBuildCheckout(layout, sha, log) {
  // The issue pins `git fetch <calling checkout> <sha>`; some git transports
  // refuse raw SHA requests, so the same HEAD is fetched by ref name as the
  // documented fallback — the assert on the synced sha stays the same either
  // way, so a wrong commit can never be built.
  const direct = git(layout.checkout, ['fetch', CALLING_CHECKOUT, sha]);
  let via = 'sha';
  if (direct.code !== 0) {
    log({ step: 'sync', decision: 'sha fetch refused; falling back to HEAD ref', reason: direct.err.split(/\r?\n/)[0] });
    const byRef = git(layout.checkout, ['fetch', CALLING_CHECKOUT, 'HEAD']);
    if (byRef.code !== 0) return { ok: false, message: `git fetch from ${CALLING_CHECKOUT} failed: ${byRef.err.split(/\r?\n/)[0]}` };
    via = 'HEAD ref';
  }
  const checkout = git(layout.checkout, ['checkout', '--detach', sha]);
  if (checkout.code !== 0) return { ok: false, message: `git checkout ${sha} failed: ${checkout.err.split(/\r?\n/)[0]}` };
  const head = git(layout.checkout, ['rev-parse', 'HEAD']);
  if (head.code !== 0 || head.out !== sha) return { ok: false, message: `synced HEAD is ${head.out || 'unknown'}, expected ${sha}` };
  return { ok: true, via };
}

async function ensureDependencies(layout, sha, env, log) {
  const markerFile = path.join(layout.checkout, '.kudy-e2e-local-deps.json');
  const lockHash = git(layout.checkout, ['rev-parse', 'HEAD:package-lock.json']).out || null;
  // npm ci writes node_modules/.package-lock.json (never a root package.json
  // there), so that artifact is the "install present" marker.
  const nodeModulesReady = fs.existsSync(path.join(layout.checkout, 'node_modules', '.package-lock.json'));
  let marker = null;
  try {
    marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
  } catch { /* absent or unreadable marker → reinstall */ }
  if (markerAllowsSkip(marker, lockHash, nodeModulesReady)) {
    log({ step: 'deps', decision: 'npm ci skipped', reason: 'package-lock.json unchanged since the last run' });
    return { ok: true };
  }
  const result = await runCommand(npmCommand(), npmArgs(['ci']), { cwd: layout.checkout, env,
    logFile: path.join(layout.logs, `npm-ci-${stamp()}.log`) });
  if (result.code !== 0) return { ok: false, message: `npm ci failed with exit ${result.code}` };
    try {
    fs.writeFileSync(markerFile, `${JSON.stringify({ lockHash, head: sha, marker: 'e2e-local deps marker' })}\n`);
  } catch (error) {
    log({ step: 'deps', decision: 'marker not written', reason: error.message });
  }
  log({ step: 'deps', decision: 'npm ci ran', head: sha });
  return { ok: true };
}

async function bootedEmulators(layout, env) {
  const adb = path.join(layout.sdk, 'platform-tools', exe('adb'));
  const result = await runCommand(adb, ['devices'], { env });
  return result.output.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^emulator-\d+\s+device$/.test(line))
    .map((line) => line.split(/\s+/)[0]);
}

async function emulatorAvdName(layout, env, serial) {
  const adb = path.join(layout.sdk, 'platform-tools', exe('adb'));
  const result = await runCommand(adb, ['-s', serial, 'emu', 'avd', 'name'], { env });
  return result.output.split(/\r?\n/)[0]?.trim() ?? '';
}

async function isBootCompleted(layout, env, serial) {
  const adb = path.join(layout.sdk, 'platform-tools', exe('adb'));
  const boot = await runCommand(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], { env });
  return boot.output.trim() === '1';
}

async function bootEmulator(layout, env, log) {
  const emulator = path.join(layout.sdk, 'emulator', exe('emulator'));
  const accel = spawnSync(emulator, ['-accel-check'], { env, encoding: 'utf8' });
  if (accel.status !== 0) {
    return { ok: false, notVerified: true,
      message: 'hardware acceleration unavailable; enable Windows Hypervisor Platform — '
        + 'emulator -accel-check fails and -accel off is forbidden by issue #124' };
  }
  log({ step: 'accel', decision: 'hardware acceleration confirmed',
    detail: (accel.stdout ?? '').split(/\r?\n/).find((l) => /usable|OK/i.test(l)) ?? '' });
  const logFile = path.join(layout.logs, `emulator-${stamp()}.log`);
  const child = spawn(emulator,
    ['-avd', AVD_NAME, '-no-window', '-no-audio', '-no-snapshot', '-gpu', 'swiftshader_indirect', '-memory', '2048'],
    { cwd: layout.root, env, detached: true, windowsHide: true,
      stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')] });
  child.unref();
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await sleep(5000);
    const serials = await bootedEmulators(layout, env);
    for (const serial of serials) {
      const avd = await emulatorAvdName(layout, env, serial);
      if (avd !== AVD_NAME) continue;
      if (await isBootCompleted(layout, env, serial)) return { ok: true, serial };
    }
  }
  return { ok: false, message: `emulator ${AVD_NAME} did not boot within 10 min (log: ${logFile})` };
}

// ---------- main ----------

async function main() {
  if (process.argv.length > 2) {
    console.error('usage: npm run e2e:android:local (no arguments; the host root is KUDY_ANDROID_ROOT or D:\\KUDY-Android)');
    return EXIT.usage;
  }
  // 1. Scope short-cut first (issue #124 step 1): a docs-only change set
  // exits 0 before anything is resolved or written, so an unconfigured host
  // still skips honestly. Nothing below runs before this decision.
  const head = git(CALLING_CHECKOUT, ['rev-parse', 'HEAD']);
  const sha = head.code === 0 ? head.out : null;
  const mergeBase = git(CALLING_CHECKOUT, ['merge-base', 'origin/main', 'HEAD']);
  const scope = await runCommand(process.execPath, [path.join(CALLING_CHECKOUT, 'tools', 'ci', 'android-e2e-scope.mjs'),
    ...(mergeBase.code === 0 && sha ? [mergeBase.out, sha] : [])],
  { cwd: CALLING_CHECKOUT, env: { ...process.env, EXPO_NO_TELEMETRY: '1' } });
  const outcome = scopeOutcome(scope.output);
  if (!outcome.run && sha) {
    console.log(`Android E2E: skipped (scope run=false) on ${sha}`);
    return EXIT.ok;
  }
  const scopeEntry = { step: 'scope', run: outcome.run, parsed: outcome.parsed, mergeBase: mergeBase.code === 0 ? mergeBase.out : null };

  // 2. layout and NOT-VERIFIED diagnostics, only for change sets that need
  // the suites.
  let layout;
  {
    const root = process.env.KUDY_ANDROID_ROOT ?? DEFAULT_ROOT;
    const resolved = resolveLayout(root);
    if (resolved.errors) {
      for (const error of resolved.errors) console.log(notVerifiedLine(error));
      return EXIT.notVerified;
    }
    layout = resolved.layout;
    for (const dir of [layout.logs, layout.tmp, layout.visual]) fs.mkdirSync(dir, { recursive: true });
  }
  const runStamp = stamp();
  const logPath = path.join(layout.logs, `run-${runStamp}.jsonl`);
  const log = (entry) => {
    try {
      fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
    } catch (error) {
      console.error(`-- runner log append failed: ${error.message}`);
    }
  };
  const env = childEnv(layout, process.env);
  log(scopeEntry);
  if (!sha) {
    console.log(notVerifiedLine(`calling checkout HEAD unreadable: ${head.err.split(/\r?\n/)[0]}`));
    log({ step: 'not-verified', reason: 'calling checkout HEAD unreadable' });
    return EXIT.notVerified;
  }

  const reasons = notVerifiedReasons(layout);
  if (reasons.length > 0) {
    for (const reason of reasons) console.log(notVerifiedLine(reason));
    log({ step: 'not-verified', reasons });
    return EXIT.notVerified;
  }

  // 3. one run at a time; wait visibly on a live holder, refuse a stale one.
  let lock = acquireLock(layout.lockFile, 'e2e:android:local');
  let verdict = lockVerdict(lock);
  while (verdict.action === 'wait') {
    const who = verdict.holder.pid ?? JSON.stringify(verdict.holder);
    console.log(`-- Android E2E: waiting for the local runner lock held by process ${who} `
      + `(${verdict.holder.command ?? 'unknown'}, started ${verdict.holder.startedAt ?? 'unknown'})`);
    await sleep(5000);
    lock = acquireLock(layout.lockFile, 'e2e:android:local');
    verdict = lockVerdict(lock);
  }
  if (verdict.action === 'stale') {
    const cause = verdict.holder.unreadable ? 'unreadable' : 'stale';
    const who = verdict.holder.pid ?? JSON.stringify(verdict.holder);
    console.error(`Android E2E: ${cause} local-runner lock ${layout.lockFile} `
      + `${verdict.holder.unreadable ? 'cannot be read' : `left by process ${who} `
        + `(${verdict.holder.command ?? 'unknown'}, started ${verdict.holder.startedAt ?? 'unknown'})`}; `
      + 'it is not removed automatically. If no local E2E run is in progress, delete that file and rerun.');
    log({ step: 'lock', verdict: 'stale-refused', holder: verdict.holder });
    return EXIT.lockStale;
  }
  process.once('exit', () => lock.release?.());
  log({ step: 'lock', verdict: 'acquired' });

  // 4. sync the exact calling checkout HEAD into the D: build checkout.
  const sync = await syncBuildCheckout(layout, sha, log);
  if (!sync.ok) {
    console.error(`-- sync failed: ${sync.message}`);
    console.log(summaryLine({ ok: false, suite: 'sync', sha }));
    return EXIT.fail;
  }
  log({ step: 'sync', decision: `fetched ${sync.via}`, sha });

  // 5. dependencies, prebuild, APK build — all inside the D: checkout.
  const deps = await ensureDependencies(layout, sha, env, log);
  if (!deps.ok) {
    console.error(`-- ${deps.message}`);
    console.log(summaryLine({ ok: false, suite: 'npm ci', sha }));
    return EXIT.fail;
  }
  const prebuild = await runCommand(npxCommand(), npxArgs(['expo', 'prebuild', '--platform', 'android', '--no-install']),
    { cwd: layout.checkout, env, logFile: path.join(layout.logs, `prebuild-${runStamp}.log`) });
  if (prebuild.code !== 0) {
    log({ step: 'prebuild', exitCode: prebuild.code });
    console.log(summaryLine({ ok: false, suite: 'expo prebuild', sha }));
    return EXIT.fail;
  }
  log({ step: 'prebuild', exitCode: 0 });
  const build = await runCommand(process.execPath, [path.join(layout.checkout, 'tools', 'android-build', 'android-build.mjs'),
    'build', '--build-root', layout.buildRoot, '--sdk', layout.sdk, '--jdk', layout.jdk],
  { cwd: layout.checkout, env, logFile: path.join(layout.logs, `build-${runStamp}.log`) });
  const apkPath = path.join(layout.checkout, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (build.code !== 0 || !fs.existsSync(apkPath)) {
    log({ step: 'build', exitCode: build.code, apk: false });
    console.log(summaryLine({ ok: false, suite: 'build', sha }));
    return EXIT.fail;
  }
  log({ step: 'build', exitCode: build.code, apk: true, apkPath });

  // 6. emulator: adopt a booted kudy-ci, otherwise boot one; never kill.
  const existing = await bootedEmulators(layout, env);
  let serial = null;
  if (existing.length === 1) {
    const avd = await emulatorAvdName(layout, env, existing[0]);
    if (avd !== AVD_NAME) {
      console.error(`Android E2E: emulator ${existing[0]} runs AVD ${avd || 'unknown'}, not ${AVD_NAME}; `
        + 'stop it or boot the right AVD yourself — foreign emulators are never killed.');
      log({ step: 'emulator', verdict: 'foreign-avd', serial: existing[0], avd });
      return EXIT.fail;
    }
    serial = existing[0];
    // An adopted emulator may still be mid-boot (a crashed run left it
    // starting); wait for boot completion instead of handing the suites a
    // device that cannot answer.
    let booted = false;
    for (let attempt = 0; attempt < 12 && !booted; attempt += 1) {
      booted = await isBootCompleted(layout, env, serial);
      if (!booted) await sleep(5000);
    }
    if (!booted) {
      console.error(`Android E2E: adopted emulator ${serial} has not finished booting within 60 s; `
        + 'restart it or wait and rerun — the runner never kills it.');
      log({ step: 'emulator', verdict: 'adopted-not-booted', serial });
      return EXIT.fail;
    }
    log({ step: 'emulator', decision: 'adopted booted emulator', serial });
  } else if (existing.length > 1) {
    console.error(`Android E2E: several emulators are booted ([${existing.join(', ')}]); `
      + 'stop the extra ones — foreign emulators are never killed.');
    log({ step: 'emulator', verdict: 'multiple-booted', serials: existing });
    return EXIT.fail;
  } else {
    const booted = await bootEmulator(layout, env, log);
    if (!booted.ok) {
      if (booted.notVerified) console.log(notVerifiedLine(booted.message));
      else console.error(`Android E2E: ${booted.message}`);
      log({ step: 'emulator', verdict: booted.notVerified ? 'no-hardware-acceleration' : 'boot-failed' });
      return booted.notVerified ? EXIT.notVerified : EXIT.fail;
    }
    serial = booted.serial;
    log({ step: 'emulator', decision: 'booted emulator', serial });
  }
  console.log(`-- emulator ${serial} (${AVD_NAME}) in use; it is left running for the next incremental run`);

  // 7. ports must be free before the suites start; a foreign listener fails
  // the run loudly instead of being killed.
  for (const [label, port] of [['metro', METRO_PORT], ['origin', ORIGIN_PORT]]) {
    if (await probePort(port)) {
      console.error(`Android E2E: port ${port} (${label}) is already in use; free it or stop its owner `
        + '— the runner never kills a server it did not start.');
      log({ step: 'ports', verdict: 'occupied', label, port });
      return EXIT.fail;
    }
  }

  // 8. suites; the first failure stops the rest, a SKIP line fails the run.
  const suiteEnv = { ...env, KUDY_E2E_APK: apkPath };
  for (const suite of SUITES) {
    const suiteLog = path.join(layout.logs, `${suite}-${runStamp}.log`);
    const result = await runCommand(npmCommand(), npmArgs(['run', 'e2e:android', '--', '--suite', suite]),
      { cwd: layout.checkout, env: suiteEnv, logFile: suiteLog });
    const skipped = /^SKIP e2e:android\b/m.test(result.output);
    log({ step: 'suite', suite, exitCode: result.code, skipped, log: suiteLog });
    if (result.code !== 0 || skipped) {
      if (skipped) console.error(`-- suite ${suite} printed SKIP e2e:android (see ${suiteLog})`);
      console.log(summaryLine({ ok: false, suite, sha }));
      return EXIT.fail;
    }
    console.log(`-- suite ${suite} passed (log: ${suiteLog})`);
  }

  // 9. non-gating visual:check, CI parity: the report is recorded, the exit
  // code never gates the run.
  const visualOut = path.join(layout.visual, runStamp);
  const visual = await runCommand(npmCommand(), npmArgs(['run', 'visual:check', '--', '--out', visualOut]),
    { cwd: layout.checkout, env: suiteEnv, logFile: path.join(layout.logs, `visual-${runStamp}.log`) });
  console.log(`-- visual:check exit ${visual.code} (non-gating; report: ${visualOut})`);
  log({ step: 'visual', exitCode: visual.code, out: visualOut });

  console.log(summaryLine({ ok: true, sha }));
  log({ step: 'summary', ok: true, sha });
  return EXIT.ok;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  process.exitCode = await main();
}
