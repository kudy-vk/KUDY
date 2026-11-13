// #286 — relative links in the results docs must open their targets. The
// design-QA hrefs written as `../design-qa/…` from docs/agent-tasks/results/
// resolved to the nonexistent docs/agent-tasks/design-qa/… (7 instances on
// main before this fix: 200.md:36 ×4, 200.md:38, 252.md:33 ×2); the correct
// depth is `../../design-qa/…` — the shape the already-correct rows in
// 212-dark-theme.md and MAP-06.md use. This walk is what makes npm test fail
// when a wrong-depth relative link is re-added to a results doc
// (implementation-rules 1).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const RESULTS = path.join(REPO, 'docs/agent-tasks/results');

// Inline markdown links: [text](href). Fragments, absolute and scheme links
// are out of the scan; a relative href is resolved against the results dir
// and must exist on disk. Reference definitions and bare angles are not
// links this doc set uses.
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function findBrokenLinks(text, baseDir) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    let m;
    LINK.lastIndex = 0;
    while ((m = LINK.exec(line))) {
      const href = m[1];
      if (/^(https?:|mailto:|#|data:)/.test(href)) continue;
      const target = href.split('#')[0];
      if (!target) continue;
      if (!fs.existsSync(path.resolve(baseDir, target))) {
        hits.push({ line: i + 1, href });
      }
    }
  });
  return hits;
}

test('every relative link in a results doc opens its target', () => {
  const violations = [];
  for (const f of fs.readdirSync(RESULTS).filter((f) => f.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(RESULTS, f), 'utf8');
    for (const hit of findBrokenLinks(text, RESULTS)) {
      violations.push(`docs/agent-tasks/results/${f}:${hit.line}: ${hit.href}`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    'broken relative links in the results docs — fix the depth or the path (the results docs sit two levels under docs/: ../../design-qa/…, ../../demos/…)',
  );
});

test('the finder flags a wrong-depth link and names the line', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'links-guard-'));
  try {
    fs.writeFileSync(path.join(dir, 'target.md'), 'target');
    const text = ['ok: [canon](target.md)', 'bad: [report](missing-report.md)'].join('\n');
    assert.deepEqual(findBrokenLinks(text, dir), [{ line: 2, href: 'missing-report.md' }]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('absolute, anchor and mailto links stay untouched', () => {
  assert.deepEqual(
    findBrokenLinks(
      '[gh](https://github.com/kudy-vk/KUDY) [anchor](#section) [mail](mailto:a@b.c)',
      os.tmpdir(),
    ),
    [],
  );
});
