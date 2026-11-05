// #124 — unit tests for the local Android E2E runner policy. Each rule the
// issue pins (scope short-cut, D:-only layout, lock policy, NOT-VERIFIED
// exits, npm-script wiring) has a test that fails when the rule is reverted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { acquireLock } from '../android-build/checkout-lock.mjs';
import {
  EXIT, buildLayout, driveOf, findJdk17, lockVerdict, markerAllowsSkip, notVerifiedLine, notVerifiedReasons,
  probePort, resolveLayout, scopeOutcome, summaryLine,
} from './android-e2e-local.mjs';

const tmpRoots = [];
const makeTmpRoot = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-e2e-local-'));
  tmpRoots.push(dir);
  return dir;
};
after(() => {
  for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true });
});

describe('android-e2e-local scope short-cut', () => {
  it('exits ok when the scope script printed run=false (revert: parse inverted → run stays true)', () => {
    assert.equal(scopeOutcome('android-e2e scope: run=false (5 changed file(s))\n').run, false);
  });

  it('keeps the full run on run=true and on unreadable output (fail-open like CI)', () => {
    assert.equal(scopeOutcome('android-e2e scope: run=true (2 changed file(s))\n').run, true);
    const empty = scopeOutcome('');
    assert.equal(empty.run, true);
    assert.equal(empty.parsed, false);
  });
});

describe('android-e2e-local D:-only layout', () => {
  it('rejects a root outside drive D: (revert: drop the drive check → no error)', () => {
    const rejected = resolveLayout('C:\\KUDY-Android');
    assert.ok(rejected.errors.some((error) => error.includes('must be an absolute path on drive D:')), rejected.errors?.join('; '));
  });

  it('rejects a relative root', () => {
    const rejected = resolveLayout('KUDY-Android');
    assert.ok(rejected.errors.length > 0, 'relative root must be rejected');
  });

  it('resolves every member under the D: root with a jdk-17 directory', () => {
    const root = 'D:\\KUDY-Android';
    const { layout, errors } = resolveLayout(root);
    assert.equal(errors, undefined);
    // Joined with path.join so the assertion holds on POSIX test hosts too.
    assert.equal(layout.sdk, path.join(root, 'sdk'));
    assert.equal(layout.checkout, path.join(root, 'checkout'));
    assert.equal(layout.lockFile, path.join(root, 'runner.lock'));
    assert.equal(driveOf(layout.buildRoot), 'D:\\');
  });
});

describe('android-e2e-local JDK discovery', () => {
  it('finds the jdk-17* directory and returns null without one (revert: any name accepted)', () => {
    const root = makeTmpRoot();
    const javaDir = path.join(root, 'java');
    fs.mkdirSync(path.join(javaDir, 'jdk-25.0.2'), { recursive: true });
    assert.equal(findJdk17(javaDir), null, 'a jdk-25 directory must not satisfy the JDK 17 rule');
    fs.mkdirSync(path.join(javaDir, 'jdk-17.0.20.1+1'));
    assert.equal(findJdk17(javaDir), path.join(javaDir, 'jdk-17.0.20.1+1'));
  });
});

describe('android-e2e-local NOT-VERIFIED reasons', () => {
  const buildFullLayout = (root) => {
    const write = (file) => fs.writeFileSync(file, '');
    for (const dir of [
      ['sdk', 'platform-tools'], ['sdk', 'cmdline-tools', 'latest', 'bin'], ['sdk', 'build-tools', '36.0.0'],
      ['sdk', 'emulator'], ['sdk', 'platforms', 'android-36'],
      ['sdk', 'system-images', 'android-36', 'google_apis', 'x86_64'],
      ['java', 'jdk-17.0.20.1+1', 'bin'], ['avd'], ['build'], ['checkout', '.git'],
    ]) {
      const dirPath = path.join(root, ...dir);
      fs.mkdirSync(dirPath, { recursive: true });
      if (dir.at(-1) === 'platform-tools') {
        // Both launcher names: the host checks adb.exe, CI checks adb.
        write(path.join(dirPath, 'adb.exe'));
        write(path.join(dirPath, 'adb'));
      }
      if (dir.at(-1) === 'bin') {
        write(path.join(dirPath, 'sdkmanager.bat'));
        write(path.join(dirPath, 'sdkmanager'));
        if (dir.at(-2) === 'jdk-17.0.20.1+1') {
          write(path.join(dirPath, 'java.exe'));
          write(path.join(dirPath, 'java'));
        }
      }
      if (dir.at(-1) === 'emulator') {
        write(path.join(dirPath, 'emulator.exe'));
        write(path.join(dirPath, 'emulator'));
      }
    }
    write(path.join(root, 'avd', 'kudy-ci.ini'));
    return buildLayout(root);
  };

  it('names every missing package in one pass (revert: drop a check → its reason vanishes)', () => {
    const root = makeTmpRoot();
    const layout = buildLayout(root);
    const reasons = notVerifiedReasons(layout);
    for (const fragment of ['platform-tools/adb', 'cmdline-tools;latest', 'build-tools;36.0.0', 'SDK emulator',
      'platforms;android-36', 'system-images;android-36;google_apis;x86_64', 'JDK 17', 'AVD kudy-ci',
      'build checkout', 'missing build root']) {
      assert.ok(reasons.some((reason) => reason.includes(fragment)), `no reason for ${fragment}: ${reasons.join('; ')}`);
    }
  });

  it('returns no reasons for a complete layout, without inventing checks (revert: extra check → false reason)', () => {
    const reasons = notVerifiedReasons(buildFullLayout(makeTmpRoot()));
    assert.deepEqual(reasons, []);
  });

  it('formats the NOT-VERIFIED line with the reason in parentheses', () => {
    assert.equal(notVerifiedLine('missing SDK platform-tools/adb'), 'Android E2E: NOT-VERIFIED (missing SDK platform-tools/adb)');
  });
});

describe('android-e2e-local lock policy', () => {
  it('maps a fresh lock to acquired, a live holder to wait, a dead one to stale (revert: stale taken over)', () => {
    assert.deepEqual(lockVerdict({ release: () => {} }), { action: 'acquired' });
    assert.deepEqual(lockVerdict({ holder: { pid: 42 }, stale: false }), { action: 'wait', holder: { pid: 42 } });
    assert.equal(lockVerdict({ holder: { pid: 42 }, stale: true }).action, 'stale');
  });

  it('refuses an unreadable lock instead of waiting forever (revert: unreadable → wait loop)', () => {
    const verdict = lockVerdict({ holder: { unreadable: 'D:\\KUDY-Android\\runner.lock' }, stale: false });
    assert.equal(verdict.action, 'stale', 'a holder without a pid can never be re-checked as dead');
    assert.equal(lockVerdict({ holder: { pid: 'not-a-number' }, stale: false }).action, 'stale');
  });

  it('real lock: the second caller sees a holder and never rewrites the file', () => {
    const root = makeTmpRoot();
    const file = path.join(root, 'runner.lock');
    const first = acquireLock(file, 'e2e:android:local');
    assert.ok(first.release, 'first acquire must own the lock');
    const second = acquireLock(file, 'e2e:android:local');
    assert.ok(second.holder, 'second acquire must see the holder');
    assert.equal(second.holder.pid, process.pid);
    const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(onDisk.command, 'e2e:android:local');
    first.release();
    assert.equal(acquireLock(file, 'e2e:android:local').release !== undefined, true, 'lock is reusable after release');
  });
});

describe('android-e2e-local npm ci short-cut marker', () => {
  it('skips only with a matching hash on a ready install (revert: corrupt marker skips npm ci)', () => {
    assert.equal(markerAllowsSkip({ lockHash: 'abc' }, 'abc', true), true);
    assert.equal(markerAllowsSkip({ lockHash: 'abc' }, 'abd', true), false, 'hash mismatch must reinstall');
    assert.equal(markerAllowsSkip(null, 'abc', true), false, 'absent marker must reinstall');
    assert.equal(markerAllowsSkip({}, 'abc', true), false, 'marker without a hash must reinstall');
    assert.equal(markerAllowsSkip({ lockHash: 'abc' }, 'abc', false), false, 'no node_modules must reinstall');
  });
});

describe('android-e2e-local port probe', () => {
  it('reports an occupied port and a free port (revert: probe inverted → runner kills nothing but fails silently)', async () => {
    const listener = net.createServer();
    await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
    const port = listener.address().port;
    try {
      assert.equal(await probePort(port), true, 'a listening port must be reported occupied');
    } finally {
      await new Promise((resolve) => listener.close(resolve));
    }
    assert.equal(await probePort(port), false, 'a closed port must be reported free');
  });
});

describe('android-e2e-local summary contract', () => {
  it('prints the two summary lines the issue pins', () => {
    const sha = 'a'.repeat(40);
    assert.equal(summaryLine({ ok: true, sha }), `Android E2E: passed on ${sha}`);
    assert.equal(summaryLine({ ok: false, suite: 'walk', sha }), `Android E2E: failed (walk) on ${sha}`);
  });

  it('exit codes stay distinct for lock and NOT-VERIFIED', () => {
    assert.notEqual(EXIT.notVerified, EXIT.ok);
    assert.notEqual(EXIT.lockStale, EXIT.ok);
    assert.notEqual(EXIT.notVerified, EXIT.fail);
  });
});

describe('android-e2e-local runner wiring', () => {
  it('npm run e2e:android:local resolves to the runner script (revert: script removed → test fails)', () => {
    const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.scripts['e2e:android:local'], 'node tools/ci/android-e2e-local.mjs');
  });

  it('the runner script exists next to this test', () => {
    assert.ok(fs.existsSync(new URL('./android-e2e-local.mjs', import.meta.url)));
  });
});

// Issue #132 consolidation: on non-Windows hosts the entry delegates to the
// #132 Linux runner (tools/e2e-android/run-local.mjs) with argv passthrough
// and exit-code propagation. Reverting the delegation branch turns this red.
describe('android-e2e-local platform dispatch', () => {
  it('delegates the Linux path to the #132 runner and propagates its usage exit', async () => {
    if (process.platform === 'win32') return; // the Windows path runs in-place on win32
    const { spawnSync } = await import('node:child_process');
    const { fileURLToPath } = await import('node:url');
    const entry = fileURLToPath(new URL('./android-e2e-local.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [entry, '--no-such-flag'], { encoding: 'utf8', timeout: 60_000 });
    assert.equal(result.status, 2, 'the Linux runner usage exit must propagate through the entry');
    assert.match(result.stdout + result.stderr, /e2e:android:local .*--avd <name>/, 'the usage line must be the #132 runner\'s');
  });
});
