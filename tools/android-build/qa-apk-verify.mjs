// QA-DIST-01: offline inspection; never publish or run an APK.
import fs from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const PROVENANCE_SCHEMA = 'kudy.qa.apk.provenance.v1';
const MAX_APK_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_CENTRAL_BYTES = 16 * 1024 * 1024;
const SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const HEX64 = /^[a-f0-9]{64}$/i;
const PACKAGE_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+\-]{0,100}$/;
const cleanHex = (s) => s.toLowerCase();

const MAX_REQUIRED_ENTRY_BYTES = 128 * 1024 * 1024;
const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
  let crc = byte;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  return crc >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function readZipEntries(apk) {
  const fd = fs.openSync(apk, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    if (size < 22 || size > MAX_APK_BYTES) throw Error('APK_ARCHIVE_INVALID');
    const header = Buffer.alloc(4);
    if (fs.readSync(fd, header, 0, 4, 0) !== 4 || header.readUInt32LE() !== 0x04034b50) {
      throw Error('APK_ARCHIVE_INVALID');
    }
    const tailSize = Math.min(size, 65535 + 22);
    const tail = Buffer.alloc(tailSize);
    fs.readSync(fd, tail, 0, tailSize, size - tailSize);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50 && i + 22 + tail.readUInt16LE(i + 20) === tail.length) {
        eocd = i; break;
      }
    }
    if (eocd < 0 || tail.readUInt16LE(eocd + 4) !== 0 || tail.readUInt16LE(eocd + 6) !== 0) {
      throw Error('APK_ARCHIVE_INVALID');
    }
    const count = tail.readUInt16LE(eocd + 10);
    const length = tail.readUInt32LE(eocd + 12);
    const offset = tail.readUInt32LE(eocd + 16);
    if (!count || count === 0xffff || length === 0xffffffff || offset === 0xffffffff
      || length > MAX_CENTRAL_BYTES || offset + length > size - tailSize + eocd) {
      throw Error('APK_ARCHIVE_INVALID');
    }
    const central = Buffer.alloc(length);
    if (fs.readSync(fd, central, 0, length, offset) !== length) throw Error('APK_ARCHIVE_INVALID');
    const entries = new Map();
    let pos = 0;
    for (let i = 0; i < count; i++) {
      if (pos + 46 > central.length || central.readUInt32LE(pos) !== 0x02014b50) throw Error('APK_ARCHIVE_INVALID');
      const flags = central.readUInt16LE(pos + 8);
      const nameLen = central.readUInt16LE(pos + 28);
      const extraLen = central.readUInt16LE(pos + 30);
      const commentLen = central.readUInt16LE(pos + 32);
      const end = pos + 46 + nameLen + extraLen + commentLen;
      if (end > central.length || flags & 1) throw Error('APK_ARCHIVE_INVALID');
      const nameBytes = central.subarray(pos + 46, pos + 46 + nameLen);
      const name = nameBytes.toString('utf8');
      if (!name || name.includes('\\') || name.startsWith('/') || name.split('/').includes('..') || entries.has(name)) {
        throw Error('APK_ARCHIVE_INVALID');
      }
      entries.set(name, {
        nameBytes, flags, method: central.readUInt16LE(pos + 10), crc: central.readUInt32LE(pos + 16),
        compressedSize: central.readUInt32LE(pos + 20), uncompressedSize: central.readUInt32LE(pos + 24),
        localOffset: central.readUInt32LE(pos + 42), centralOffset: offset,
      });
      pos = end;
    }
    if (pos !== central.length) throw Error('APK_ARCHIVE_INVALID');
    return entries;
  } finally {
    fs.closeSync(fd);
  }
}

// A central-directory name is not evidence that the corresponding bytes exist.
// Check the matching local header, bounded extraction, uncompressed length and CRC.
function extractRequiredEntry(apk, entry) {
  if (!entry || ![0, 8].includes(entry.method) || entry.flags & ~(0x0006 | 0x0008 | 0x0800)
    || entry.compressedSize === 0 || entry.uncompressedSize === 0
    || entry.uncompressedSize > MAX_REQUIRED_ENTRY_BYTES
    || entry.compressedSize > MAX_REQUIRED_ENTRY_BYTES
    || entry.localOffset >= entry.centralOffset) return false;
  let fd;
  try {
    fd = fs.openSync(apk, 'r');
    const header = Buffer.alloc(30);
    if (fs.readSync(fd, header, 0, 30, entry.localOffset) !== 30
      || header.readUInt32LE(0) !== 0x04034b50
      || header.readUInt16LE(6) !== entry.flags
      || header.readUInt16LE(8) !== entry.method) return false;
    const nameLength = header.readUInt16LE(26);
    const extraLength = header.readUInt16LE(28);
    const dataOffset = entry.localOffset + 30 + nameLength + extraLength;
    if (nameLength !== entry.nameBytes.length
      || dataOffset + entry.compressedSize > entry.centralOffset) return false;
    const localName = Buffer.alloc(nameLength);
    if (fs.readSync(fd, localName, 0, nameLength, entry.localOffset + 30) !== nameLength
      || !localName.equals(entry.nameBytes)) return false;
    if (!(entry.flags & 0x0008) && (header.readUInt32LE(14) !== entry.crc
      || header.readUInt32LE(18) !== entry.compressedSize
      || header.readUInt32LE(22) !== entry.uncompressedSize)) return false;
    const compressed = Buffer.alloc(entry.compressedSize);
    if (fs.readSync(fd, compressed, 0, compressed.length, dataOffset) !== compressed.length) return false;
    const plain = entry.method === 0 ? compressed
      : inflateRawSync(compressed, { maxOutputLength: MAX_REQUIRED_ENTRY_BYTES });
    return plain.length === entry.uncompressedSize && crc32(plain) === entry.crc;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function apkDigest(apk) {
  const hash = createHash('sha256');
  const fd = fs.openSync(apk, 'r');
  try {
    const buffer = Buffer.alloc(1024 * 1024);
    let len;
    while ((len = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, len));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}

export function defaultRun(tool, args) {
  const result = spawnSync(tool, args, { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024,
    windowsHide: true, shell: false });
  if (result.error || result.signal || result.status !== 0 || typeof result.stdout !== 'string') {
    return { ok: false, stdout: '' };
  }
  return { ok: true, stdout: result.stdout };
}

export function parseBadging(text) {
  if (typeof text !== 'string' || text.length > 1024 * 1024) return null;
  const lines = text.split(/\r?\n/).filter((s) => s.startsWith('package:'));
  if (lines.length !== 1) return null;
  const match = /^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'(?:\s|$)/.exec(lines[0]);
  if (!match || !PACKAGE_PATTERN.test(match[1]) || !/^[1-9][0-9]*$/.test(match[2])
    || !VERSION_PATTERN.test(match[3])) return null;
  const versionCode = Number(match[2]);
  if (!Number.isSafeInteger(versionCode) || versionCode > 2147483647) return null;
  return { packageId: match[1], versionCode, versionName: match[3] };
}

export function parseSigning(text) {
  if (typeof text !== 'string' || text.length > 1024 * 1024) return null;
  const schemes = [...text.matchAll(/^Verified using v(?:2|3|3\.1) scheme.*?: (true|false)\s*$/gm)];
  const versions = [...text.matchAll(/^Verified using v(2|3|3\.1) scheme/gm)].map((m) => m[1]);
  const count = [...text.matchAll(/^Number of signers:\s*(\d+)\s*$/gm)];
  const certs = [...text.matchAll(/^Signer #(\d+) certificate SHA-256 digest:\s*([a-f0-9]{64})\s*$/gim)];
  if (schemes.length === 0 || versions.length !== schemes.length
    || new Set(versions).size !== schemes.length || !schemes.some((x) => x[1] === 'true')
    || count.length !== 1 || count[0][1] !== '1' || certs.length !== 1) return null;
  if (certs[0][1] !== '1') return null;
  return { certificateSha256: cleanHex(certs[0][2]) };
}

export function provenanceBytes(payload) {
  return Buffer.from('KUDY-QA-PROVENANCE-V1\n' + JSON.stringify({
    schema: payload.schema, sourceSha: payload.sourceSha, apkSha256: payload.apkSha256,
    packageId: payload.packageId, versionCode: payload.versionCode, versionName: payload.versionName,
  }), 'utf8');
}

function readJson(file) {
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size < 2 || stat.size > 16384) throw Error('METADATA_INVALID');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function verifyAttestation(file, publicKeyPath, actual, expectedSha) {
  if (!file || !publicKeyPath) return { ok: false, reason: 'PROVENANCE_MISSING' };
  let doc, publicKey;
  try {
    doc = readJson(file);
    const keyBytes = fs.readFileSync(publicKeyPath);
    if (keyBytes.length > 8192) throw Error('KEY_INVALID');
    publicKey = createPublicKey(keyBytes);
  } catch {
    return { ok: false, reason: 'PROVENANCE_INVALID' };
  }
  const p = doc?.payload;
  if (doc?.schema !== PROVENANCE_SCHEMA || !p || typeof p !== 'object'
    || Object.keys(p).sort().join() !== ['apkSha256', 'packageId', 'schema', 'sourceSha', 'versionCode', 'versionName'].sort().join()
    || p.schema !== PROVENANCE_SCHEMA || !SHA_PATTERN.test(p.sourceSha ?? '')
    || !HEX64.test(p.apkSha256 ?? '') || !PACKAGE_PATTERN.test(p.packageId ?? '')
    || !Number.isSafeInteger(p.versionCode) || !VERSION_PATTERN.test(p.versionName ?? '')
    || typeof doc.signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(doc.signature)
    || publicKey.asymmetricKeyType !== 'ed25519') {
    return { ok: false, reason: 'PROVENANCE_INVALID' };
  }
  let verified = false;
  try {
    verified = verifySignature(null, provenanceBytes(p), publicKey, Buffer.from(doc.signature, 'base64'));
  } catch {
    return { ok: false, reason: 'PROVENANCE_INVALID' };
  }
  if (!verified) return { ok: false, reason: 'PROVENANCE_SIGNATURE_INVALID' };
  if (cleanHex(p.sourceSha) !== cleanHex(expectedSha) || cleanHex(p.apkSha256) !== actual.apkSha256
    || p.packageId !== actual.packageId || p.versionCode !== actual.versionCode
    || p.versionName !== actual.versionName) return { ok: false, reason: 'PROVENANCE_MISMATCH' };
  return { ok: true, reason: 'ATTESTATION_VERIFIED' };
}

function checkReleaseMetadata(file, actual, expectedSha) {
  if (!file) return { ok: true, reason: 'NOT_PROVIDED' };
  let metadata;
  try { metadata = readJson(file); } catch { return { ok: false, reason: 'METADATA_INVALID' }; }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)
    || Object.keys(metadata).sort().join() !== ['apkSha256', 'packageId', 'sourceSha', 'versionCode', 'versionName'].sort().join()
    || !SHA_PATTERN.test(metadata.sourceSha ?? '') || !HEX64.test(metadata.apkSha256 ?? '')
    || !PACKAGE_PATTERN.test(metadata.packageId ?? '') || !Number.isSafeInteger(metadata.versionCode)
    || !VERSION_PATTERN.test(metadata.versionName ?? '')) return { ok: false, reason: 'METADATA_INVALID' };
  const same = cleanHex(metadata.apkSha256) === actual.apkSha256
    && cleanHex(metadata.sourceSha) === cleanHex(expectedSha)
    && metadata.packageId === actual.packageId && metadata.versionCode === actual.versionCode
    && metadata.versionName === actual.versionName;
  return { ok: same, reason: same ? 'METADATA_MATCH' : 'METADATA_MISMATCH' };
}

function reportBase(expectedSourceSha) {
  return { status: 'FAILED', synthetic: false, checks: {}, apkSha256: null, packageId: null,
    versionName: null, versionCode: null, signingCertificateSha256: null,
    source: { expected: typeof expectedSourceSha === 'string' && SHA_PATTERN.test(expectedSourceSha)
      ? cleanHex(expectedSourceSha) : null, verified: null }, reasonCodes: [] };
}
function mark(r, name, status, reason) {
  r.checks[name] = { status, reason };
  if (status !== 'PASS' && !r.reasonCodes.includes(reason)) r.reasonCodes.push(reason);
}
function finish(r) {
  r.status = Object.values(r.checks).some((c) => c.status === 'FAILED') ? 'FAILED'
    : Object.values(r.checks).some((c) => c.status === 'NOT-VERIFIED') ? 'NOT-VERIFIED' : 'PASS';
  return r;
}

export function validateApk(options, { run = defaultRun } = {}) {
  const r = reportBase(options?.expectedSourceSha);
  r.synthetic = run !== defaultRun;
  const reject = (name, reason) => { mark(r, name, 'FAILED', reason); return finish(r); };
  if (!options || typeof options.apk !== 'string' || !options.apk
    || typeof options.expectedPackageId !== 'string'
    || !PACKAGE_PATTERN.test(options.expectedPackageId)
    || ['by.kudy.app', 'by.kudy.app.dev'].includes(options.expectedPackageId)
    || !SHA_PATTERN.test(options.expectedSourceSha ?? '')) return reject('inputs', 'INPUT_INVALID');
  mark(r, 'inputs', 'PASS', 'INPUT_VALID');

  const absoluteApk = path.resolve(options.apk);
  let archive;
  try {
    if (!fs.statSync(absoluteApk).isFile()) return reject('artifact', 'APK_UNREADABLE');
    archive = readZipEntries(absoluteApk);
  } catch (error) {
    return reject('artifact', error.message === 'APK_ARCHIVE_INVALID' ? 'APK_ARCHIVE_INVALID' : 'APK_UNREADABLE');
  }
  mark(r, 'artifact', 'PASS', 'APK_ARCHIVE_VALID');
  if (!['AndroidManifest.xml', 'classes.dex', 'assets/index.android.bundle']
    .every((name) => extractRequiredEntry(absoluteApk, archive.get(name)))) {
    return reject('standaloneAssets', 'STANDALONE_ASSETS_MISSING');
  }
  mark(r, 'standaloneAssets', 'PASS', 'STANDALONE_ASSETS_PRESENT');

  try { r.apkSha256 = apkDigest(absoluteApk); } catch { return reject('hash', 'APK_UNREADABLE'); }
  mark(r, 'hash', 'PASS', 'SHA256_COMPUTED');

  const badging = run(options.aapt2 || 'aapt2', ['dump', 'badging', absoluteApk]);
  if (!badging?.ok) return reject('manifest', 'AAPT2_FAILED');
  const manifest = parseBadging(badging.stdout);
  if (!manifest) return reject('manifest', 'MANIFEST_OUTPUT_INVALID');
  r.packageId = manifest.packageId;
  r.versionName = manifest.versionName;
  r.versionCode = manifest.versionCode;
  if (manifest.packageId !== options.expectedPackageId
    || ['by.kudy.app', 'by.kudy.app.dev'].includes(manifest.packageId)) {
    return reject('manifest', 'PACKAGE_MISMATCH');
  }
  mark(r, 'manifest', 'PASS', 'MANIFEST_MATCH');

  const signature = run(options.apksigner || 'apksigner', ['verify', '--verbose', '--print-certs', absoluteApk]);
  if (!signature?.ok) return reject('signature', 'SIGNATURE_FAILED');
  const signing = parseSigning(signature.stdout);
  if (!signing) return reject('signature', 'SIGNATURE_OUTPUT_INVALID');
  r.signingCertificateSha256 = signing.certificateSha256;
  mark(r, 'signature', 'PASS', 'SIGNATURE_VERIFIED');

  const actual = { apkSha256: r.apkSha256, ...manifest };
  const metadata = checkReleaseMetadata(options.metadata, actual, options.expectedSourceSha);
  if (!metadata.ok) return reject('metadata', metadata.reason);
  mark(r, 'metadata', 'PASS', metadata.reason);

  const attestation = verifyAttestation(options.provenance, options.trustedPublicKey, actual, options.expectedSourceSha);
  if (!attestation.ok) {
    mark(r, 'provenance', attestation.reason === 'PROVENANCE_MISSING' ? 'NOT-VERIFIED' : 'FAILED', attestation.reason);
    return finish(r);
  }
  mark(r, 'provenance', 'PASS', attestation.reason);
  // Catch modifications between initial hashing, SDK inspection and the final verdict.
  try {
    if (apkDigest(absoluteApk) !== r.apkSha256) return reject('artifactStability', 'APK_CHANGED_DURING_VERIFICATION');
  } catch { return reject('artifactStability', 'APK_CHANGED_DURING_VERIFICATION'); }
  mark(r, 'artifactStability', 'PASS', 'APK_UNCHANGED');
  r.source.verified = cleanHex(options.expectedSourceSha);
  return finish(r);
}
