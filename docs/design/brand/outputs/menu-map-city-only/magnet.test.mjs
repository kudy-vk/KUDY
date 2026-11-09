import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findMagnet, joinGroups} from './magnet.mjs';

const setup=()=>{
  const left={id:'left',dx:30,dy:20,members:new Set(['one'])};
  const right={id:'right',dx:35,dy:25,members:new Set(['two'])};
  const actors=new Map([['one',{group:left}],['two',{group:right}]]);
  return {left,right,actors,groups:new Set([left,right]),joints:[{a:'one',b:'two'}]};
};
test('only the correct relative side inside the capture radius attracts',()=>{
  const {left,right,actors,joints}=setup();
  assert.equal(findMagnet(left,actors,joints,10)?.other,right);
  assert.equal(findMagnet(left,actors,[],10),undefined);
  right.dx=-35;
  assert.equal(findMagnet(left,actors,joints,10),undefined);
  right.dx=30;right.dy=31;
  assert.equal(findMagnet(left,actors,joints,10),undefined);
});
test('joining retains the exact source offset and all member identities',()=>{
  const {left,right,actors,groups}=setup();
  joinGroups(left,right,actors,groups);
  assert.deepEqual([left.dx,left.dy],[35,25]);
  assert.equal(actors.get('one').group,actors.get('two').group);
  assert.deepEqual([...left.members],['one','two']);
  assert.equal(groups.size,1);
  assert.equal(findMagnet(left,actors,[{a:'one',b:'two'}],10),undefined);
});

test('MAP-03 rejects malformed menu geometry', t => {
  const script = fileURLToPath(new URL('../MAP-03/test_geometry.py', import.meta.url));
  const result = spawnSync('python', [script], {
    encoding: 'utf8',
    env: { ...process.env, OPENBLAS_NUM_THREADS: '1', PYTHONUTF8: '1' },
  });
  if (result.error?.code === 'ENOENT' || result.stderr?.startsWith('Python was not found;')) {
    t.skip('Python is unavailable');
    return;
  }
  if (result.status === 1 && /ModuleNotFoundError: No module named '(cv2|numpy)'/.test(result.stderr)) {
    t.skip('Python OpenCV or NumPy is unavailable');
    return;
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
});
