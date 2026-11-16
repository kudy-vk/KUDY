// «Пра горад», раздзел city: the illustrated map of the Tricity with the
// zones of the owner's list, the railway and the airport on it.
//
// Built from the shared map pieces (kit-map.mjs): the map view that zooms and
// pans, map buttons, names that never cover one another, layer switches.
// This module adds what is this map's own: the drawing of zones, lines and
// stops (about-map-geo.mjs), the card of what is picked and the list of zones.
// A press picks the nearest station, the airport sign or the zone under the
// finger; pressing again where zones overlap steps to the next one. Without a
// pointer the same is reachable: the station signs and the airport sign are
// named buttons on the map — Tab moves between them, Enter or Space picks,
// Escape clears, through the same handler as a press. The pick stays until
// another pick, and the card under the map tells what it is.
//
// What the visitor chose — zoom, centre, pick, layers — lives in ui.atlas and
// survives a repaint.
import { el, icon, svg } from './kit.mjs';
import { bounds } from './kit-geo.mjs';
import { layerSwitches, mapButton, settleLabels, swatch, zoomView } from './kit-map.mjs';
import { MAP_IMAGE } from './about-map-data.mjs';
import { SHAPES, nearestStop, pickAt } from './about-map-geo.mjs';
import { PLACE_WAYS, SUMMER_BEACHES } from './about-content.mjs';
import { facts, fold, remark, sr } from './about-parts.mjs';

const [W, H] = SHAPES.size;
// The picture has 3 px per unit (MAP_IMAGE.density): at ×3 it is still about sharp on a 3× phone screen.
const MAX_ZOOM = 3;
// From which zoom the main stops are named, and from which every stop and the visit zones.
const LEVELS = [[2.3, 'all'], [1.5, 'main']];
const NEAR_STOP = 1500; // m: a farther stop is not offered as «the nearest»
// Where nothing is picked, Google Maps opens on the middle of the Tricity.
const TRICITY = [18.60, 54.41];
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initialAtlas() {
  return { zoom: 1, centre: [W / 2, H / 2], pick: null, show: { visit: true, stay: true, rail: true, plan: true } };
}

const ring = (px) => `M${px.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
const path = (px) => `M${px.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`;
const count = (kind) => SHAPES.zones.filter((zone) => zone.kind === kind).length;

// The drawing over the picture: zones, lines, stops, the names of the visit
// zones and the ring of the airport sign. Returns the <svg> and its parts.
//
// The shapes and the line ink are decoration (the list under the map speaks
// for the zones), so they are hidden from the reader. The station signs and
// the airport sign are named buttons: a reader sees them on the map, Tab
// reaches them, and Enter or Space picks like a press (the wiring is in
// atlas(), where choose() lives).
function drawing() {
  const zones = SHAPES.zones.map((zone) => svg('path', { class: `zone ${zone.kind}`, d: ring(zone.px) }));
  const zoneNames = SHAPES.zones.filter((zone) => zone.kind === 'visit').map((zone) => {
    const node = svg('g', { class: 'mark zname', 'data-layer': 'visit', 'aria-hidden': 'true' }, svg('text', { 'text-anchor': 'middle', y: 4 }, zone.name));
    node.place = zone.centre;
    node.zone = zone.id;
    return node;
  });
  const lines = SHAPES.lines.map((line) => {
    const last = line.px.length - (line.beyond ? 1 : 0);
    return svg('g', { class: `line ${line.id}`, 'data-layer': line.layer, 'aria-hidden': 'true' },
      svg('path', { class: 'casing', d: path(line.px.slice(0, last)) }),
      svg('path', { class: 'ink', d: path(line.px.slice(0, last)) }),
      line.beyond ? svg('path', { class: 'ink beyond', d: path(line.px.slice(last - 1)) }) : null);
  });
  const stops = SHAPES.stations.map((station) => {
    const kind = station.planned ? 'plan' : station.lines.includes('skm') ? 'skm' : 'pkm';
    const node = svg('g', {
      class: `mark stop ${kind}${station.main ? ' main' : ''}${station.change ? ' change' : ''}`,
      'data-layer': station.planned ? 'plan' : 'rail',
      role: 'button', tabindex: 0, lang: 'pl', 'aria-label': station.name,
    },
      svg('circle', { class: 'halo', r: 11 }),
      station.change ? svg('circle', { class: 'outer', r: 7 }) : null,
      svg('circle', { class: 'dot', r: 4.5 }),
      svg('text', { x: 9, y: 4 }, station.name));
    node.place = station.px;
    node.stop = station.id;
    return node;
  });
  const airport = svg('g', { class: 'mark airport', role: 'button', tabindex: 0, lang: 'pl', 'aria-label': `${SHAPES.airport.name} (${SHAPES.airport.code})` },
    svg('circle', { class: 'halo', r: 19 }));
  airport.place = SHAPES.airport.px;
  const node = svg('svg', { class: 'atlas-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H },
    // Places to stay lie under places to visit where they overlap.
    svg('g', { 'aria-hidden': 'true' }, ...zones.filter((_, i) => SHAPES.zones[i].kind === 'stay'), ...zones.filter((_, i) => SHAPES.zones[i].kind === 'visit')),
    ...lines, ...zoneNames, airport, ...stops);
  return { node, zones, zoneNames, stops, airport };
}

// A pick with what is needed to show it: the shape, its layer and its ground point.
function lookUp(pick) {
  if (pick.kind === 'zone') {
    const zone = SHAPES.zones.find((item) => item.id === pick.id);
    return { zone, layer: zone.kind, at: zone.ground };
  }
  if (pick.kind === 'station') {
    const station = SHAPES.stations.find((item) => item.id === pick.id);
    return { station, layer: station.planned ? 'plan' : 'rail', at: station.at };
  }
  return { airport: SHAPES.airport, layer: null, at: SHAPES.airport.at };
}

// The card under the map: a hint, or what the pick is. `t` the guide's words.
function pickCard(card, pick, { t, openSection }) {
  const km = (metres) => (metres / 1000).toFixed(1).replace('.', t('u.decimal'));
  const head = (name, tag, tagClass) => el('div', { className: 'place-head' },
    el('h4', { lang: 'pl', textContent: name }), el('span', { className: `tag ${tagClass}`, textContent: tag }));
  const text = (className, value) => el('p', { className, textContent: value });
  // Like replaceChildren, but a part that is not there (null, false) is left out.
  const fill = (...parts) => card.replaceChildren(...parts.filter(Boolean));

  if (!pick) {
    card.className = 'card hint row atlas-card';
    fill(icon('map-pin', 18), el('span', { textContent: t('map.hint') }));
    return;
  }
  card.className = 'card place atlas-card';
  const found = lookUp(pick);
  if (found.zone) {
    const { zone } = found;
    const near = nearestStop(zone.ground);
    const ways = (PLACE_WAYS[zone.ways] ?? []).map(([sign, key]) => [sign, t(key)]);
    // The nearest stop, unless the ways already name a train.
    if (near.distance <= NEAR_STOP && !ways.some(([sign]) => sign === 'train-front')) ways.push(['train-front', t('zone.stop', { name: near.station.name, km: km(near.distance) })]);
    fill(
      head(zone.name, t(`layer.${zone.kind}`), `zone-tag ${zone.kind}`),
      text('', t(zone.text)),
      ways.length > 0 && el('div', { className: 'stack' }, sr(`${t('city.get')}: `), ...ways.map((way) => facts([way]))),
      SUMMER_BEACHES.includes(zone.id) && text('t-secondary', t('city.summer')));
  } else if (found.station) {
    const { station } = found;
    const lineName = (id) => SHAPES.lines.find((line) => line.id === id).name;
    fill(
      head(station.name, t(station.planned ? 'stop.planned' : 'stop.tag'), station.planned ? '' : 'free'),
      el('span', { className: 'tags' }, ...station.lines.map((id) => el('span', { className: `lbadge ${id}`, textContent: lineName(id) }))),
      ...station.lines.filter((id) => id !== 'plan').map((id) => text('', t(`stop.${id}`))),
      station.change && text('', t('stop.change')),
      station.planned && remark('warn', t('stop.plan')),
      !station.planned && station.lines.includes('plan') && text('t-secondary', t('stop.plan.from')));
  } else {
    const go = el('button', { className: 'btn', type: 'button' }, el('span', { textContent: t('air.map.go') }), icon('chevron-right', 18));
    go.addEventListener('click', () => openSection('airport'));
    fill(head(found.airport.name, found.airport.code, ''), text('', t('air.map')), go);
  }
}

// t: the guide's words; ui: what the visitor chose (ui.atlas, ui.folds);
// lang: the guide language; openSection(id): turns the wheel to a section;
// openMaps(url): hands a Google Maps address to the system.
// Returns the nodes of the section: map with caption, layers, card, list.
export function atlas({ t, ui, lang, openSection, openMaps }) {
  const state = ui.atlas;
  const art = drawing();
  const card = el('div', { className: 'card atlas-card' });
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');

  // Names in order of importance: the picked one, the main stops, the visit zones, the other stops.
  const names = () => {
    const rank = (mark) => (mark.classList.contains('picked') ? 0 : mark.classList.contains('main') ? 1 : mark.zone ? 2 : 3);
    return [...art.stops, ...art.zoneNames].sort((a, b) => rank(a) - rank(b)).map((mark) => mark.querySelector('text'));
  };
  function choose(pick) {
    state.pick = pick;
    const is = (kind, id) => pick?.kind === kind && pick.id === id;
    SHAPES.zones.forEach((zone, i) => art.zones[i].classList.toggle('picked', is('zone', zone.id)));
    for (const node of art.stops) node.classList.toggle('picked', is('station', node.stop));
    for (const node of art.zoneNames) node.classList.toggle('picked', is('zone', node.zone));
    art.airport.classList.toggle('picked', pick?.kind === 'airport');
    // The picked zone is drawn above the others, so its whole shape shows.
    const picked = art.zones[SHAPES.zones.findIndex((zone) => is('zone', zone.id))];
    if (picked) picked.parentNode.append(picked);
    settleLabels(names());
    pickCard(card, pick, { t, openSection });
  }

  // The signs are buttons (drawing()): from the keyboard, Enter or Space picks
  // through the same choose() as a press, and Escape clears, like on the map.
  const keyPick = (pick) => (event) => {
    if (event.key === 'Escape') { if (state.pick) choose(null); return; }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    choose(pick);
  };
  for (const node of art.stops) node.addEventListener('keydown', keyPick({ kind: 'station', id: node.stop }));
  art.airport.addEventListener('keydown', keyPick({ kind: 'airport' }));

  // Google Maps at the picked place, or at the middle of the Tricity: for a
  // route or a street view the visitor already knows where to go.
  const google = mapButton('external-link', t('map.google'), () => {
    const [lon, lat] = state.pick ? lookUp(state.pick).at : TRICITY;
    openMaps(`https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`);
  }, 'small');
  const view = zoomView({
    size: [W, H],
    ground: el('img', { src: MAP_IMAGE.src, alt: '', draggable: false, width: W, height: H }),
    overlay: art.node,
    marks: [...art.zoneNames, ...art.stops, art.airport],
    state, maxZoom: MAX_ZOOM, levels: LEVELS,
    words: { label: t('map.label'), role: t('map.role'), zoomIn: t('map.zoomIn'), zoomOut: t('map.zoomOut'), fit: t('map.fit') },
    tools: [google],
    onTap: (point, scale) => choose(pickAt(point, scale, state.show, state.pick)),
    onPaint: () => settleLabels(names()),
    onEscape: () => state.pick && choose(null),
  });
  view.node.classList.add('atlas');

  // Layers: the zone kinds with how many zones each holds, the running trains, the planned line.
  const layersChanged = () => {
    for (const node of art.node.querySelectorAll('[data-layer]')) node.classList.toggle('off', !state.show[node.dataset.layer]);
    SHAPES.zones.forEach((zone, i) => art.zones[i].classList.toggle('off', !state.show[zone.kind]));
  };
  const switches = layerSwitches({
    label: t('map.layers'),
    show: state.show,
    items: [
      { id: 'visit', label: t('layer.visit'), count: count('visit') },
      { id: 'stay', label: t('layer.stay'), count: count('stay') },
      { id: 'rail', label: t('layer.rail') },
      { id: 'plan', label: t('layer.plan') },
    ],
    onChange: () => {
      layersChanged();
      // A pick on a hidden layer goes away with it.
      const layer = state.pick && lookUp(state.pick).layer;
      choose(layer && !state.show[layer] ? null : state.pick);
    },
  });

  // The same zones as a list: a press picks the zone and brings it into view.
  const row = (zone) => {
    const button = el('button', { className: 'srow', type: 'button' }, swatch(zone.kind), el('span', { className: 'grow', lang: 'pl', textContent: zone.name }));
    button.dataset.key = `zone-row:${zone.id}`;
    button.addEventListener('click', () => {
      if (!state.show[zone.kind]) { state.show[zone.kind] = true; switches.sync(); layersChanged(); }
      choose({ kind: 'zone', id: zone.id });
      view.show(bounds(zone.px));
      view.node.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    });
    return button;
  };
  const group = (kind) => [
    el('p', { className: 'g-sub', textContent: t(`layer.${kind}`) }),
    el('div', { className: 'card group' }, ...SHAPES.zones.filter((zone) => zone.kind === kind).map(row)),
  ];
  const list = fold({
    id: 'atlas-list', memory: ui.folds, lead: icon('list', 22),
    title: t('map.list'), meta: t('map.list.meta', { visit: count('visit'), stay: count('stay') }),
    body: [...group('visit'), ...group('stay')],
  });

  layersChanged();
  choose(state.pick);
  const caption = el('p', { className: 't-secondary', lang, textContent: t('city.caption') });
  return [el('div', { className: 'orientation' }, view.node, caption), switches, card, list];
}
