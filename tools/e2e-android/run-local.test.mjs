// #132 criteria 2, 3 and 6 — the rules of `npm run e2e:android:local` and
// their failing-on-revert tests: the scope short-cut, the summary lines and
// their distinct exit codes, the host lock (a stale lock is reported, never
// taken over), the foreign-emulator and busy-port refusals, the SKIP line
// that is never a pass, and the suite order smoke → walk → discovery with
// the non-gating visual:check. main() runs against a stub io over fixture
// SDK/JDK trees, so every test drives the production main, not a
// re-implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXIT,
  SUITES,
  acquireHostLock,
  findJdk17,
  isJdk17,
  lockRefusalMessage,
  main,
  ownEmulatorPid,
  ownSerial,
  portBusyReason,
  preExistingSerials,
  readJdkRelease,
  scopeNeeded,
  summaryLine,
} from './run-local.mjs';
import { acquireLock } from '../android-build/checkout-lock.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HEAD = 'a'.repeat(40);
const BASE = 'b'.repeat(40);
const RUN_FALSE = 'android-e2e scope: run=false (3 changed file(s))';
const RUN_TRUE = 'android-e2e scope: run=true (5 changed file(s))';

// A preflight-shaped SDK tree: platform-tools/adb, the emulator binary, the
// CI system image. resolveAdb and the existence checks run the real code.
function makeFakeSdk() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-e2e-sdk-'));
  for (const file of [
    path.join(dir, 'platform-tools', 'adb'),
    path.join(dir, 'emulator', 'emulator'),
  ]) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '#!/bin/sh\n');
  }
  fs.mkdirSync(path.join(dir, 'system-images', 'android-36', 'google_apis', 'x86_64'), { recursive: true });
  return dir;
}

function makeFakeJdk() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-e2e-jdk-'));
  fs.writeFileSync(path.join(dir, 'release'), 'JAVA_VERSION="17.0.21"\n');
  return dir;
}

// android/gradlew (skips the prebuild step) and the built APK: both live in
// gitignored paths of the checkout. Only files this fixture creates are
// removed afterwards — a real android/ from a real run stays.
function fakeBuildOutputs() {
  const created = [];
  const gradlew = path.join(root, 'android', 'gradlew');
  const apk = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  for (const file of [gradlew, apk]) {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, '');
      created.push(file);
    }
  }
  return {
    restore: () => {
      for (const file of created) fs.rmSync(file, { force: true });
    },
  };
}

// Every io method main can reach is a failing spy unless a test overrides it,
// so an unexpected step past the rule under test turns the test red.
function stubIo(overrides = {}) {
  const calls = {};
  const order = [];
  const defaults = {
    git: (args) => (args[0] === 'rev-parse' ? HEAD : BASE),
    runScopeTool: () => RUN_TRUE,
    listAvds: () => ['kudy-ci'],
    kvmWritable: () => true,
    netBusy: () => false,
    listBootedDevices: () => [],
    waitForDevice: () => true,
    bootEmulator: () => ({ serial: 'emulator-5554', child: { exitCode: null }, booted: true }),
    stopEmulator: () => {},
    runPrebuild: () => ({ status: 0 }),
    buildApk: () => ({ status: 0 }),
    runSuite: () => ({ status: 0, output: 'smoke: 12 passed, 0 failed\n' }),
    runVisualCheck: () => ({ status: 0, output: '' }),
  };
  const io = {};
  for (const [name, impl] of Object.entries({ ...defaults, ...overrides })) {
    calls[name] = [];
    io[name] = (...args) => {
      calls[name].push(args);
      order.push(name);
      return impl(...args);
    };
  }
  io.calls = calls;
  io.order = order;
  return io;
}

// Index of an io method's first call in the global invocation order —
// io.calls.<name> only records that method's arguments.
function callIndex(io, name) {
  return io.order.indexOf(name);
}

// --sdk/--jdk make the preflight deterministic on any host (CI has no
// /usr/lib/jvm JDK 17 or android-36 image guarantee).
function preflightArgs() {
  const sdk = makeFakeSdk();
  const jdk = makeFakeJdk();
  return {
    args: ['--sdk', sdk, '--jdk', jdk],
    restore: () => {
      fs.rmSync(sdk, { recursive: true, force: true });
      fs.rmSync(jdk, { recursive: true, force: true });
    },
  };
}

// Every main() run happens under a temp KUDY_ANDROID_ROOT so the tests
// neither touch the real ~/KUDY-Android nor race a real local run's lock.
async function withTempRoot(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-e2e-root-'));
  const originalRoot = process.env.KUDY_ANDROID_ROOT;
  process.env.KUDY_ANDROID_ROOT = dir;
  const buildOutputs = fakeBuildOutputs();
  try {
    return await fn(dir);
  } finally {
    if (originalRoot === undefined) delete process.env.KUDY_ANDROID_ROOT;
    else process.env.KUDY_ANDROID_ROOT = originalRoot;
    buildOutputs.restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the exit codes are distinct and NOT-VERIFIED never reads as a pass', () => {
  assert.equal(new Set(Object.values(EXIT)).size, Object.keys(EXIT).length);
  assert.equal(EXIT.passed, 0);
  assert.equal(EXIT.failed, 1);
  assert.equal(EXIT.usage, 2);
  assert.equal(EXIT.notVerified, 3);
  assert.equal(EXIT.locked, 4);
});

test('the three outcome lines follow the issue wording', () => {
  assert.equal(summaryLine('passed', { sha: HEAD }), `Android E2E: passed on ${HEAD}`);
  assert.equal(summaryLine('failed', { suite: 'walk', sha: HEAD }), `Android E2E: failed (walk) on ${HEAD}`);
  assert.equal(summaryLine('not-verified', { reason: 'no emulator', sha: HEAD }), 'Android E2E: NOT-VERIFIED (no emulator)');
  assert.throws(() => summaryLine('skipped'));
});

test('scope verdict: only run=false is the short-cut; garbage and failure mean run', () => {
  assert.equal(scopeNeeded(RUN_FALSE), false);
  assert.equal(scopeNeeded(RUN_TRUE), true);
  assert.equal(scopeNeeded(''), true, 'a lost scope verdict must run, never skip');
  assert.equal(scopeNeeded(undefined), true);
  assert.equal(scopeNeeded('android-e2e scope: run=maybe'), true);
});

test('scope run=false exits 0 and never builds, boots or locks (criterion 2.1)', async () => {
  await withTempRoot(async () => {
    const io = stubIo({
      runScopeTool: () => RUN_FALSE,
      netBusy: () => assert.fail('the short-cut must not touch the host'),
      bootEmulator: () => assert.fail('the short-cut must not boot an emulator'),
    });
    const { code, summary } = await main([], io);
    assert.equal(code, EXIT.passed);
    assert.equal(summary, `Android E2E: not needed (scope run=false on ${HEAD})`);
    assert.deepEqual(io.calls.runScopeTool, [[BASE, HEAD]]);
  });
});

test('a scope tool failure denies the short-cut and runs the full pipeline', async () => {
  await withTempRoot(async (tempRoot) => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo({ runScopeTool: () => '' });
      const { code } = await main(args, io);
      assert.equal(code, EXIT.passed);
      assert.equal(io.calls.bootEmulator.length, 1, 'the run continues to the emulator');
      assert.equal(io.calls.runSuite.length, SUITES.length);
      assert.equal(fs.existsSync(path.join(tempRoot, 'e2e-android-local.lock')), false, 'the host lock is released');
    } finally {
      restore();
    }
  });
});

test('the host lock refuses a live holder (criterion 3)', async () => {
  await withTempRoot(async (tempRoot) => {
    const lockFile = path.join(tempRoot, 'e2e-android-local.lock');
    const holder = acquireLock(lockFile, 'e2e:android:local (other session)');
    try {
      const io = stubIo({
        bootEmulator: () => assert.fail('a locked host must never boot an emulator'),
      });
      const { code, summary } = await main([], io);
      assert.equal(code, EXIT.locked);
      assert.match(summary, /NOT-VERIFIED/);
      assert.equal(io.calls.bootEmulator.length, 0);
      const message = lockRefusalMessage(JSON.parse(fs.readFileSync(lockFile, 'utf8')), false, lockFile);
      assert.match(message, /already holding the host lock/);
    } finally {
      holder.release();
    }
    assert.equal(fs.existsSync(lockFile), false, 'the owner releases its own lock');
  });
});

test('a stale lock is refused with the manual-removal message (criterion 3)', async () => {
  await withTempRoot(async (tempRoot) => {
    const lockFile = path.join(tempRoot, 'e2e-android-local.lock');
    let deadPid = null;
    for (let candidate = 100_000; candidate < 500_000 && deadPid === null; candidate += 1) {
      try {
        process.kill(candidate, 0);
      } catch (error) {
        if (error.code === 'ESRCH') deadPid = candidate;
      }
    }
    assert.notEqual(deadPid, null, 'the test needs a pid that does not run on this host');
    fs.writeFileSync(lockFile, JSON.stringify({ pid: deadPid, command: 'e2e:android:local', host: os.hostname(), startedAt: new Date().toISOString() }));
    const io = stubIo({ bootEmulator: () => assert.fail('a stale lock must never be taken over') });
    const { code, summary } = await main([], io);
    assert.equal(code, EXIT.locked);
    assert.match(summary, /NOT-VERIFIED/);
    assert.equal(io.calls.bootEmulator.length, 0);
    assert.equal(fs.existsSync(lockFile), true, 'the stale lock stays for a human to remove');
    const holder = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    assert.match(lockRefusalMessage(holder, true, lockFile), /stale host lock/);
    assert.match(lockRefusalMessage(holder, true, lockFile), /not removed automatically/);
  });
});

test('a coexisting foreign emulator is left alone; the runner pins its own new serial', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      let boots = 0;
      const io = stubIo({
        // A foreign emulator is up before and after this run boots its own.
        listBootedDevices: () => (boots++ === 0 ? ['emulator-5556'] : ['emulator-5556', 'emulator-5554']),
      });
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.passed, `expected a pass, got ${summary}`);
      assert.deepEqual(io.calls.runSuite.map(([runArgs]) => runArgs.serial), ['emulator-5554', 'emulator-5554', 'emulator-5554'],
        'every suite must be pinned to the runner\'s own emulator');
      assert.deepEqual(io.calls.stopEmulator.map(([stopArgs]) => stopArgs.serial), ['emulator-5554'],
        'cleanup must touch only the emulator this run started');
      assert.equal(preExistingSerials(['emulator-5556', 'device-x', 'emulator-5554']).join(','), 'emulator-5556,emulator-5554');
      assert.deepEqual(preExistingSerials([]), []);
    } finally {
      restore();
    }
  });
});

test('a busy Metro or origin port refuses the run with the named port', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo({ netBusy: (port) => port === 8083 });
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.notVerified);
      assert.match(summary, /port 8083 is already listening/);
    } finally {
      restore();
    }
  });
  assert.match(portBusyReason(8792), /the runner never kills it/);
});

// Fake /proc tree: two qemu processes run `-avd kudy-ci` — ours (pgid 4242)
// and a foreign copy booting concurrently (pgid 9999).
function makeFakeProc() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-proc-'));
  const write = (pid, pgid) => {
    fs.mkdirSync(path.join(dir, pid), { recursive: true });
    fs.writeFileSync(path.join(dir, pid, 'stat'), `${pid} (qemu-system-x86) S 1 ${pgid} 1 0 -1 4194560\n`);
    fs.writeFileSync(path.join(dir, pid, 'cmdline'), `/emulator/qemu-system-x86_64\0-avd\0kudy-ci\0-no-window\0`);
  };
  write('111', '4242');
  write('222', '9999');
  return { dir, restore: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('the runner adopts only the emulator in its own process group (voka foreign-serial-adoption-race)', () => {
  const proc = makeFakeProc();
  try {
    // The port map gives ours 5556 and the foreign one 5554 — the first fresh
    // serial would adopt the foreign guest.
    assert.equal(ownEmulatorPid({ pid: 4242, avd: 'kudy-ci', procDir: proc.dir }), 111);
    assert.equal(ownEmulatorPid({ pid: 9999, avd: 'kudy-ci', procDir: proc.dir }), 222);
    assert.equal(ownEmulatorPid({ pid: 7777, avd: 'kudy-ci', procDir: proc.dir }), null, 'no process in that group');
    const serial = ownSerial({
      child: { pid: 4242 }, avd: 'kudy-ci', procDir: proc.dir,
      fresh: ['emulator-5554', 'emulator-5556'],
      listenPorts: (pid) => (pid === 111 ? [5556, 5555] : [5554, 5555]),
    });
    assert.equal(serial, 'emulator-5556', 'the runner must pin its own console port, not the first fresh serial');
  } finally {
    proc.restore();
  }
});

test('ownership falls back to the first fresh serial only when the port scan is unavailable', () => {
  const proc = makeFakeProc();
  try {
    assert.equal(
      ownSerial({ child: { pid: 4242 }, avd: 'kudy-ci', procDir: proc.dir, fresh: ['emulator-5554'], listenPorts: () => null }),
      'emulator-5554',
      'ss unavailable — the documented fresh[0] fallback',
    );
    assert.equal(
      ownSerial({ child: { pid: 4242 }, avd: 'kudy-ci', procDir: proc.dir, fresh: ['emulator-5554'], listenPorts: () => [] }),
      null,
      'ss works but our guest has no console port yet — the fresh serial belongs to someone else, keep polling (voka foreign-serial-fallback-race)',
    );
    assert.equal(
      ownSerial({ child: { pid: 4242 }, avd: 'kudy-ci', procDir: proc.dir, fresh: ['emulator-5554'], listenPorts: () => [5558] }),
      null,
      'our guest owns a different port than any fresh serial — no adoption',
    );
    assert.equal(
      ownSerial({ child: { pid: 4242 }, avd: 'kudy-ci', procDir: proc.dir, fresh: ['emulator-5554'], listenPorts: () => [5555] }),
      null,
      'the adb port (odd) is not a console port — no adoption',
    );
  } finally {
    proc.restore();
  }
});

test('the --avd override skips the android-36 image preflight (voka avd-image-preflight)', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      // Strip the android-36 system image from the fake SDK: the override
      // guest does not need it, so the run must still reach the emulator.
      fs.rmSync(path.join(args[1], 'system-images'), { recursive: true, force: true });
      const io = stubIo({ listAvds: () => ['kudy-ci', 'kudy-apr05-api35'] });
      const { code } = await main([...args, '--avd', 'kudy-apr05-api35'], io);
      assert.equal(code, EXIT.passed, 'the run must reach the emulator without the android-36 image');
      assert.equal(io.calls.bootEmulator.length, 1);
    } finally {
      restore();
    }
  });
});

test('--avd selects a non-default guest; the default stays the CI AVD', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const overrideIo = stubIo({ listAvds: () => ['kudy-ci', 'kudy-apr05-api35'] });
      const override = await main([...args, '--avd', 'kudy-apr05-api35'], overrideIo);
      assert.equal(override.code, EXIT.passed);
      assert.deepEqual(overrideIo.calls.bootEmulator.map(([bootArgs]) => bootArgs.avd), ['kudy-apr05-api35']);

      const defaultIo = stubIo();
      const defaulted = await main([...args], defaultIo);
      assert.equal(defaulted.code, EXIT.passed);
      assert.deepEqual(defaultIo.calls.bootEmulator.map(([bootArgs]) => bootArgs.avd), ['kudy-ci']);
    } finally {
      restore();
    }
  });
});

test('missing KVM or the CI system image is a named NOT-VERIFIED, never a pass', async () => {  await withTempRoot(async () => {
    const noKvm = preflightArgs();
    try {
      const io = stubIo({ kvmWritable: () => false });
      const result = await main(noKvm.args, io);
      assert.equal(result.code, EXIT.notVerified);
      assert.match(result.summary, /\/dev\/kvm/);
    } finally {
      noKvm.restore();
    }

    const noAvd = preflightArgs();
    try {
      const io = stubIo({ listAvds: () => ['other-avd'] });
      const result = await main(noAvd.args, io);
      assert.equal(result.code, EXIT.notVerified);
      assert.match(result.summary, /no AVD kudy-ci/);
      assert.match(result.summary, /system-images;android-36;google_apis;x86_64/);
    } finally {
      noAvd.restore();
    }
  });
});

test('the suites run in the CI order, then the non-gating visual:check; the emulator it started is stopped', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo();
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.passed);
      assert.equal(summary, `Android E2E: passed on ${HEAD}`);
      assert.deepEqual(io.calls.runSuite.map(([runArgs]) => runArgs.suite), [...SUITES], 'smoke, walk, discovery');
      assert.equal(io.calls.runVisualCheck.length, 1, 'visual:check runs after the suites');
      assert.deepEqual(io.calls.stopEmulator.map(([stopArgs]) => stopArgs.serial), ['emulator-5554']);
      // The runner settles the fresh guest to adb state 'device' before the
      // suites (a cold adb server refused `adb reverse` right after boot).
      assert.ok(callIndex(io, 'waitForDevice') < callIndex(io, 'runSuite'),
        'the device-settle wait must precede the suites');
      // CI order: the APK is built before the emulator boots — a guest that
      // sits through a full Gradle build starves (lmkd thrashing, SystemUI
      // ANR — the first local run's failure, issue #132 debugging log).
      assert.ok(
        callIndex(io, 'buildApk') < callIndex(io, 'bootEmulator'),
        'the APK build must happen before the emulator boots (CI order)',
      );
    } finally {
      restore();
    }
  });
});

test('a failing suite stops the run with the failed summary', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo({
        runSuite: (runArgs) => (runArgs.suite === 'walk' ? { status: 1, output: 'FAIL a case\n' } : { status: 0, output: '' }),
      });
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.failed);
      assert.equal(summary, `Android E2E: failed (walk) on ${HEAD}`);
      assert.deepEqual(io.calls.runSuite.map(([runArgs]) => runArgs.suite), ['smoke', 'walk'], 'the first failure stops the list');
      assert.equal(io.calls.runVisualCheck.length, 0);
      assert.equal(io.calls.stopEmulator.length, 1);
    } finally {
      restore();
    }
  });
});

test('a SKIP e2e:android line is never a pass (criterion 2.5)', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo({
        runSuite: () => ({ status: 0, output: 'SKIP e2e:android smoke — no booted emulator found\n' }),
      });
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.notVerified);
      assert.match(summary, /NOT-VERIFIED/);
      assert.match(summary, /smoke skipped/);
      assert.equal(io.calls.runSuite.length, 1, 'a skipped suite stops the list');
    } finally {
      restore();
    }
  });
});

test('a failed build is NOT-VERIFIED, not a suite failure', async () => {
  await withTempRoot(async () => {
    const { args, restore } = preflightArgs();
    try {
      const io = stubIo({ buildApk: () => ({ status: 1 }) });
      const { code, summary } = await main(args, io);
      assert.equal(code, EXIT.notVerified);
      assert.match(summary, /APK build failed/);
      assert.equal(io.calls.runSuite.length, 0);
    } finally {
      restore();
    }
  });
});

test('JDK 17 is the build JDK: 17 passes, 21 does not, and the finder scans the roots', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-jdk-'));
  try {
    const jdk17 = path.join(dir, 'jdk-17.0.21+9');
    const jdk21 = path.join(dir, 'java-21-openjdk');
    fs.mkdirSync(jdk17, { recursive: true });
    fs.mkdirSync(jdk21, { recursive: true });
    fs.writeFileSync(path.join(jdk17, 'release'), 'JAVA_VERSION="17.0.21"\n');
    fs.writeFileSync(path.join(jdk21, 'release'), 'JAVA_VERSION="21.0.5"\n');
    assert.equal(isJdk17(jdk17), true);
    assert.equal(isJdk17(jdk21), false, 'the system JDK 21 must not build the APK');
    assert.equal(readJdkRelease(path.join(dir, 'missing')), null);
    assert.equal(findJdk17([dir]), jdk17);
    assert.equal(findJdk17([path.join(dir, 'no-such-dir')]), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('acquireHostLock reuses the checkout-lock idiom for the host-wide file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-host-lock-'));
  const lockFile = path.join(dir, 'e2e-android-local.lock');
  try {
    const lock = acquireHostLock(lockFile, 'e2e:android:local');
    assert.equal(lock.holder, undefined, 'an empty host takes the lock');
    const second = acquireHostLock(lockFile, 'e2e:android:local', { alive: () => true });
    assert.notEqual(second.holder, undefined, 'a second run is refused while the holder lives');
    lock.release();
    assert.equal(fs.existsSync(lockFile), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unknown flags exit with the usage code', async () => {
  const io = stubIo();
  const { code, summary } = await main(['--unknown-flag'], io);
  assert.equal(code, EXIT.usage);
  assert.equal(summary, null);
  assert.equal(io.calls.git.length, 0);
});

test('the e2e:android:local script points at the runner (runner wiring is guarded)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['e2e:android:local'], 'node tools/e2e-android/run-local.mjs');
  assert.match(pkg.scripts.test, /"tools\/e2e-android\/\*\.test\.mjs"/, 'this suite must stay wired into npm test');
});
