// Walk screen (Run, app/run/[id].tsx): the map as background and one panel in
// three positions — Peek, Half, Full. Behaviour follows docs/11_run_interaction.md
// and the owner-reviewed proposal brand/outputs/RUN-card-states: arrows and
// swipes change only the open card, one button in the bottom row controls the
// sound, the ad sits under the control row. Both phones on the board share one
// state, so a tap in one theme is mirrored in the other.
import { adZone, button, el, icon, iconButton, mountBoard, registerIcons, svg, topbar } from './kit.mjs';

// Lucide shapes this screen alone needs (lucide-react-native 1.49.0, ISC).
registerIcons({
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  'flag': [['path', { d: 'M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528' }]],
  'circle-pause': [['circle', { cx: '12', cy: '12', r: '10' }], ['line', { x1: '10', x2: '10', y1: '15', y2: '9' }], ['line', { x1: '14', x2: '14', y1: '15', y2: '9' }]],
  'a-arrow-up': [['path', { d: 'm14 11 4-4 4 4' }], ['path', { d: 'M18 16V7' }], ['path', { d: 'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16' }], ['path', { d: 'M3.304 13h6.392' }]],
  'a-arrow-down': [['path', { d: 'm14 12 4 4 4-4' }], ['path', { d: 'M18 16V7' }], ['path', { d: 'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16' }], ['path', { d: 'M3.304 13h6.392' }]],
});

// Marker fills are the canon's own values, the same in both themes.
const FILL = { played: '#1d6b4f', playing: '#b3331f', available: '#8a610e', pending: '#646c77', locked: '#67707a' };
const RUN = (key) => `native.run.${key}`;
const STRING_IDS = [
  ...['attribution', 'autoplaySuspendedTitle', 'close', 'deniedGps', 'endConfirmAccept', 'endConfirmCancel', 'endConfirmTitle',
    'endWalk', 'lockedHint', 'manualPlayHint', 'markerHint', 'nothingPlaying', 'nowPlayingLabel', 'pauseAudio', 'pauseWalk',
    'pausedTitle', 'playAudio', 'points', 'recenter', 'resume', 'transcript'].map(RUN),
  ...Object.keys(FILL).map((status) => RUN(`status.${status}`)),
  'native.chrome.back', 'native.place.paused', 'web.ui.prevStop', 'web.ui.nextStop',
];

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
const NEW = {
  menu: { be: 'Меню прагулкі', en: 'Walk menu', uk: 'Меню прогулянки', de: 'Rundgang-Menü', es: 'Menú del recorrido', fr: 'Menu de la visite', cs: 'Nabídka procházky', sv: 'Promenadmeny' },
  changeGuide: { be: 'Змяніць гіда', en: 'Change guide', uk: 'Змінити гід', de: 'Guide wechseln', es: 'Cambiar de guía', fr: 'Changer de guide', cs: 'Změnit průvodce', sv: 'Byt guide' },
  bigger: { be: 'Павялічыць тэкст', en: 'Larger text', uk: 'Збільшити текст', de: 'Text vergrößern', es: 'Aumentar el texto', fr: 'Agrandir le texte', cs: 'Zvětšit text', sv: 'Större text' },
  smaller: { be: 'Паменшыць тэкст', en: 'Smaller text', uk: 'Зменшити текст', de: 'Text verkleinern', es: 'Reducir el texto', fr: 'Réduire le texte', cs: 'Zmenšit text', sv: 'Mindre text' },
  photo: { be: 'Фота {n} з {total}', en: 'Photo {n} of {total}', uk: 'Фото {n} з {total}', de: 'Foto {n} von {total}', es: 'Foto {n} de {total}', fr: 'Photo {n} sur {total}', cs: 'Fotka {n} z {total}', sv: 'Foto {n} av {total}' },
  prevPhoto: { be: 'Папярэдняе фота', en: 'Previous photo', uk: 'Попереднє фото', de: 'Voriges Foto', es: 'Foto anterior', fr: 'Photo précédente', cs: 'Předchozí fotka', sv: 'Föregående foto' },
  nextPhoto: { be: 'Наступнае фота', en: 'Next photo', uk: 'Наступне фото', de: 'Nächstes Foto', es: 'Foto siguiente', fr: 'Photo suivante', cs: 'Další fotka', sv: 'Nästa foto' },
  // The short reason stands next to the sound button; the full one is in the card.
  notCached: { be: 'Гісторыя не загружана — без сеткі не гучыць', en: 'Story not downloaded — it cannot play offline', uk: 'Історію не завантажено — без мережі вона не звучить', de: 'Geschichte nicht geladen — ohne Netz spielt sie nicht', es: 'Historia sin descargar: no suena sin red', fr: 'Histoire non téléchargée — pas de lecture sans réseau', cs: 'Příběh není stažený — bez sítě nehraje', sv: 'Berättelsen är inte nedladdad — spelas inte utan nätverk' },
  notCachedDetail: { be: 'Гісторыя гэтай кропкі не загружана на прыладу. Без сеткі яе нельга ні паслухаць, ні прачытаць.', en: 'The story of this stop is not downloaded to the device. Without a connection it can be neither played nor read.', uk: 'Історію цієї точки не завантажено на пристрій. Без мережі її не можна ні послухати, ні прочитати.', de: 'Die Geschichte dieser Station ist nicht auf dem Gerät. Ohne Netz kann man sie weder hören noch lesen.', es: 'La historia de esta parada no está descargada en el dispositivo. Sin red no se puede escuchar ni leer.', fr: 'L’histoire de cette étape n’est pas téléchargée sur l’appareil. Sans réseau, impossible de l’écouter ou de la lire.', cs: 'Příběh tohoto zastavení není stažený v zařízení. Bez sítě ho nelze přehrát ani přečíst.', sv: 'Berättelsen för det här stoppet är inte nedladdad till enheten. Utan nätverk går den varken att lyssna på eller läsa.' },
};

// Illustrative content: a made-up guide, made-up stops and a schematic map.
// None of it is real route content or real cartography; it stays Belarusian.
const GUIDE = 'Шпацыр па старым горадзе';
const WORLD = { w: 720, h: 760 };
const STREETS = [['M-20 566L740 474', 24], ['M-20 296L740 372', 18], ['M214 -20L252 780', 20], ['M566 -20L474 780', 18], ['M-20 116L740 150', 14], ['M60 780L404 -20', 12], ['M-20 690L740 640', 12]];
const PHOTOS = 3;
const STOPS = [
  { id: 1, name: 'Ратуша', x: 150, y: 520, short: 'Ратуша стаіць у цэнтры старога горада. Зірніце, як ад яе разыходзяцца вуліцы.',
    text: ['Ратуша стаіць у цэнтры старога горада. Зірніце, як ад яе разыходзяцца вуліцы. З гэтага месца было зручна бачыць, чым жыве плошча: хто прыехаў на рынак, дзе сабраліся людзі, як мяняецца горад.', 'Паглядзіце на фасады навокал. Яны неаднолькавыя, і ў гэтым добра адчуваецца, што плошча складвалася паступова. Пакуль ідзяце далей, параўнайце іх вышыню, вокны і колеры.'] },
  { id: 2, name: 'Плошча', x: 285, y: 410, short: 'На плошчы звярніце ўвагу на камяніцы і прастору паміж імі.',
    text: ['На плошчы звярніце ўвагу на камяніцы і прастору паміж імі. Тут лёгка заўважыць, як будынкі задаюць кірунак руху.', 'Пастойце хвіліну і паглядзіце вакол. З аднаго боку адкрываецца шырокі праход, з другога вуліца робіцца вузейшай. Гэты тэкст можна чытаць у сваім тэмпе разам з гукам.'] },
  { id: 3, name: 'Брама', x: 440, y: 455, short: 'Брама пазначае пераход са старой плошчы на суседнюю вуліцу.',
    text: ['Брама пазначае пераход са старой плошчы на суседнюю вуліцу. Падыдзіце бліжэй і разгледзьце яе дэталі.', 'Калі хочацца разгледзець фота, націсніце мініяцюру: яна адкрыецца на ўвесь экран, а астатнія здымкі можна гартаць.'] },
  { id: 4, name: 'Набярэжная', x: 520, y: 315, short: 'З набярэжнай бачныя два берагі і масты паміж імі.',
    text: ['З набярэжнай бачныя два берагі і масты паміж імі. Вада тут заўсёды была дарогай: па ёй у горад прыходзілі тавары і навіны.', 'Прайдзіце ўздоўж парэнчаў і знайдзіце месца, адкуль відаць абодва масты адразу.'] },
  { id: 5, name: 'Млын', x: 345, y: 230, locked: true, short: 'Стары млын каля канала. Некалі вада круціла тут колы, і мукі хапала на ўвесь квартал.' },
];

// The board switch sets the starting facts of the session (11 §3.1): which
// stories are heard, which stops spent their auto-trigger, what plays, which
// card is open and where the person is. `me: null` — no live position.
const PRESETS = {
  between: { heard: [1], fired: [1, 4], playing: null, inspected: 1, me: [222, 462] },
  arrived: { heard: [1], fired: [1, 2, 4], playing: 2, inspected: 2, me: [250, 392] },
  finished: { heard: [1, 2], fired: [1, 2, 4], playing: null, inspected: 2, me: [250, 392] },
  paused: { heard: [1], fired: [1, 4], playing: null, inspected: 1, me: null, walkPaused: true },
  denied: { heard: [1], fired: [1, 4], playing: null, inspected: 1, me: null, denied: true, list: true },
  uncached: { heard: [1, 2], fired: [1, 2, 4], playing: null, inspected: 3, me: [404, 438], uncached: 3 },
};

const stopOf = (id) => STOPS.find((stop) => stop.id === id);
// The visible status is computed, never stored (11 §3.1).
const statusOf = (s, stop) => (stop.locked ? 'locked' : s.playing === stop.id ? 'playing' : s.heard.has(stop.id) ? 'played' : s.fired.has(stop.id) ? 'available' : 'pending');
// A key lets the redraw give the focus back to the same control.
const keyed = (node, key) => { node.dataset.k = key; return node; };

function swipe(node, { left, right, up, down }) {
  let start = null, swiped = false;
  node.addEventListener('pointerdown', (event) => { start = [event.clientX, event.clientY]; swiped = false; });
  node.addEventListener('pointerup', (event) => {
    if (!start) return;
    const dx = event.clientX - start[0], dy = event.clientY - start[1];
    start = null;
    const act = Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? left : right) : Math.abs(dy) > 32 && Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? up : down) : null;
    if (!act) return;
    swiped = true;
    setTimeout(act, 0);
  });
  // A swipe that ends on a button must not also press it.
  node.addEventListener('click', (event) => { if (swiped) { swiped = false; event.stopPropagation(); } }, true);
}

// The marker circle: state fill and the white first letter of the state word.
function dot(c, status, small = false) {
  const node = el('i', { className: `run-dot${small ? ' small' : ''}`, textContent: c.w(`status.${status}`).charAt(0).toLocaleUpperCase(c.locale) });
  node.dataset.theme = 'light';
  node.style.background = FILL[status];
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function mapLayer(c) {
  const { s } = c;
  const map = el('div', { className: 'run-map' });
  map.dataset.theme = 'light';
  const world = el('div', { className: 'run-world' });
  world.style.width = `${WORLD.w}px`;
  world.style.height = `${WORLD.h}px`;
  world.append(svg('svg', { viewBox: `0 0 ${WORLD.w} ${WORLD.h}`, 'aria-hidden': 'true' },
    ...STREETS.map(([d, width]) => svg('path', { class: 'run-street', d, 'stroke-width': width })),
    svg('path', { class: 'run-route', d: `M${STOPS.map((stop) => `${stop.x} ${stop.y}`).join('L')}` })));
  for (const stop of STOPS) {
    const status = statusOf(s, stop), word = c.w(`status.${status}`);
    const marker = keyed(el('button', { className: 'run-marker', type: 'button', title: `${stop.name}, ${word}` },
      dot(c, status), el('span', {}, el('b', { textContent: stop.name }), word)), `m${stop.id}`);
    marker.style.left = `${stop.x}px`;
    marker.style.top = `${stop.y}px`;
    marker.setAttribute('aria-label', marker.title);
    marker.setAttribute('aria-description', c.w('markerHint'));
    if (stop.id === s.inspected && s.panel !== 'peek') marker.setAttribute('aria-current', 'true');
    // A marker tap opens the preview and never the sound (11 §5).
    marker.addEventListener('click', () => {
      c.set({ inspected: stop.id, list: false, panel: s.panel === 'peek' ? 'half' : s.panel });
      c.say(`Адкрыта прэв'ю кропкі «${stop.name}». Гук не запускаецца і не мяняецца.`);
    });
    world.append(marker);
  }
  if (s.me) {
    const me = el('span', { className: 'run-me' });
    me.style.left = `${s.me[0]}px`;
    me.style.top = `${s.me[1]}px`;
    me.setAttribute('aria-hidden', 'true');
    world.append(me);
  }
  const attribution = el('button', { className: 'run-attr', type: 'button', textContent: c.w('attribution') });
  attribution.addEventListener('click', () => c.say('Адкрываецца старонка ліцэнзіі OpenStreetMap у браўзеры.'));
  const foot = el('div', { className: 'run-map-foot' }, attribution);
  let banner = null;
  if (s.denied) {
    // No position: the state is named in words, the automatic stories are off (11 §7).
    banner = el('div', { className: 'notice run-banner' }, icon('circle-alert', 18), el('span', { textContent: c.w('deniedGps') }));
    banner.setAttribute('role', 'status');
  }
  if (s.me) {
    const recenter = keyed(el('button', { className: 'run-fab', type: 'button' }, icon('locate-fixed', 22)), 'fab');
    recenter.setAttribute('aria-label', c.w('recenter'));
    recenter.addEventListener('click', () => c.say('Карта вяртаецца да месца, дзе стаіць чалавек.'));
    foot.append(recenter);
  }
  map.append(world, el('div', { className: 'run-map-ui' }, banner, foot));
  // Once the map is in the page: show the person, or the open card's stop, in
  // the part of the map that the notice above and the controls below leave free.
  const place = () => {
    const person = s.panel === 'peek' && s.me;
    const target = person ? { x: s.me[0], y: s.me[1] } : stopOf(s.inspected);
    const block = person ? 18 : world.querySelector(`[data-k="m${target.id}"]`).offsetHeight;
    const top = banner ? banner.offsetHeight + 16 : 8;
    const bottom = map.clientHeight - 30 - foot.offsetHeight;
    const blockTop = bottom - top >= block ? top + (bottom - top - block) / 2 : top;
    const x = Math.min(0, Math.max(map.clientWidth - WORLD.w, map.clientWidth / 2 - target.x));
    const y = Math.min(0, Math.max(map.clientHeight - WORLD.h, blockTop + (person ? 9 : 17) - target.y));
    world.style.translate = `${x}px ${y}px`;
  };
  return { map, place };
}

function pointList(c) {
  const { s } = c;
  const list = el('ul', { className: 'run-points' });
  for (const stop of STOPS) {
    const status = statusOf(s, stop);
    const row = keyed(el('button', { className: 'btn block', type: 'button' }, dot(c, status, true),
      el('span', { className: 't-display', textContent: stop.name }), el('span', { className: 't-small', textContent: c.w(`status.${status}`) })), `p${stop.id}`);
    row.addEventListener('click', () => {
      c.set({ inspected: stop.id, list: false });
      c.say(`Выбрана кропка «${stop.name}». Каб паслухаць яе, трэба націснуць кнопку гуку ўнізе.`);
    });
    list.append(el('li', {}, row));
  }
  return [el('div', { className: 't-strong', textContent: c.w('points') }), s.denied && el('p', { className: 't-secondary', textContent: c.w('manualPlayHint') }), list];
}

function cardBody(c, stop) {
  const { s } = c;
  const body = el('div', { className: 'run-body scroll' });
  if (s.list && s.panel === 'half') {
    body.append(...pointList(c).filter(Boolean));
  } else if (stop.locked) {
    // A locked stop has only its public preview: the name, a short teaser and the
    // lock, which the status tag above and the reason at the sound button carry (11 §16.4).
    body.append(el('p', { textContent: stop.short }));
  } else if (s.uncached === stop.id) {
    const box = el('div', { className: 'notice run-notice' }, icon('wifi-off', 18), el('span', { textContent: c.n('notCachedDetail') }));
    box.setAttribute('role', 'status');
    body.append(box);
  } else if (s.panel === 'half') {
    const photos = el('div', { className: 'run-photos' });
    for (let index = 0; index < PHOTOS; index += 1) {
      const tile = keyed(el('button', { className: 'run-photo', type: 'button' }, icon('image', 24)), `ph${index}`);
      tile.setAttribute('aria-label', c.n('photo', index + 1));
      tile.addEventListener('click', () => c.set({ over: 'photo', photo: index }));
      photos.append(tile);
    }
    body.append(el('p', { textContent: stop.short }),
      keyed(button(c.w('transcript'), { iconName: 'file-text', onPress: () => c.set({ panel: 'full' }) }), 'read'), photos);
  } else {
    // The transcript belongs to the open card, not to the story that plays (11 §3.2).
    const size = keyed(iconButton(s.large ? 'a-arrow-down' : 'a-arrow-up', c.n(s.large ? 'smaller' : 'bigger'), () => c.set({ large: !s.large })), 'size');
    body.append(el('div', { className: 'run-read' }, el('h3', { textContent: c.w('transcript') }), size),
      el('div', { className: `run-text${s.large ? ' large' : ''}` }, ...stop.text.map((paragraph) => el('p', { textContent: paragraph }))));
  }
  return body;
}

// The bottom row: what plays now, the one sound button, the session menu.
function dock(c, stop) {
  const { s } = c;
  const menu = keyed(iconButton('ellipsis-vertical', c.n('menu'), () => c.set({ over: 'menu' })), 'menu');
  if (s.walkPaused) {
    const resume = () => {
      c.sync('state', s.origin === 'paused' ? 'between' : s.origin);
      c.set({ walkPaused: false, me: s.denied ? null : PRESETS[s.origin].me ?? PRESETS.between.me });
      c.say('Прагулка працягнута: пазіцыя зноў сочыцца, аўтаматычныя гісторыі зноў магчымыя. Само нічога не загучала.');
    };
    return el('div', { className: 'run-dock' }, el('div', { className: 'run-now t-strong', textContent: c.w('pausedTitle') }),
      keyed(button(c.w('resume'), { kind: 'primary', iconName: 'footprints', onPress: resume }), 'play'), menu);
  }
  const heard = s.playing ? stopOf(s.playing) : null;
  const blocked = stop.locked ? c.w('lockedHint') : s.uncached === stop.id ? c.n('notCached') : null;
  const same = s.playing === stop.id, sounding = same && !s.audioPaused;
  const lines = [el('span', { textContent: heard ? `${c.w('nowPlayingLabel')}: ${heard.name}` : c.w('nothingPlaying') })];
  // A hand pause suspends the automatic stories until the person resumes (11 §5.2).
  if (heard && s.audioPaused) lines.push(el('span', { className: 't-small', textContent: `${c.strings['native.place.paused']} · ${c.w('autoplaySuspendedTitle')}` }));
  if (blocked) lines.push(el('span', { className: 't-small', textContent: blocked }));
  let now = el('div', { className: 'run-now' }, ...lines);
  if (heard && !same) {
    // Another card is open: the line leads back to the card of the story that plays.
    now = keyed(el('button', { className: 'run-now', type: 'button' }, ...lines), 'now');
    now.addEventListener('click', () => { c.set({ inspected: heard.id, list: false }); c.say(`Адкрыта картка гісторыі, якая гучыць: «${heard.name}».`); });
  }
  const play = keyed(el('button', { className: 'run-play', type: 'button' }, icon(sounding ? 'pause' : 'play', 26)), 'play');
  play.setAttribute('aria-label', sounding ? c.w('pauseAudio') : same ? c.w('playAudio') : `${c.w('playAudio')}: ${stop.name}`);
  if (blocked) play.setAttribute('aria-disabled', 'true');
  play.addEventListener('click', () => {
    if (blocked) { c.say(`Кнопка гуку недаступная. Прычына напісана побач: «${blocked}».`); return; }
    if (same) {
      c.set({ audioPaused: !s.audioPaused });
      c.say(s.audioPaused ? 'Гук на паўзе. Аўтаматычныя гісторыі прыпыненыя, пакуль чалавек сам не працягне.' : `Гук працягваецца: «${stop.name}».`);
    } else {
      c.set({ playing: stop.id, audioPaused: false });
      c.say(`Гучыць «${stop.name}»${heard ? ` — «${heard.name}» спынена без пытання` : ''}. Запуск ручны, праслуханае не губляецца.`);
    }
  });
  return el('div', { className: 'run-dock' }, now, play, menu);
}

function sheet(c, stop) {
  const { s } = c;
  const status = statusOf(s, stop), word = c.w(`status.${status}`);
  const move = (step) => {
    const next = STOPS[(STOPS.indexOf(stop) + step + STOPS.length) % STOPS.length];
    c.set({ inspected: next.id, list: false });
    c.say(`Адкрыта картка «${next.name}». Гук не змяніўся.`);
  };
  const up = () => { if (s.panel !== 'full') c.set({ panel: s.panel === 'peek' ? 'half' : 'full' }); };
  const title = keyed(el('button', { className: 'run-title', type: 'button' },
    el('span', { className: 't-display', textContent: stop.name }), el('span', { className: 'tag' }, dot(c, status, true), word)), 'title');
  title.setAttribute('aria-label', `${stop.name}, ${word}`);
  title.setAttribute('aria-expanded', String(s.panel !== 'peek'));
  title.addEventListener('click', up);
  // Peek: a way straight to the full text. Half and Full: one position down.
  const corner = s.panel !== 'peek' ? iconButton('chevron-down', c.w('close'), c.lower)
    : stop.locked || s.uncached === stop.id ? null : iconButton('file-text', c.w('transcript'), () => c.set({ panel: 'full', list: false }));
  const card = el('div', { className: 'run-card' }, keyed(iconButton('chevron-left', c.strings['web.ui.prevStop'], () => move(-1)), 'prev'),
    title, keyed(iconButton('chevron-right', c.strings['web.ui.nextStop'], () => move(1)), 'next'), corner && keyed(corner, 'corner'));
  swipe(card, { left: () => move(1), right: () => move(-1), up, down: c.lower });
  const grip = el('div', { className: 'run-grip' });
  grip.setAttribute('aria-hidden', 'true');
  const node = el('div', { className: 'run-sheet' }, grip, card, s.panel !== 'peek' && cardBody(c, stop));
  if (s.playing && !s.walkPaused) {
    // The line belongs to the story that plays, whatever card is open.
    const line = el('div', { className: 'progress' }, el('i'));
    line.firstChild.style.width = '38%';
    line.setAttribute('role', 'progressbar');
    line.setAttribute('aria-label', c.w('nowPlayingLabel'));
    line.setAttribute('aria-valuenow', '38');
    node.append(line);
  }
  node.append(dock(c, stop));
  return node;
}

function overlay(c) {
  const { s } = c;
  const close = () => c.set({ over: null });
  if (s.over === 'menu') {
    const pause = () => {
      c.sync('state', 'paused');
      c.set({ walkPaused: true, playing: null, audioPaused: false, me: null, over: null });
      c.say('Прагулка прыпынена: гук гіда спынены, пазіцыя больш не сочыцца, прагрэс захаваны.');
    };
    const guide = () => { close(); c.say('Адкрываецца спіс гідаў. Іншы гід пачынаецца толькі праз пытанне-пацвярджэнне; да яго прагулка не мяняецца.'); };
    const panel = el('div', { className: 'run-menu' },
      el('div', { className: 'run-menu-head' }, el('span', { textContent: c.n('menu') }), keyed(iconButton('x', c.w('close'), close), 'x')),
      !s.walkPaused && button(c.w('pauseWalk'), { iconName: 'circle-pause', block: true, onPress: pause }),
      button(c.w('endWalk'), { iconName: 'flag', block: true, onPress: () => c.set({ over: 'end' }) }),
      button(c.n('changeGuide'), { iconName: 'route', block: true, onPress: guide }));
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', c.n('menu'));
    const layer = el('div', { className: 'run-over' }, panel);
    layer.addEventListener('click', (event) => { if (event.target === layer) close(); });
    return layer;
  }
  if (s.over === 'end') {
    const accept = () => { close(); c.say('Прагулка завершаная: адкрываецца экран завяршэння (end.html). Завершаная прагулка не аднаўляецца.'); };
    const box = el('div', { className: 'run-dialog' }, el('p', { textContent: c.w('endConfirmTitle') }),
      el('div', {}, button(c.w('endConfirmCancel'), { onPress: close }), button(c.w('endConfirmAccept'), { kind: 'primary', onPress: accept })));
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-label', c.w('endConfirmTitle'));
    return el('div', { className: 'run-over center' }, box);
  }
  if (s.over === 'photo') {
    const turn = (step) => c.set({ photo: (s.photo + step + PHOTOS) % PHOTOS });
    const large = el('div', { className: 'run-large' }, icon('image', 56));
    large.setAttribute('role', 'img');
    large.setAttribute('aria-label', c.n('photo', s.photo + 1));
    const stage = el('div', { className: 'run-stage' }, keyed(iconButton('chevron-left', c.n('prevPhoto'), () => turn(-1)), 'photo-prev'),
      large, keyed(iconButton('chevron-right', c.n('nextPhoto'), () => turn(1)), 'photo-next'));
    swipe(stage, { left: () => turn(1), right: () => turn(-1) });
    const pager = el('div', { className: 'run-pager' }, ...Array.from({ length: PHOTOS }, (_, index) => el('i', { className: index === s.photo ? 'on' : '' })));
    pager.setAttribute('aria-hidden', 'true');
    return el('div', { className: 'run-viewer' },
      el('div', { className: 'run-viewer-top' }, el('span', { textContent: `${s.photo + 1} / ${PHOTOS}` }), keyed(iconButton('x', c.w('close'), close), 'x')), stage, pager);
  }
  return null;
}

function render(c) {
  const { root, s } = c;
  const held = root.contains(document.activeElement) ? document.activeElement.dataset.k : null;
  root.dataset.panel = s.panel;
  const stop = stopOf(s.inspected);
  const list = keyed(iconButton('list', c.w('points'), () => c.set({ list: s.panel === 'peek' || !s.list, panel: s.panel === 'peek' ? 'half' : s.panel })), 'list');
  // Back is navigation: one position down, and from Peek out of the screen.
  const bar = topbar({ title: GUIDE, backLabel: c.strings['native.chrome.back'], right: [list], onBack: () => {
    if (s.panel !== 'peek') c.lower();
    else c.say('Back выходзіць з прагулкі туды, адкуль прыйшлі. Гук і прагулка не мяняюцца.');
  } });
  bar.querySelector('.title').classList.add('t-display');
  const { map, place } = mapLayer(c);
  root.replaceChildren(...[bar, map, sheet(c, stop), adZone(c.ad), overlay(c)].filter(Boolean));
  place();
  if (held) root.querySelector(`[data-k="${held}"]`)?.focus();
}

// One state for both phones of a draw; the light phone is always built first.
let shared = null;

await mountBoard({
  controls: [
    { id: 'state', label: 'Стан прагулкі', options: [['between', 'Паміж кропкамі'], ['arrived', 'Прыйшлі да кропкі — гучыць'], ['finished', 'Гісторыя скончылася'], ['paused', 'Прагулка прыпынена'], ['denied', 'Пазіцыя не дазволена (GPS)'], ['uncached', 'Кропка не загружана, сеткі няма']] },
    { id: 'panel', label: 'Панэль', options: [['peek', 'Згорнутая (Peek)'], ['half', 'З апісаннем (Half)'], ['full', 'З поўным тэкстам (Full)']] },
    { id: 'ad', label: 'Банер', options: [['loaded', 'Загрузіўся'], ['none', 'Не загрузіўся']] },
  ],
  stringIds: STRING_IDS,
  build({ body, state, strings, say, theme }) {
    if (theme === 'light' || !shared) {
      const preset = PRESETS[state.state];
      shared = { ...preset, origin: state.state, heard: new Set(preset.heard), fired: new Set(preset.fired), audioPaused: false,
        walkPaused: Boolean(preset.walkPaused), denied: Boolean(preset.denied), list: Boolean(preset.list), uncached: preset.uncached ?? null,
        panel: state.panel, over: null, photo: 0, large: false, views: new Set() };
    }
    const s = shared;
    const root = el('div', { className: 'run-root' });
    body.append(root);
    // Keeps the board switch in step with what was done inside the phone.
    const sync = (id, value) => { state[id] = value; const select = document.getElementById(id); if (select) select.value = value; };
    const set = (patch) => { Object.assign(s, patch); if (state.panel !== s.panel) sync('panel', s.panel); for (const view of s.views) view(); };
    const c = {
      root, s, set, sync, say, strings, locale: state.locale, ad: state.ad === 'loaded',
      w: (key) => strings[RUN(key)],
      n: (key, number) => NEW[key][state.locale].replace('{n}', number).replace('{total}', PHOTOS),
      lower: () => { if (s.panel !== 'peek') set({ panel: s.panel === 'full' ? 'half' : 'peek', list: s.panel === 'full' && s.list }); },
    };
    const view = () => render(c);
    s.views.add(view);
    view();
    return () => s.views.delete(view);
  },
});
