#!/usr/bin/env node
// QA-DIST-01 proof: the committed fixture test suite must pass, while a
// throwaway copy with the provenance fail-closed gate bypassed must fail.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const modules = ['qa-apk-verify.mjs', 'qa-apk-verify-cli.mjs', 'qa-apk-verify.test.mjs'];
function run(dir) {
  const check = spawnSync(process.execPath, ['--test', path.join(dir, 'qa-apk-verify.test.mjs')], {
    cwd: dir, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024,
  });
  return check.status;
}

const clean = run(here);
if (clean !== 0) {
  console.error('proof: baseline tests failed');
  process.exitCode = 1;
} else {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-apk-proof-'));
  try {
    for (const name of modules) fs.copyFileSync(path.join(here, name), path.join(dir, name));
    const validator = path.join(dir, 'qa-apk-verify.mjs');
    const source = fs.readFileSync(validator, 'utf8');
    const anchor = 'if (!attestation.ok) {';
    if (source.split(anchor).length !== 2) throw Error('mutation anchor absent or ambiguous');
    fs.writeFileSync(validator, source.replace(anchor, 'if (false) {'));
    const mutated = run(dir);
    if (mutated === 0 || mutated === null) {
      console.error('proof: bypassing provenance validation did not fail tests');
      process.exitCode = 1;
    } else {
      console.log('proof: baseline PASS; provenance-bypass mutation correctly FAILS');
    }
  } catch {
    console.error('proof: mutation could not be verified');
    process.exitCode = 1;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
