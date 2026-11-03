// QA-DIST-01 fixtures are synthetic, not signed Android APKs or device proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { createHash, generateKeyPairSync, sign as signMessage } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defaultRun, validateApk, parseBadging, parseSigning, provenanceBytes, PROVENANCE_SCHEMA } from './qa-apk-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SHA = '1'.repeat(40);
const PACKAGE = 'by.kudy.app.sandbox';
const CERT = 'a'.repeat(64);
const badge = "package: name='by.kudy.app.sandbox' versionCode='42' versionName='1.2.3'\nsdkVersion:'24'\n";
const signing = "Verifies\nVerified using v1 scheme (JAR signing): false\nVerified using v2 scheme (APK Signature Scheme v2): true\nNumber of signers: 1\nSigner #1 certificate SHA-256 digest: " + CERT + "\n";
const FILES = [
  ['AndroidManifest.xml', 'manifest'],
  ['classes.dex', 'dex-data'],
  ['assets/index.android.bundle', 'compiled-js'],
];

// Synthetic ZIP structural fixture only; SDK tool output is mocked.
function fixtureCrc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let i = 0; i < 8; i++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

function fakeZip(entries, { deflateBundle = false } = {}) {
  const chunks = [];
  const directory = [];
  let offset = 0;
  for (const [filename, body] of entries) {
    const name = Buffer.from(filename);
    const data = Buffer.from(body);
    const method = deflateBundle && filename === 'assets/index.android.bundle' ? 8 : 0;
    const stored = method === 8 ? deflateRawSync(data) : data;
    const checksum = fixtureCrc(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, stored);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(stored.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += 30 + name.length + stored.length;
  }
  const centralLength = directory.reduce((sum, x) => sum + x.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralLength, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...directory, end]);
}

function fixture(t, entries = FILES, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-qa-apk-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const apk = path.join(dir, 'fixture.apk');
  fs.writeFileSync(apk, fakeZip(entries, options));
  const keys = generateKeyPairSync('ed25519');
  const keyFile = path.join(dir, 'trusted.pem');
  const provenance = path.join(dir, 'provenance.json');
  fs.writeFileSync(keyFile, keys.publicKey.export({ format: 'pem', type: 'spki' }));
  const expectedSourceSha = SHA;
  const base = { apk, expectedSourceSha, expectedPackageId: PACKAGE, trustedPublicKey: keyFile, provenance };
  function issue(runOverride, opts = {}) {
    const run = runOverride ?? ((tool) => tool === 'aapt2' ? { ok: true, stdout: badge } : { ok: true, stdout: signing });
    return validateApk({ ...base, ...opts }, { run });
  }
  const apkSha256 = createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
  const payload = { schema: PROVENANCE_SCHEMA, sourceSha: SHA, apkSha256, packageId: PACKAGE, versionCode: 42, versionName: '1.2.3' };
  function writeSigned(data = payload, privateKey = keys.privateKey) {
    const signature = signMessage(null, provenanceBytes(data), privateKey).toString('base64');
    fs.writeFileSync(provenance, JSON.stringify({ schema: PROVENANCE_SCHEMA, payload: data, signature }));
  }
  writeSigned();
  return { ...base, issue, dir, payload, keys, provenance, writeSigned };
}

test('synthetic fixture: all required identity gates PASS only with trusted signed provenance', (t) => {
  const f = fixture(t);
  const result = f.issue();
  assert.equal(result.synthetic, true);
  assert.equal(result.status, 'PASS');
  assert.equal(result.source.verified, SHA);
  assert.equal(result.signingCertificateSha256, CERT);
  assert.equal(result.versionCode, 42);
  assert.equal(result.checks.standaloneAssets.status, 'PASS');
  assert.match(result.apkSha256, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(result).includes(f.dir), 'no private filesystem paths in JSON');
});

test('without attestation or trusted key, provenance stays NOT-VERIFIED, never PASS', (t) => {
  const f = fixture(t);
  for (const opts of [{ provenance: undefined }, { trustedPublicKey: undefined }]) {
    const r = f.issue(undefined, opts);
    assert.equal(r.status, 'NOT-VERIFIED');
    assert.deepEqual(r.reasonCodes, ['PROVENANCE_MISSING']);
  }
});

test('signed mismatched APK SHA and source SHA cannot claim verified provenance', (t) => {
  const f = fixture(t);
  for (const change of [
    { apkSha256: '9'.repeat(64) },
    { sourceSha: '2'.repeat(40) },
    { packageId: 'by.kudy.other' },
    { versionCode: 43 },
    { versionName: '2.0' },
  ]) {
    f.writeSigned({ ...f.payload, ...change });
    const r = f.issue();
    assert.equal(r.status, 'FAILED');
    assert.equal(r.checks.provenance.reason, 'PROVENANCE_MISMATCH');
    assert.equal(r.source.verified, null);
  }
});

test('forged or malformed attestation and mismatched trusted public key fail', (t) => {
  const f = fixture(t);
  const doc = JSON.parse(fs.readFileSync(f.provenance));
  doc.signature = Buffer.alloc(64).toString('base64');
  fs.writeFileSync(f.provenance, JSON.stringify(doc));
  assert.equal(f.issue().checks.provenance.reason, 'PROVENANCE_SIGNATURE_INVALID');
  f.writeSigned();
  const otherKey = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(f.trustedPublicKey, otherKey);
  assert.equal(f.issue().checks.provenance.reason, 'PROVENANCE_SIGNATURE_INVALID');
  fs.writeFileSync(f.provenance, '{"payload": null}');
  assert.equal(f.issue().checks.provenance.reason, 'PROVENANCE_INVALID');
});

test('production/dev package identifiers are rejected, even when expected', (t) => {
  const f = fixture(t);
  for (const pkg of ['by.kudy.app', 'by.kudy.app.dev']) {
    assert.equal(f.issue(undefined, { expectedPackageId: pkg }).reasonCodes[0], 'INPUT_INVALID');
    assert.equal(f.issue((tool) => ({ ok: true, stdout: tool === 'aapt2'
      ? badge.replace(PACKAGE, pkg) : signing })).checks.manifest.reason, 'PACKAGE_MISMATCH');
  }
  assert.equal(f.issue(undefined, { expectedPackageId: 'by.kudy.unrelated' }).checks.manifest.reason, 'PACKAGE_MISMATCH');
});

test('missing/non-APK and ZIP directory corruption fail before SDK tools', (t) => {
  const f = fixture(t);
  assert.equal(f.issue(undefined, { apk: path.join(f.dir, 'missing.apk') }).checks.artifact.reason, 'APK_UNREADABLE');
  fs.writeFileSync(f.apk, 'not an apk');
  assert.equal(f.issue().checks.artifact.reason, 'APK_ARCHIVE_INVALID');
  fs.writeFileSync(f.apk, fakeZip([FILES[0], FILES[0], ...FILES.slice(1)]));
  assert.equal(f.issue().checks.artifact.reason, 'APK_ARCHIVE_INVALID');
});

test('central-directory phantom cannot substitute for a valid local JS entry', (t) => {
  const f = fixture(t);
  const altered = fs.readFileSync(f.apk);
  const index = altered.indexOf(Buffer.from('assets/index.android.bundle'));
  assert.ok(index > 0);
  altered[index] ^= 1; // Change only the local filename, not the central-directory record.
  fs.writeFileSync(f.apk, altered);
  const result = f.issue();
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.standaloneAssets.reason, 'STANDALONE_ASSETS_MISSING');
});

test('corrupted JS entry bytes or CRC are not accepted as standalone assets', (t) => {
  const f = fixture(t);
  const altered = fs.readFileSync(f.apk);
  const index = altered.indexOf(Buffer.from('compiled-js'));
  assert.ok(index > 0);
  altered[index] ^= 1;
  fs.writeFileSync(f.apk, altered);
  assert.equal(f.issue().checks.standaloneAssets.reason, 'STANDALONE_ASSETS_MISSING');

  const other = fixture(t);
  const central = fs.readFileSync(other.apk);
  const localName = Buffer.from('assets/index.android.bundle');
  const first = central.indexOf(localName);
  const second = central.indexOf(localName, first + localName.length);
  assert.ok(second > first);
  central.writeUInt32LE(0x12345678, second - 46 + 16); // corrupt central CRC only
  fs.writeFileSync(other.apk, central);
  assert.equal(other.issue().checks.standaloneAssets.reason, 'STANDALONE_ASSETS_MISSING');
});

test('compressed JS bundle can be fully extracted and CRC checked', (t) => {
  const f = fixture(t, FILES, { deflateBundle: true });
  const result = f.issue();
  assert.equal(result.status, 'PASS');
  assert.equal(result.checks.standaloneAssets.status, 'PASS');
});

test('CLI subprocess exits 0 for synthetic verified fixture, 1 on fail, 2 when provenance is not verified', (t) => {
  const f = fixture(t);
  // Preload controlled SDK outputs into the separate CLI process; not real Android tools.
  // syncBuiltinESMExports makes node:child_process ESM import use the test stub.
  const preload = path.join(f.dir, 'synthetic-sdk.cjs');
  fs.writeFileSync(preload, [
    "const cp = require('node:child_process');",
    "const actual = cp.spawnSync;",
    "cp.spawnSync = (tool, args, options) => {",
    "  if (tool === 'aapt2') return { status: 0, stdout: " + JSON.stringify(badge) + " };",
    "  if (tool === 'apksigner') return { status: 0, stdout: " + JSON.stringify(signing) + " };",
    "  return actual(tool, args, options);",
    "};",
    "require('node:module').syncBuiltinESMExports();",
  ].join('\n'));
  const cli = path.join(here, 'qa-apk-verify-cli.mjs');
  const baseArgs = ['--apk', f.apk, '--source-sha', SHA];
  function cliRun(extra) {
    const proc = spawnSync(process.execPath, ['--require', preload, cli, ...baseArgs, ...extra],
      { encoding: 'utf8', timeout: 15000 });
    assert.equal(proc.error, undefined);
    assert.equal(proc.stderr, '');
    const output = JSON.parse(proc.stdout);
    assert.equal(proc.stdout.includes(f.dir), false, 'CLI must not disclose local paths');
    return { exit: proc.status, output };
  }
  const passed = cliRun(['--provenance', f.provenance, '--trusted-public-key', f.trustedPublicKey]);
  assert.equal(passed.exit, 0);
  assert.equal(passed.output.status, 'PASS');
  const failed = cliRun(['--package', 'by.kudy.app.dev']);
  assert.equal(failed.exit, 1);
  assert.equal(failed.output.status, 'FAILED');
  const unknown = cliRun([]);
  assert.equal(unknown.exit, 2);
  assert.equal(unknown.output.status, 'NOT-VERIFIED');
  assert.equal(unknown.output.checks.provenance.reason, 'PROVENANCE_MISSING');
});

test('missing JS bundle, manifest, dex or zero byte JS is rejected', (t) => {
  for (const entries of [FILES.filter((x) => x[0] !== 'assets/index.android.bundle'),
    FILES.filter((x) => x[0] !== 'AndroidManifest.xml'),
    FILES.filter((x) => x[0] !== 'classes.dex'),
    FILES.map(([name, data]) => [name, name === 'assets/index.android.bundle' ? '' : data])]) {
    const f = fixture(t, entries);
    assert.equal(f.issue().checks.standaloneAssets.reason, 'STANDALONE_ASSETS_MISSING');
  }
});

test('aapt2 missing/failing and malformed/ambiguous manifest are FAILED', (t) => {
  const f = fixture(t);
  assert.equal(f.issue(() => ({ ok: false })).checks.manifest.reason, 'AAPT2_FAILED');
  for (const bad of ['', "package: name='x' versionCode='0' versionName='1'\n",
    badge + badge, badge.replace("versionCode='42'", "versionCode='NaN'"),
    badge.replace("versionCode='42'", "versionCode='2147483648'")]) {
    assert.equal(f.issue((tool) => ({ ok: true, stdout: tool === 'aapt2' ? bad : signing })).checks.manifest.reason, 'MANIFEST_OUTPUT_INVALID');
  }
});

test('apksigner missing/failing and malformed/ambiguous certificate are FAILED', (t) => {
  const f = fixture(t);
  assert.equal(f.issue((tool) => tool === 'apksigner' ? { ok: false } : { ok: true, stdout: badge }).checks.signature.reason, 'SIGNATURE_FAILED');
  for (const bad of ['', signing.replace('v2 scheme (APK Signature Scheme v2): true', 'v2 scheme (APK Signature Scheme v2): false'),
    signing + 'Signer #1 certificate SHA-256 digest: ' + 'b'.repeat(64) + '\n',
    signing + 'Signer #2 certificate SHA-256 digest: ' + 'b'.repeat(64) + '\n',
    signing.replace('Number of signers: 1', 'Number of signers: 2'),
    signing + 'Verified using v2 scheme (APK Signature Scheme v2): true\\n']) {
    assert.equal(f.issue((tool) => ({ ok: true, stdout: tool === 'aapt2' ? badge : bad })).checks.signature.reason, 'SIGNATURE_OUTPUT_INVALID');
  }
});

test('release metadata must match the inspected artifact and attested SHA', (t) => {
  const f = fixture(t);
  const metadata = path.join(f.dir, 'metadata.json');
  const actual = { apkSha256: f.payload.apkSha256, sourceSha: SHA, packageId: PACKAGE, versionCode: 42, versionName: '1.2.3' };
  fs.writeFileSync(metadata, JSON.stringify(actual));
  assert.equal(f.issue(undefined, { metadata }).status, 'PASS');
  for (const changed of [{ versionCode: 99 }, { apkSha256: '9'.repeat(64) }, { sourceSha: '2'.repeat(40) }]) {
    fs.writeFileSync(metadata, JSON.stringify({ ...actual, ...changed }));
    assert.equal(f.issue(undefined, { metadata }).checks.metadata.reason, 'METADATA_MISMATCH');
  }
  fs.writeFileSync(metadata, '{"versionCode":{},"sourceSha":null}');
  assert.equal(f.issue(undefined, { metadata }).checks.metadata.reason, 'METADATA_INVALID');
});

test('APK changed during SDK inspection cannot be marked verified', (t) => {
  const f = fixture(t);
  const result = f.issue((tool) => {
    if (tool === 'aapt2') {
      fs.writeFileSync(f.apk, fakeZip([...FILES, ['assets/extra.bin', 'changed']]));
      return { ok: true, stdout: badge };
    }
    return { ok: true, stdout: signing };
  });
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.artifactStability.reason, 'APK_CHANGED_DURING_VERIFICATION');
});

test('real SDK launcher rejects a nonexistent executable without shell execution', () => {
  assert.equal(defaultRun('definitely-not-a-real-android-sdk-command-982', ['--version']).ok, false);
});

test('input validation never echoes an invalid expected source value', (t) => {
  const f = fixture(t);
  const r = f.issue(undefined, { expectedSourceSha: '/private/token=do-not-print' });
  assert.equal(r.status, 'FAILED');
  assert.equal(r.source.expected, null);
  assert.equal(JSON.stringify(r).includes('do-not-print'), false);
});

test('parsers return diagnostics for corrupt/wrong-type SDK outputs', () => {
  for (const input of [undefined, null, {}, 42, [], "package: name='x'"]) {
    assert.equal(parseBadging(input), null);
    assert.equal(parseSigning(input), null);
  }
});

test('CLI fails closed with redacted JSON and exit code 64 on invalid usage', () => {
  const cli = path.join(here, 'qa-apk-verify-cli.mjs');
  const run = spawnSync(process.execPath, [cli, '--apk', '/sensitive/input.apk'], { encoding: 'utf8' });
  assert.equal(run.status, 64);
  assert.equal(JSON.parse(run.stdout).status, 'FAILED');
  assert.equal(run.stdout.includes('/sensitive'), false);
});

test('mutation proof: dropping provenance evidence cannot produce PASS', (t) => {
  const f = fixture(t);
  const baseline = f.issue();
  assert.equal(baseline.status, 'PASS');
  const changed = f.issue(undefined, { provenance: undefined });
  assert.notEqual(changed.status, 'PASS');
  assert.equal(changed.checks.provenance.reason, 'PROVENANCE_MISSING');
});
