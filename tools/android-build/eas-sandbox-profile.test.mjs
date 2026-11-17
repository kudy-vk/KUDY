// PHONE-01 (#322, epic #95): the sandbox profile is the only phone-test
// distribution path — standalone APK, Expo-managed keystore, self-incrementing
// versionCode, sandbox identity through profile env. Reverting any of these
// fields turns a test here red: a silent AAB or a stuck versionCode makes the
// QR install fail (or install a down-level build Android refuses to update),
// and a `package` field back in eas.json is invalid under the eas-cli 27
// schema (identity lives in app.config.js, resolved by EXPO_PUBLIC_SANDBOX).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const eas = JSON.parse(fs.readFileSync(path.join(repoRoot, 'eas.json'), 'utf8'));

test('sandbox profile produces an installable standalone APK', () => {
  const sandbox = eas.build.sandbox;
  assert.equal(sandbox.distribution, 'internal', 'sandbox must be internal distribution (shareable QR page)');
  assert.equal(sandbox.android.buildType, 'apk', 'internal distribution needs an .apk artifact, not an .aab');
  assert.equal(sandbox.android.autoIncrement, true, 'repeated installs need a monotonically growing versionCode');
  assert.equal(sandbox.env.EXPO_PUBLIC_SANDBOX, '1', 'profile env must select the sandbox app variant');
});

test('sandbox version source is remote, so CI never edits repo files to bump versions', () => {
  assert.equal(eas.cli.appVersionSource, 'remote', 'autoIncrement with a remote version source keeps CI branches clean');
});

test('eas.json carries no per-profile package/bundleIdentifier (invalid under the eas-cli 27 schema)', () => {
  const body = JSON.stringify(eas);
  assert.ok(!body.includes('"package"'), 'package identity moved to app.config.js — eas build rejects "package" in eas.json');
  assert.ok(!body.includes('"bundleIdentifier"'), 'bundle identity moved to app.config.js — eas build rejects "bundleIdentifier" in eas.json');
});

test('the other profiles keep their untouched semantics', () => {
  assert.equal(eas.build.development.developmentClient, true, 'development profile stays a dev-client build');
  assert.equal(eas.build.production.android?.buildType, undefined, 'production must keep the store default (.aab), never inherit the sandbox APK override');
  assert.equal(eas.build.production.android?.autoIncrement, undefined);
  assert.deepEqual(eas.build.production, {}, 'production profile stays empty (store-bound)');
});
