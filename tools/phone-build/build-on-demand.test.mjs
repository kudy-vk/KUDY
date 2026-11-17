// PHONE-02/#323 (epic #95): the desktop one-click launcher is the on-demand
// build path the owner approved (auto-build-on-push was declined). Reverting
// any of these invariants turns a test here red: a wrong profile would ship
// the store identity, a hardcoded token would leak a secret, and losing the
// poller would leave the owner staring at nothing instead of a notification.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const script = fs.readFileSync(path.join(dir, 'build-on-demand.sh'), 'utf8');

test('the launcher builds the sandbox APK on demand, never another profile', () => {
  assert.match(script, /--profile sandbox/, 'must build the sandbox profile');
  assert.match(script, /--platform android/, 'phone-test builds are Android-only');
  assert.match(script, /--no-wait/, 'the desktop must not hang on the cloud queue');
});

test('no tokens or secrets are used — the host eas-cli session authenticates', () => {
  assert.doesNotMatch(script, /\$\{?EXPO_TOKEN\}?|eas login --token|sk_[A-Za-z0-9]|sessionSecret/, 'the launcher must authenticate through the host eas-cli session only');
  assert.ok(!process.env.EXPO_TOKEN, 'EXPO_TOKEN must not be set in the test environment either');
});

test('the launcher reports on the desktop and polls to the final status', () => {
  assert.match(script, /notify-send/, 'desktop notifications are the whole point of the button');
  assert.match(script, /poll/, 'the detached poller must notify on FINISHED and on ERRORED');
  assert.match(script, /FINISHED/, 'ready state is notified');
  assert.match(script, /ERRORED\|CANCELED/, 'failure state is notified, never silent');
  assert.match(script, /eas build:view/, 'polling uses the real build status, not guesses');
});

test('logs stay in the repo scratch dir, not in /tmp', () => {
  assert.match(script, /\.scratch\/phone-build/, 'suite logs must not go to /tmp (repo convention)');
});

test('the guard suite is wired into npm test (rule 7)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, '..', '..', 'package.json'), 'utf8'));
  assert.ok(
    pkg.scripts.test.includes('tools/phone-build/*.test.mjs'),
    'removing the glob from npm test must turn a committed check red',
  );
});

test('the detached poller survives a failed eas call and reports unknown status', () => {
  assert.match(script, /\|\| echo '\{\}'/, 'a dead eas build:view must yield an unknown status, not kill the poller (set -e)');
  assert.match(script, /"\$unknown" -ge 10/, 'repeated unknown statuses must notify a distinct diagnostic (rule 14), not a fake long queue');
  assert.match(script, /nohup "\$SELF" poll/, 'the poller must be spawned via the absolute script path resolved before cd');
  assert.match(script, /SELF="\$\(cd "\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)"/, 'self path is resolved before the script cd away');
});
