// MAP-10: the user-approved historical map is really used by the native menu.
// The old pixel segmentation remains the single owner of hit/snap geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
import {PNG} from 'pngjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const pkg=join(root,'docs/design/brand/outputs/menu-map-city-only');
const art=join(root,'docs/design/brand/outputs/MAP-10');
const manifest=JSON.parse(readFileSync(join(pkg,'manifest.json'),'utf8'));
const read=(name)=>PNG.sync.read(readFileSync(name));
const assembled=read(join(art,'historical/assembled.png'));
const previous=read(join(pkg,'styled-source.png'));
const renderer=readFileSync(join(pkg,'native/CityMapMenu.tsx'),'utf8');
const metro=readFileSync(join(art,'native-assets.ts'),'utf8');

test('approved artwork is linked to the native menu instead of the old city art',()=>{
  assert.match(renderer,/MAP-10\/native-assets/);
  for(const item of manifest.pieces){
    assert.match(metro,new RegExp(`historical/pieces/${item.id}\\.png`));
    assert.match(metro,new RegExp(`historical/pieces/${item.id}--ui\\.png`));
  }
  for(const layer of manifest.layers)assert.match(metro,new RegExp(`historical/layers/${layer.id}\\.png`));
  assert.ok(existsSync(join(art,'approved-historical-source.jpg')));
});

test('all five historical puzzle pieces retain exact alpha masks, sizes and unique image content',()=>{
  assert.equal(manifest.pieces.length,5);
  assert.equal(assembled.width,previous.width);
  assert.equal(assembled.height,previous.height);
  let differentColorPixels=0;
  for(const item of manifest.pieces){
    const old=read(join(pkg,item.png)),cur=read(join(art,'historical',item.png)),ui=read(join(art,'historical',item.ui));
    assert.equal(cur.width,item.width);
    assert.equal(cur.height,item.height);
    assert.equal(ui.width,item.width+2*item.padding);
    assert.equal(ui.height,item.height+2*item.padding);
    let visible=0;
    for(let y=0;y<cur.height;y++)for(let x=0;x<cur.width;x++){
      const p=(y*cur.width+x)*4;
      assert.equal(cur.data[p+3],old.data[p+3],`alpha mismatch: ${item.id} ${x},${y}`);
      if(cur.data[p+3]>0){
        visible++;
        const q=((y+item.y)*assembled.width+(x+item.x))*4;
        assert.deepEqual([...cur.data.subarray(p,p+4)],[...assembled.data.subarray(q,q+4)],`pixel mismatch: ${item.id}`);
        if(cur.data[p]!==old.data[p]||cur.data[p+1]!==old.data[p+1]||cur.data[p+2]!==old.data[p+2])differentColorPixels++;
      }
    }
    assert.ok(visible>10000,item.id);
  }
  assert.ok(differentColorPixels>100000,'the historic artwork must not be a renamed legacy image');
});

test('seven layers reassemble one image with exactly the old shape and no opaque padding',()=>{
  let visible=0;
  for(let i=3;i<assembled.data.length;i+=4){
    assert.equal(assembled.data[i],previous.data[i],`assembled alpha mismatch at pixel ${(i-3)/4}`);
    if(assembled.data[i])visible++;
  }
  assert.ok(visible>500000);
});
