import { nativeLayout } from '../native-layout.ts';
import { findMagnet, joinGroups } from '../magnet.mjs';
import { amberMotion } from '../amber-light.mjs';
import { insideBastions } from '../atlas-art.mjs';

export type PieceId = typeof nativeLayout.pieces[number]['id'];
export type SceneId = typeof nativeLayout.layers[number]['id'];
export type Point = { x: number; y: number };
export type RibbonHit = Point & { width: number; height: number };
export type CityMenuLayout = { height: number; positions: Partial<Record<PieceId, Point>>; dragEnabled: boolean; centerAssembled?: boolean; assembledLift?: number };
export type MapAccessibilityAction = 'moveLeft' | 'moveRight' | 'moveUp' | 'moveDown' | 'snap' | 'cancel';
export type Phase = 'scattered' | 'assembling' | 'charging' | 'crest' | 'revealing' | 'settling' | 'complete';
type Group = { dx: number; dy: number; members: Set<PieceId> };
type Shape = { id: string; x: number; y: number; width: number; height: number; rows: number[][] };
type Piece = Shape & { id: PieceId; group: Group };
type Hit = { id: PieceId; passive: false } | { id: SceneId; passive: true };
type Gesture = { hit: Hit; start: Point; last: Point; at: number; group?: Group; original?: Point; held: boolean; heldAt?: number; lastMoveAt?: number; cancelled: boolean };
export type PuzzleEvent = { kind: 'none' } | { kind: 'select'; id: PieceId } | { kind: 'passive'; id: SceneId; point: Point } | { kind: 'snap'; point: Point; complete: boolean };

const rows = (value: string) => value.split(';').map(row => row ? row.split(',').map(Number) : []);
const contains = (shape: Shape, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= shape.width || y >= shape.height) return false;
  const row = shape.rows[Math.floor(y)];
  for (let i = 0; i < row.length; i += 2) if (x >= row[i] && x < row[i + 1]) return true;
  return false;
};
const none: PuzzleEvent = { kind: 'none' };
const INERTIA_MS = 200;
const GRAB_MS = 180;

export class CityPuzzle {
  readonly pieces = new Map<PieceId, Piece>();
  readonly groups = new Set<Group>();
  readonly scenery = nativeLayout.layers.map(item => ({ ...item, rows: rows(item.hitRows) }));
  phase: Phase = 'scattered';
  light = 0;
  silhouette = 0;
  radius = 0;
  effectProgress = 0;
  effectElapsed = -1;
  active: Gesture | null = null;
  private accessibleMove: { group: Group; original: Point } | null = null;
  private motion: { at: number; group: Group; from: Point } | null = null;
  private inertia: { at: number; group: Group; from: Point; delta: Point } | null = null;
  private scale: number;
  private readonly layout?: CityMenuLayout;

  constructor(width: number, random: () => number = Math.random, ids: readonly PieceId[] = nativeLayout.pieces.map(p=>p.id), layout?: CityMenuLayout) {
    this.layout = layout;
    this.scale = this.validScale(width);
    const slots = [[170,190],[880,230],[1010,880],[130,850],[410,1400]];
    nativeLayout.pieces.forEach((item, index) => {
      if (!ids.includes(item.id)) return;
      const [x,y] = layout?.positions[item.id] ? [layout.positions[item.id]!.x,layout.positions[item.id]!.y] : slots[index];
      const group = { dx: x + random()*22 - 125 - item.x, dy: y + random()*16 - 320 - item.y, members: new Set([item.id]) };
      this.groups.add(group);
      this.pieces.set(item.id, { ...item, rows: rows(item.hitRows), group });
    });
  }
  private validScale(width: number) {
    if (!Number.isFinite(width) || width <= 0) throw new RangeError('CityMapMenu width must be positive and finite');
    return width / 1600;
  }
  // Дапушчальнае зрушэнне групы (MAP-07): у сцэне, без выхаду за ніжні і верхні
  // краі; паварот не існуе — арыентацыя фрагмента нязменная.
  private clampGroup(group: Group) {
    const members = [...group.members].map(id => this.pieces.get(id)!);
    const configured = this.layout !== undefined;
    group.dx = Math.max(-Math.min(...members.map(p=>p.x))-(configured?125:55),Math.min((configured?1475:1390)-Math.max(...members.map(p=>p.x+p.width)),group.dx));
    group.dy = Math.max(-Math.min(...members.map(p=>p.y))-(configured?320:130),Math.min((this.layout?.height??1800)-(configured?320:430)-Math.max(...members.map(p=>p.y+p.height)),group.dy));
  }
  get sceneOrigin(): Point {
    // The accepted source is 1351 × 1164; the production canvas is square.
    return {x:125,y:this.layout?.centerAssembled ? Math.max(0,(this.layout.height-1164)/2-(this.layout.assembledLift??0)) : 320};
  }
  resize(width: number) { this.cancel(); this.scale = this.validScale(width); }
  position(id: PieceId): Point {
    const piece = this.pieces.get(id)!;
    return { x: 125 + piece.x + piece.group.dx, y: 320 + piece.y + piece.group.dy };
  }
  hit(point: Point, ribbons?: ReadonlyMap<PieceId, RibbonHit>): Hit | undefined {
    const topFirst = [...this.pieces.values()].reverse();
    // Ribbons sit over the polygons, including any overhang outside the art.
    for (const piece of topFirst) {
      const area = ribbons?.get(piece.id);
      if (area && point.x >= area.x && point.x <= area.x + area.width && point.y >= area.y && point.y <= area.y + area.height) {
        return { id: piece.id, passive: false };
      }
    }
    for (const piece of topFirst) {
      const at = this.position(piece.id);
      if (contains(piece, point.x-at.x, point.y-at.y)) return { id: piece.id, passive: false };
    }
    const origin=this.sceneOrigin;
    const x = point.x-origin.x, y = point.y-origin.y;
    if (Math.hypot(x-675,y-582) <= this.radius && this.radius > 0 && insideBastions(x,y)) for (const part of this.scenery) {
      if (contains(part,x-part.x,y-part.y)) return { id: part.id, passive: true };
    }
  }
  begin(point: Point, now: number, ribbons?: ReadonlyMap<PieceId, RibbonHit>): Hit | undefined {
    this.cancel();
    const hit = this.hit(point,ribbons);
    if (!hit) return;
    const group = hit.passive ? undefined : this.pieces.get(hit.id)!.group;
    this.active = { hit, group, start: point, last: point, at: now, original: group ? {x:group.dx,y:group.dy} : undefined, held: false, cancelled: false };
    return hit;
  }
  hold(now: number) {
    if (this.layout?.dragEnabled === false) return;
    const active = this.active;
    if (active && !active.hit.passive && !active.cancelled && !active.held && this.phase === 'scattered' && now-active.at >= nativeLayout.gesture.holdMs) { active.held = true; active.heldAt = now; }
  }
  grabProgress(now: number): number {
    const at=this.active?.heldAt;
    return at===undefined?0:1-(1-Math.max(0,Math.min(1,(now-at)/GRAB_MS)))**2;
  }
  move(point: Point, now: number, withInertia = false): PuzzleEvent {
    const active = this.active;
    if (!active || active.cancelled) return none;
    this.hold(now);
    if (!active.held) {
      if (Math.hypot(point.x-active.start.x,point.y-active.start.y)*this.scale > nativeLayout.gesture.tapSlopDp) active.cancelled = true;
      return none;
    }
    const group = active.group!;
    const dx = point.x-active.last.x, dy = point.y-active.last.y;
    if (dx === 0 && dy === 0) return none;
    const previous={x:group.dx,y:group.dy};
    const dt=Math.max(16,Math.min(64,now-(active.lastMoveAt??active.heldAt??now)));
    group.dx += dx; group.dy += dy;
    this.clampGroup(group);
    active.last = point; active.lastMoveAt=now;
    const velocity={x:(group.dx-previous.x)/dt,y:(group.dy-previous.y)/dt};
    const result=this.snapGroup(group,now);
    const speed=Math.hypot(velocity.x,velocity.y)*this.scale;
    if (withInertia && result.kind==='snap' && speed>=0.2) {
      // Both pieces already share one group. Dampen the incoming velocity
      // without ever changing their joint or starting another automatic snap.
      const distance=Math.min(24,speed*80)/this.scale;
      const length=Math.hypot(velocity.x,velocity.y);
      this.inertia={at:now,group,from:{x:group.dx,y:group.dy},delta:{x:velocity.x/length*distance,y:velocity.y/length*distance}};
    }
    return result;
  }
  // Same step size as the approved keyboard controls in production/menu.mjs.
  accessibilityAction(id: PieceId, action: MapAccessibilityAction, now: number): PuzzleEvent {
    const group = this.pieces.get(id)?.group;
    if (!group || this.phase !== 'scattered') return none;
    if (action === 'cancel') { this.cancel(); return none; }
    this.stopInertia();
    if (this.active || (this.accessibleMove && this.accessibleMove.group !== group)) this.cancel();
    if (action === 'snap') {
      const result = this.snapGroup(group,now);
      if (result.kind === 'snap') this.accessibleMove = null;
      return result;
    }
    const step = 8 / this.scale;
    if (this.accessibleMove?.group !== group) {
      this.cancel();
      this.accessibleMove = {group,original:{x:group.dx,y:group.dy}};
    }
    if (action === 'moveLeft') group.dx -= step;
    if (action === 'moveRight') group.dx += step;
    if (action === 'moveUp') group.dy -= step;
    if (action === 'moveDown') group.dy += step;
    this.clampGroup(group);
    return none;
  }
  private snapGroup(group: Group, now: number): PuzzleEvent {
    const joints = nativeLayout.joints.filter(joint=>this.pieces.has(joint.a)&&this.pieces.has(joint.b));
    const target = findMagnet(group,this.pieces,joints,nativeLayout.gesture.snapDistanceDp/this.scale);
    if (!target) return none;
    joinGroups(group,target.other,this.pieces,this.groups);
    // Складзеная група шырэйшая за кожную з частак — той самы дапушчальны
    // зрух трэба пацвердзіць нанова (AC #81), інакш краі вылезаюць за сцэну.
    this.clampGroup(group);
    this.active = null;
    const complete = group.members.size === this.pieces.size;
    if (complete) { this.motion = { at: now, group, from: {x:group.dx,y:group.dy} }; this.phase = 'assembling'; }
    return { kind:'snap', complete, point:{x:125+group.dx+target.joint.port[0],y:320+group.dy+target.joint.port[1]} };
  }
  release(now: number): PuzzleEvent {
    const active = this.active;
    this.active = null;
    if (!active || active.cancelled || active.held || now-active.at >= nativeLayout.gesture.holdMs) return none;
    return active.hit.passive ? {kind:'passive',id:active.hit.id,point:active.start} : {kind:'select',id:active.hit.id};
  }
  stopInertia() {
    if (!this.inertia) return;
    const {group,at}=this.inertia;
    if(this.motion?.group===group) this.motion={at:at+INERTIA_MS,group,from:{x:group.dx,y:group.dy}};
    this.inertia=null;
  }
  cancel() {
    this.stopInertia();
    if (this.accessibleMove) {
      const {group,original} = this.accessibleMove;
      group.dx = original.x; group.dy = original.y;
      this.accessibleMove = null;
    }
    if (this.active?.group && this.active.original) { this.active.group.dx=this.active.original.x; this.active.group.dy=this.active.original.y; }
    this.active = null;
  }
  advance(now: number): boolean {
    if (this.inertia) {
      const {at,group,from,delta}=this.inertia;
      const progress=Math.max(0,Math.min(1,(now-at)/INERTIA_MS));
      const eased=1-(1-progress)**2;
      group.dx=from.x+delta.x*eased; group.dy=from.y+delta.y*eased;
      this.clampGroup(group);
      if(progress<1)return true;
      this.stopInertia();
    }
    if (!this.motion) return false;
    const {at,group,from} = this.motion;
    const elapsed = Math.max(0,now-at),center = Math.min(1,elapsed/400);
    const targetY=this.sceneOrigin.y-320;
    group.dx=from.x*(1-center)**3; group.dy=targetY+(from.y-targetY)*(1-center)**3;
    const t=elapsed-400,{chargeMs,crestMs,revealMs,settleMs}=nativeLayout.reveal;
    this.phase=t<0?'assembling':t<chargeMs?'charging':t<chargeMs+crestMs?'crest':t<chargeMs+crestMs+revealMs?'revealing':'settling';
    this.effectElapsed=t;
    const effect=amberMotion(t,nativeLayout.reveal);
    this.light=effect.light;this.silhouette=effect.veil;this.radius=effect.radius;this.effectProgress=effect.progress;
    if(t>=chargeMs+crestMs+revealMs+settleMs)this.completeNow();
    return this.motion !== null;
  }
  completeNow() {
    if (this.groups.size !== 1) return;
    const group = [...this.groups][0];
    if (group.members.size !== this.pieces.size) return;
    group.dx=0;group.dy=this.sceneOrigin.y-320;this.inertia=null;this.motion=null;this.phase='complete';this.radius=1000;this.light=0;this.silhouette=0;this.effectProgress=1;this.active=null;
  }
}
