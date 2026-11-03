#!/usr/bin/env node
// QA-DIST-01. Exit: 0 verified, 1 FAILED, 2 NOT-VERIFIED, 64 usage invalid.
import { validateApk } from './qa-apk-verify.mjs';

const usage = 'Usage: node tools/android-build/qa-apk-verify-cli.mjs --apk <file.apk> --source-sha <git SHA> [--package by.kudy.app.sandbox] [--metadata <json>] [--provenance <json> --trusted-public-key <PEM>] [--aapt2 <sdk tool>] [--apksigner <sdk tool>]';

function parse(argv) {
  const allowed = new Set(['--apk', '--source-sha', '--package', '--metadata', '--provenance', '--trusted-public-key', '--aapt2', '--apksigner']);
  if (argv.length % 2 !== 0) return null;
  const values = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!allowed.has(argv[i]) || argv[i] in values || !argv[i + 1] || argv[i + 1].startsWith('--')) return null;
    values[argv[i]] = argv[i + 1];
  }
  if (!values['--apk'] || !values['--source-sha']) return null;
  return {
    apk: values['--apk'],
    expectedSourceSha: values['--source-sha'],
    expectedPackageId: values['--package'] ?? 'by.kudy.app.sandbox',
    metadata: values['--metadata'],
    provenance: values['--provenance'],
    trustedPublicKey: values['--trusted-public-key'],
    aapt2: values['--aapt2'],
    apksigner: values['--apksigner'],
  };
}

const parsed = parse(process.argv.slice(2));
if (!parsed) {
  process.stdout.write(JSON.stringify({ status: 'FAILED', synthetic: false, checks: { inputs: {
    status: 'FAILED', reason: 'USAGE_INVALID',
  } }, reasonCodes: ['USAGE_INVALID'] }) + '\n');
  process.exitCode = 64;
} else {
  try {
    const result = validateApk(parsed);
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exitCode = result.status === 'PASS' ? 0 : result.status === 'NOT-VERIFIED' ? 2 : 1;
  } catch {
    process.stdout.write(JSON.stringify({ status: 'FAILED', synthetic: false, checks: { internal: {
      status: 'FAILED', reason: 'INTERNAL_ERROR',
    } }, reasonCodes: ['INTERNAL_ERROR'] }) + '\n');
    process.exitCode = 1;
  }
}
