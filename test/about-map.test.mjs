// Issue #248 — the illustrated map of «Пра горад» (docs/design/production/
// about-map*.mjs). The picture is tied to the ground by anchors; the zones
// from the owner's list, the stops and the airport are pressable. These
// checks fail when the bend leaves an anchor off its drawn place, a zone or a
// stop falls outside the picture, a place to stay drifts away from the
// trains, or a press stops picking what is under the finger.
import test from 'node:test';
import assert from 'node:assert/strict';

import { ANCHORS, LINES, MAP_IMAGE, STATIONS, ZONES } from '../docs/design/production/about-map-data.mjs';
import { SHAPES, anchorMisses, inside, nearestStop, pickAt } from '../docs/design/production/about-map-geo.mjs';
import { PLACE_WAYS, hasText } from '../docs/design/production/about-content.mjs';

const ALL = { visit: true, stay: true, rail: true, plan: true };
const zone = (id) => SHAPES.zones.find((item) => item.id === id);
const stop = (id) => SHAPES.stations.find((item) => item.id === id);

test('the zones of the owner\'s list are all there, with their kinds', () => {
  assert.deepEqual(ZONES.filter((item) => item.kind === 'visit').map((item) => item.id),
    ['glowne', 'stare', 'przedmiescie', 'dolne', 'westerplatte', 'park-oliwa', 'sopot', 'gdynia', 'brzezno', 'politechnika']);
  assert.deepEqual(ZONES.filter((item) => item.kind === 'stay').map((item) => item.id),
    ['centrum', 'nowe-ogrody', 'dlugie-ogrody', 'kartuska', 'siedlce', 'powstancow', 'chelm', 'orunia-gorna', 'wrzeszcz', 'przymorze', 'sopot-west', 'wzgorze']);
  for (const item of ZONES) assert.ok(item.outline.length >= 5, `${item.id} has a free shape, not a box`);
});

test('lines and anchors name existing stops', () => {
  const ids = new Set(STATIONS.map((station) => station.id));
  for (const line of LINES) for (const id of line.stops) assert.ok(ids.has(id), `${line.id}: unknown stop ${id}`);
  for (const anchor of ANCHORS) {
    assert.ok(anchor.at || anchor.ref === 'airport' || ids.has(anchor.ref), `anchor without a place: ${anchor.ref ?? anchor.what}`);
  }
});

test('the bend puts every anchor on the place the picture drew it', () => {
  for (const { ref, miss } of anchorMisses()) assert.ok(miss < 1, `${ref} misses by ${miss.toFixed(1)} px`);
});

test('every zone and stop lies on the picture', () => {
  const on = ([x, y]) => x >= 0 && y >= 0 && x <= MAP_IMAGE.width && y <= MAP_IMAGE.height;
  for (const item of SHAPES.zones) assert.ok(item.px.every(on), `${item.id} leaves the picture`);
  for (const item of SHAPES.stations) assert.ok(on(item.px), `${item.id} is off the picture`);
});

// The owner's rule: a place to stay near SKM keeps within about 1 km of it.
// The map has no Gdańsk Politechnika stop, so the Wrzeszcz edge next to it
// measures to Wrzeszcz: hence 1.3 km.
test('places to stay by the trains keep close to a stop', () => {
  for (const id of ['centrum', 'nowe-ogrody', 'wrzeszcz', 'przymorze', 'sopot-west', 'wzgorze']) {
    const far = Math.max(...zone(id).ring.map((point) => nearestStop(point).distance));
    assert.ok(far < 1300, `${id}: an edge is ${Math.round(far)} m from the nearest stop`);
  }
});

test('a press picks the stop, the zone under the finger, or nothing', () => {
  assert.deepEqual(pickAt(stop('sopot').px, 1, ALL), { kind: 'station', id: 'sopot' });
  assert.deepEqual(pickAt(SHAPES.airport.px, 1, ALL), { kind: 'airport', id: 'airport' });
  // Zoomed in, a press away from the stops falls on the zone itself.
  const sopot = zone('sopot');
  assert.ok(inside(sopot.centre, sopot.px));
  assert.deepEqual(pickAt(sopot.centre, 3, ALL), { kind: 'zone', id: 'sopot' });
  assert.equal(pickAt([60, 60], 3, ALL), null, 'open country picks nothing');
});

test('a hidden layer cannot be picked', () => {
  assert.equal(pickAt(zone('sopot').centre, 3, { ...ALL, visit: false }), null);
  assert.equal(pickAt(stop('kowale').px, 1, { ...ALL, plan: false }), null);
});

test('pressing again where zones overlap steps to the next zone', () => {
  // Główne Miasto is a place to visit and part of a place to stay.
  const point = zone('glowne').centre;
  const first = pickAt(point, 3, ALL);
  assert.deepEqual(first, { kind: 'zone', id: 'glowne' }, 'the place to visit comes first');
  const second = pickAt(point, 3, ALL, first);
  assert.deepEqual(second, { kind: 'zone', id: 'centrum' });
  assert.deepEqual(pickAt(point, 3, ALL, second), first, 'and round again');
});

test('the card finds the nearest running stop', () => {
  const near = nearestStop(zone('stare').ground);
  assert.equal(near.station.id, 'glowny');
  assert.ok(near.distance > 300 && near.distance < 1000, `${near.distance} m`);
  assert.ok(!near.station.planned);
});

test('every text the map shows exists in the guide dictionary', () => {
  for (const item of ZONES) {
    assert.ok(hasText(item.text), item.text);
    if (item.ways) assert.ok(PLACE_WAYS[item.ways], `ways of ${item.id}`);
  }
  for (const [, ways] of Object.entries(PLACE_WAYS)) for (const [, key] of ways) assert.ok(hasText(key), key);
  for (const key of ['layer.visit', 'layer.stay', 'layer.rail', 'layer.plan', 'stop.skm', 'stop.pkm', 'stop.plan', 'stop.plan.from',
    'stop.change', 'zone.stop', 'map.hint', 'air.map', 'air.map.go']) assert.ok(hasText(key), key);
});
