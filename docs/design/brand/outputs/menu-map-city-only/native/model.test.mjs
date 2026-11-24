import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CityPuzzle} from './model.ts';
import {nativeLayout} from '../native-layout.ts';
import {joinGroups} from '../magnet.mjs';
const puzzle=()=>new CityPuzzle(360,()=>.5);
const anchor=(m,id)=>{const p=m.pieces.get(id),a=nativeLayout.pieces.find(p=>p.id===id);return {x:125+a.x+p.group.dx+a.width/2,y:320+a.y+p.group.dy+a.height/2};};

test('a configured subset assembles without requiring the absent fifth piece',()=>{
  const ids=nativeLayout.pieces.slice(0,4).map(p=>p.id);
  const m=new CityPuzzle(320,()=>.5,ids),first=[...m.groups][0];
  assert.equal(m.pieces.has('kudy'),false);
  for(const group of [...m.groups].slice(1))joinGroups(first,group,m.pieces,m.groups);
  m.completeNow();assert.equal(m.phase,'complete');
});

test('a tap-only host keeps its configured scatter during held movement',()=>{
  const m=new CityPuzzle(320,()=>0,undefined,{height:2500,positions:{nearby:{x:110,y:600}},dragEnabled:false});
  const before=m.position('nearby'),point=anchor(m,'nearby');
  assert.deepEqual(before,{x:110,y:600});
  m.begin(point,0);m.hold(301);m.move({x:point.x+100,y:point.y},350);
  assert.deepEqual(m.position('nearby'),before);
  assert.equal(m.release(400).kind,'none');assert.equal(m.groups.size,5);
});
test('idle time, holding and release never magnetize nearby pieces',()=>{
  const m=puzzle(),a=m.pieces.get('nearby'),b=m.pieces.get('guides');
  b.group.dx=a.group.dx+2;b.group.dy=a.group.dy+2;
  m.advance(100000);assert.equal(m.groups.size,5);
  m.completeNow();assert.equal(m.phase,'scattered');assert.equal(m.groups.size,5);
  const point=anchor(m,'guides');assert.equal(m.begin(point,100000)?.id,'guides');
  m.hold(100400);assert.equal(m.move(point,100500).kind,'none');
  assert.equal(m.release(100600).kind,'none');assert.equal(m.groups.size,5);
});
test('only real held movement can snap and never emits a section press',()=>{
  const m=puzzle(),a=m.pieces.get('nearby'),b=m.pieces.get('guides');
  b.group.dx=a.group.dx+20;b.group.dy=a.group.dy;
  const point=anchor(m,'guides');m.begin(point,0);m.hold(301);
  assert.equal(m.move({x:point.x-1,y:point.y},320).kind,'snap');
  assert.equal(m.groups.size,4);assert.equal(a.group,b.group);
  assert.equal(m.release(350).kind,'none');
});
test('early movement cancels tap; cancellation restores a group',()=>{
  const m=puzzle(),p=anchor(m,'guides'),before={...m.pieces.get('guides').group};
  m.begin(p,0);m.move({x:p.x+100,y:p.y},20);assert.equal(m.release(50).kind,'none');
  m.begin(p,100);m.hold(450);m.move({x:p.x+120,y:p.y},470);m.cancel();
  const g=m.pieces.get('guides').group;assert.equal(g.dx,before.dx);assert.equal(g.dy,before.dy);
});
test('tap returns a stable menu ID; a revealed scene point has no section ID',()=>{
  const m=puzzle();for(const p of nativeLayout.pieces){const pt=anchor(m,p.id);m.begin(pt,0);assert.deepEqual(m.release(50),{kind:'select',id:p.id});}
  const first=[...m.groups][0];for(const group of [...m.groups].slice(1))joinGroups(first,group,m.pieces,m.groups);
  m.completeNow();const point={x:125+650,y:320+210};
  assert.equal(m.begin(point,0).passive,true);assert.equal(m.release(50).kind,'passive');
});
test('only the final user snap starts transformation, which can finish safely',()=>{
  const m=puzzle(),first=m.pieces.get('nearby').group;
  for(const group of [...m.groups])if(!group.members.has('kudy')&&group!==first)joinGroups(first,group,m.pieces,m.groups);
  const last=m.pieces.get('kudy');last.group.dx=first.dx+20;last.group.dy=first.dy;
  const p=anchor(m,'kudy');m.begin(p,100);m.hold(401);
  assert.equal(m.move({x:p.x-1,y:p.y},420).complete,true);
  for(const [offset,phase] of [[0,'assembling'],[410,'charging'],[1100,'crest'],[1450,'revealing'],[2300,'settling'],[2900,'complete']]){m.advance(420+offset);assert.equal(m.phase,phase);}
  assert.equal(m.radius,1000);assert.equal(m.light,0);
  assert.deepEqual(m.position('guides'),{x:125+469,y:320+361});
});
// MAP-08 (#81): групы, уласцівасцевыя сцэнары і мяжы дапушчальнага зрушэння.
const invariants=(m)=>{
  const links=new Map(nativeLayout.pieces.map(p=>[p.id,[]]));
  for(const joint of nativeLayout.joints){links.get(joint.a).push(joint.b);links.get(joint.b).push(joint.a);}
  for(const group of m.groups){
    const members=new Set(group.members);
    for(const id of members)assert.equal(m.pieces.get(id).group,group);
    const seen=new Set(),queue=[[...members][0]];
    while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);for(const next of links.get(id))if(members.has(next))queue.push(next);}
    assert.equal(seen.size,members.size); // група — злучнае падмноства кананічных стыкаў
  }
  const height=m.layout?.height??1800;
  for(const piece of m.pieces.values()){
    const home=nativeLayout.pieces.find(p=>p.id===piece.id);
    assert.ok(piece.x+piece.group.dx>=-55&&piece.x+piece.group.dx+piece.width<=1390,`bounds x: ${piece.id}`);
    assert.ok(piece.y+piece.group.dy>=-130&&piece.y+piece.group.dy+piece.height<=height-430,`bounds y: ${piece.id}`);
    assert.equal(piece.width,home?.width);assert.equal(piece.height,home?.height); // павароту няма
  }
};
test('a seeded walk of held drags merges only canonical neighbours and never splits a group',()=>{
  let seed=20261105>>>0;const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  const m=new CityPuzzle(360,rnd);
  const snapshot=()=>JSON.stringify([...m.groups].map(g=>[g.dx,g.dy,[...g.members].sort()]).sort());
  let clock=0,merges=0;
  for(let step=0;step<80&&m.phase==='scattered';step++){
    if(step%5===4){ // кароткія дотыкі без утрымання механіку не змяняюць
      const before=snapshot(),p=anchor(m,nativeLayout.pieces[Math.floor(rnd()*5)].id);
      m.begin(p,clock);m.move({x:p.x+220,y:p.y+90},clock+40);assert.equal(m.release(clock+60).kind,'none');
      assert.equal(snapshot(),before);
    }else{
      const before=m.groups.size,p=anchor(m,nativeLayout.pieces[Math.floor(rnd()*5)].id);
      m.begin(p,clock);m.hold(clock+301);
      for(let i=0;i<6;i++){const event=m.move({x:p.x+(rnd()*2-1)*170,y:p.y+(rnd()*2-1)*170},clock+310+i*25);if(event.kind==='snap')merges++;}
      m.release(clock+470); // палец падняты — зрух застаецца, адкрыты жэст не аднаўляецца
      assert.ok(m.groups.size<=before);
      if(m.phase!=='scattered')for(let t=clock+500;t<=clock+3000;t+=250)m.advance(t);
    }
    invariants(m);clock+=900;
  }
  assert.ok(merges>0,'ход мусіць хоць раз злучыць суседзяў');
  assert.ok(m.groups.size<5,'стыкоўка паменшыла колькасць груп');
});
test('a third piece joins the merged group and the whole group moves as one',()=>{
  const m=puzzle(),n=m.pieces.get('nearby'),g=m.pieces.get('guides'),d=m.pieces.get('discovery');
  g.group.dx=n.group.dx+20;
  let p=anchor(m,'guides');m.begin(p,0);m.hold(301);
  assert.equal(m.move({x:p.x-1,y:p.y},320).kind,'snap');
  const pair=m.pieces.get('guides').group;
  d.group.dx=pair.dx+20;d.group.dy=pair.dy;
  p=anchor(m,'discovery');m.begin(p,500);m.hold(801);
  assert.equal(m.move({x:p.x-1,y:p.y},820).kind,'snap');
  const trio=m.pieces.get('guides').group;
  assert.equal(trio.members.size,3);assert.equal(m.groups.size,3);
  assert.deepEqual([...trio.members].sort(),['discovery','guides','nearby']);
  const beforeN=anchor(m,'nearby'),beforeG=anchor(m,'guides');
  p=anchor(m,'discovery');m.begin(p,1000);m.hold(1301);m.move({x:p.x+40,y:p.y},1320);m.release(1340);
  const afterN=anchor(m,'nearby'),afterG=anchor(m,'guides');
  assert.equal(afterN.x-beforeN.x,40);assert.equal(afterG.x-beforeG.x,40); // адзін элемент рухае ўсю групу
  assert.equal(Math.hypot(afterG.x-afterN.x,afterG.y-afterN.y),Math.hypot(beforeG.x-beforeN.x,beforeG.y-beforeN.y)); // суседства захаванае
  invariants(m);
});
test('a join re-validates the allowed displacement of the merged box',()=>{
  const m=new CityPuzzle(320,()=>.5); // маштаб 0.2, парог захопу 110 px крыніцы
  const d=m.pieces.get('discovery'),k=m.pieces.get('kudy');
  k.group.dx=350;k.group.dy=0; // верх kudy: 1390−940=450 — сваё дазволена
  d.group.dx=299;d.group.dy=0; // верх discovery: 1390−1091=299 — ягоная мяжа
  const p=anchor(m,'discovery');m.begin(p,0);m.hold(301);
  assert.equal(m.move({x:p.x+1,y:p.y},320).kind,'snap'); // зрух 51 ≤ 110
  assert.equal(m.pieces.get('discovery').group.dx,299); // складзеная група вернутая ў межы
  assert.ok([...m.pieces.values()].every(piece=>piece.x+piece.group.dx+piece.width<=1390));
  invariants(m);
});
test('partial assembly never starts the reveal and taps stay honest beside it',()=>{
  const m=puzzle(),a=m.pieces.get('nearby'),b=m.pieces.get('guides');
  b.group.dx=a.group.dx+20;
  const p=anchor(m,'guides');m.begin(p,0);m.hold(301);
  const event=m.move({x:p.x-1,y:p.y},320);
  assert.equal(event.kind,'snap');assert.equal(event.complete,false);
  assert.equal(m.phase,'scattered');assert.equal(m.advance(4000),false); // механіку можна проста ігнараваць
  const q=anchor(m,'discovery');
  assert.deepEqual(m.begin(q,5000)&&m.release(5050),{kind:'select',id:'discovery'});
});
test('the disabled piece snaps like any neighbour while navigation stays host-gated',()=>{
  const m=puzzle(),r=m.pieces.get('reserve-1'),k=m.pieces.get('kudy');
  k.group.dx=r.group.dx+20;k.group.dy=r.group.dy;
  const p=anchor(m,'kudy');m.begin(p,0);m.hold(301);
  const event=m.move({x:p.x-1,y:p.y},320);
  assert.equal(event.kind,'snap');assert.equal(event.complete,false);
  assert.ok(m.pieces.get('kudy').group.members.has('reserve-1'));assert.equal(m.groups.size,4);
  for(const group of [...m.groups])if(group!==k.group)joinGroups(k.group,group,m.pieces,m.groups);
  m.completeNow();assert.equal(m.phase,'complete'); // поўная зборка з неактыўным кавалком завершаецца
});
test('snapped groups never split: cancel and new drags keep members together',()=>{
  const m=puzzle(),n=m.pieces.get('nearby'),g=m.pieces.get('guides');
  g.group.dx=n.group.dx+20;
  let p=anchor(m,'guides');m.begin(p,0);m.hold(301);
  assert.equal(m.move({x:p.x-1,y:p.y},320).kind,'snap');
  const members=n.group.members;
  p=anchor(m,'nearby');m.begin(p,2000);m.hold(2301);m.move({x:p.x-200,y:p.y},2320);m.cancel();
  assert.ok(m.pieces.get('nearby').group.members.has('guides')); // раз'яднання няма
  p=anchor(m,'nearby');m.begin(p,3000);m.hold(3301);m.move({x:p.x+120,y:p.y},3320);m.release(3340);
  assert.equal(m.pieces.get('nearby').group,m.pieces.get('guides').group);
  assert.equal(n.group.members,members); // склад групы нязменны ўсялякай цягай
});

test('non-pointer movement works in the tap-only host and cancel restores its group',()=>{
  const m=new CityPuzzle(320,()=>0,undefined,{height:1800,positions:{},dragEnabled:false});
  const before=m.position('guides'),step=8/(320/1600);
  for(const [action,x,y] of [['moveRight',step,0],['moveDown',step,step],['moveLeft',0,step],['moveUp',0,0],['moveLeft',-step,0]]){
    assert.equal(m.accessibilityAction('guides',action,100).kind,'none');
    assert.deepEqual(m.position('guides'),{x:before.x+x,y:before.y+y});
  }
  assert.equal(m.groups.size,5);
  m.accessibilityAction('guides','cancel',101);
  assert.deepEqual(m.position('guides'),before);
});
test('accessible snap uses canonical neighbours and never activates a destination',()=>{
  const m=puzzle(),n=m.pieces.get('nearby'),g=m.pieces.get('guides');
  g.group.dx=n.group.dx+20;g.group.dy=n.group.dy;
  const before=m.groups.size;
  m.accessibilityAction('guides','moveRight',100);
  assert.equal(m.groups.size,before,'directional movement never joins automatically');
  const result=m.accessibilityAction('guides','snap',101);
  assert.equal(result.kind,'snap');assert.equal(result.complete,false);
  assert.equal(m.groups.size,before-1);assert.equal(n.group,g.group);
  const position=m.position('nearby');
  m.accessibilityAction('guides','moveLeft',102);
  m.accessibilityAction('guides','cancel',103);
  assert.deepEqual(m.position('nearby'),position);
  assert.equal(n.group,g.group);
  invariants(m);
});
test('explicit accessibility snap with no nearby joint is a no-op',()=>{
  const m=puzzle(),before=m.position('guides');
  assert.equal(m.accessibilityAction('guides','snap',100).kind,'none');
  assert.deepEqual(m.position('guides'),before);
  assert.equal(m.groups.size,5);
});


test('failed accessible snap retains cancel, and changing focus cannot orphan a move',()=>{
  const m=puzzle(),before=m.position('guides'),other=m.position('nearby');
  m.accessibilityAction('guides','moveRight',100);
  assert.equal(m.accessibilityAction('guides','snap',101).kind,'none');
  m.accessibilityAction('guides','cancel',102);
  assert.deepEqual(m.position('guides'),before);
  m.accessibilityAction('guides','moveRight',103);
  m.accessibilityAction('nearby','moveDown',104);
  assert.deepEqual(m.position('guides'),before);
  m.accessibilityAction('nearby','cancel',105);
  assert.deepEqual(m.position('nearby'),other);
});

test('accessible movement is rolled back on resize and respects the scene bounds',()=>{
  const m=puzzle(),before=m.position('guides');
  for(let i=0;i<100;i++)m.accessibilityAction('guides','moveRight',i);
  assert.notDeepEqual(m.position('guides'),before);
  invariants(m);
  m.resize(320);
  assert.deepEqual(m.position('guides'),before);
});
