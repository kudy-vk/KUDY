import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = {
  'AGENTS.md': [
    '## Mandatory pre-change audit:',
    'before the first edit',
    'Actual owning path',
    'CI workflow',
    '`N/A` with a reason',
    'owner-controlled no-change disposition',
    'Existing / missing / unknown',
    'Minimum necessary change',
    'Stop instead of guessing',
    'ALREADY DONE',
    'MISSING',
    'UNVERIFIED',
    'Mandatory design catalog workflow',
  ],
  'docs/agent-rules/implementation-rules.md': [
    '## 19. Inspect the shipped feature before making or generating anything',
    'PR #453',
    'app/menu.tsx',
    'ALREADY DONE',
    'MISSING',
    'UNVERIFIED',
    'Before PR, compare every changed',
    'CI workflow',
    'owner-controlled *no-change completion*',
    'never return an already-complete issue',
  ],
  'docs/agent-rules/issue-workflow.md': [
    '- Owning path:',
    '## 5a. Already complete before implementation',
    'Replace `agent:running` with `agent:blocked`',
    'never an already-complete task',
    'Only the operator',
    '- Existing vs missing:',
    '- Minimum gap:',
    'implementation-rules.md',
    'Recheck the §19 shipping-path audit',
  ],
};

function missingPolicyChecks(text, markers) {
  return markers.filter(marker => !text.includes(marker));
}

test('pre-change audit is mandatory at entry point, implementation and issue handoff', () => {
  for (const [file, markers] of Object.entries(required)) {
    const content = readFileSync(resolve(root, file), 'utf8');
    assert.deepEqual(missingPolicyChecks(content, markers), [], `Missing preflight gate in ${file}`);
  }
});

test('a verified no-change task stays blocked until operator closes it, never requeued', () => {
  const workflow = readFileSync(resolve(root, 'docs/agent-rules/issue-workflow.md'), 'utf8');
  const section = workflow.split('## 5a. Already complete before implementation')[1]?.split('## 6. Blocked and hand-back')[0] ?? '';
  const isSafe = (value) => value.includes('Replace `agent:running` with `agent:blocked`') &&
    value.includes('never `agent:ready`') &&
    value.includes('**Only the operator**') &&
    /do not make code changes, create a PR or hand the\s+open issue back to/.test(value) &&
    !value.includes('Replace `agent:running` with `agent:ready`');
  assert.ok(isSafe(section), 'a completed task must never be sent back to the ready queue');
  assert.equal(isSafe(section.replace('Replace `agent:running` with `agent:blocked`', 'Replace `agent:running` with `agent:ready`')), false,
    'switching the terminal status back to ready must make this test fail');
});

test('removing one audit requirement is detected by the policy guard', () => {
  for (const [file, markers] of Object.entries(required)) {
    const content = readFileSync(resolve(root, file), 'utf8');
    for (const marker of markers) {
      const without = content.split(marker).join('');
      assert.ok(missingPolicyChecks(without, markers).includes(marker), `Removal was not caught: ${file}: ${marker}`);
    }
  }
});
