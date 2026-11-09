import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

export function runPythonTest(t, scriptUrl, modules) {
  const script = fileURLToPath(scriptUrl);
  const result = spawnSync('python', [script], {
    encoding: 'utf8',
    env: { ...process.env, OPENBLAS_NUM_THREADS: '1', PYTHONUTF8: '1' },
  });
  if (result.error?.code === 'ENOENT' || result.stderr?.startsWith('Python was not found;')) {
    t.skip('Python is unavailable');
    return;
  }
  const missing = modules.find(
    (name) => result.status === 1 && new RegExp(`ModuleNotFoundError: No module named '${name}'`).test(result.stderr ?? ''),
  );
  if (missing) {
    t.skip(`Python ${missing} is unavailable`);
    return;
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
}
