// Shared fixture for the scope-script CLI tests: a throwaway git repo with a
// base commit, a docs-only commit and a code commit on top, plus a runner
// that executes a scope CLI against two SHAs while capturing $GITHUB_OUTPUT.
// One copy of the scaffolding for both consumers (jscpd gate; issue #134) —
// each consumer keeps its own output-key assertions.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tempScopeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kudy-scope-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { encoding: 'utf8' }).trim();
  git('init', '-q');
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'a.md'), 'a\n');
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  fs.writeFileSync(path.join(dir, 'docs', 'a.md'), 'b\n');
  git('commit', '-q', '-am', 'docs');
  const docs = git('rev-parse', 'HEAD');
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'app', 'x.ts'), 'x\n');
  git('add', '.');
  git('commit', '-q', '-m', 'app');
  const app = git('rev-parse', 'HEAD');
  return {
    dir,
    base,
    docs,
    app,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function runScopeScript(dir, script, base, head) {
  const out = path.join(dir, 'github-output');
  fs.writeFileSync(out, '');
  const stdout = execFileSync(process.execPath, [script, base, head], {
    cwd: dir,
    env: { ...process.env, GITHUB_OUTPUT: out },
    encoding: 'utf8',
  });
  return { stdout: stdout.trim(), output: fs.readFileSync(out, 'utf8') };
}
