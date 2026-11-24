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
    'Actual shipping path',
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
  ],
  'docs/agent-rules/issue-workflow.md': [
    '- Shipping path:',
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

test('removing one audit requirement is detected by the policy guard', () => {
  for (const [file, markers] of Object.entries(required)) {
    const content = readFileSync(resolve(root, file), 'utf8');
    for (const marker of markers) {
      const without = content.split(marker).join('');
      assert.ok(missingPolicyChecks(without, markers).includes(marker), `Removal was not caught: ${file}: ${marker}`);
    }
  }
});
