// The KUDY surface (route app/(tabs)/my.tsx; the outward name is «KUDY»):
// the walk in progress, downloads and storage, own ratings with their honest
// delivery states, and the walk history — one immutable row per session.
// Structure and string ids follow the live screen; the interface language
// control has moved to Settings (issue G27.02), so here is one row that opens it.
import { button, el, icon, iconButton, LOCALES, mountBoard, registerIcons, topbar, walkButton } from './kit.mjs';

// Lucide shape this screen alone needs (lucide-react-native, ISC).
registerIcons({
  pencil: [['path', { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' }], ['path', { d: 'm15 5 4 4' }]],
});

const C = 'native.chrome.', F = 'native.feedback.';
const STRING_IDS = [
  ...['back', 'myKudy', 'walk', 'currentWalk', 'noCurrentWalk', 'pastWalks', 'noPastWalks', 'heardCount', 'sizeMb',
    'historyUnavailable', 'retry', 'stateLabel.active', 'stateLabel.paused', 'stateLabel.finished'].map((key) => C + key),
  ...['mySection', 'myEmpty', 'myEdit', 'guideWord', 'ratingOf', 'targetLine', 'resolveConflict', 'stateDraft',
    'statePending', 'stateSent', 'stateConflict', 'stateActionRequired', 'stateDeletePending'].map((key) => F + key),
];

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
// SETTINGS, THEME_SYSTEM and DOWNLOADS repeat the Settings screen's proposals.
const SETTINGS = {
  be: 'Налады', en: 'Settings', uk: 'Налаштування', de: 'Einstellungen', es: 'Ajustes',
  fr: 'Réglages', cs: 'Nastavení', sv: 'Inställningar',
};
const THEME_SYSTEM = {
  be: 'Як у прылады', en: 'Same as device', uk: 'Як у пристрої', de: 'Wie am Gerät', es: 'Como el dispositivo',
  fr: 'Comme l’appareil', cs: 'Podle zařízení', sv: 'Som enheten',
};
const DOWNLOADS = {
  be: 'Загрузкі і сховішча', en: 'Downloads and storage', uk: 'Завантаження і сховище', de: 'Downloads und Speicher',
  es: 'Descargas y almacenamiento', fr: 'Téléchargements et stockage', cs: 'Stažené soubory a úložiště', sv: 'Nedladdningar och lagring',
};
const NO_DOWNLOADS = {
  be: 'Загрузак няма', en: 'No downloads', uk: 'Завантажень немає', de: 'Keine Downloads', es: 'No hay descargas',
  fr: 'Aucun téléchargement', cs: 'Žádné stažené soubory', sv: 'Inga nedladdningar',
};
const DELETE_DOWNLOAD = {
  be: 'Выдаліць загрузку', en: 'Delete download', uk: 'Видалити завантаження', de: 'Download löschen', es: 'Borrar la descarga',
  fr: 'Supprimer le téléchargement', cs: 'Smazat stažený soubor', sv: 'Radera nedladdningen',
};
const IN_USE = {
  be: 'Ідзе прагулка — выдаліць нельга', en: 'The current walk uses it — it cannot be deleted',
  uk: 'Триває прогулянка — видалити не можна', de: 'Der aktuelle Rundgang nutzt ihn — Löschen nicht möglich',
  es: 'El recorrido actual la usa: no se puede borrar', fr: 'La visite en cours l’utilise — suppression impossible',
  cs: 'Používá ji aktuální procházka — nelze smazat', sv: 'Den aktuella promenaden använder den — kan inte raderas',
};

// Sample content. Guide titles are content, not interface: they stay Belarusian.
const GUIDES = { quay: 'Гісторыі набярэжнай', amber: 'Бурштынавы шлях', gates: 'Ад брамы да брамы' };
const LIVE = { guide: 'quay', from: '2026-11-10', heard: 3, locale: 'be' };
const PAST = [
  { guide: 'amber', state: 'finished', from: '2026-11-08', to: '2026-11-08', heard: 7, locale: 'be' },
  { guide: 'gates', state: 'finished', from: '2026-11-02', to: '2026-11-03', heard: 12, locale: 'en' },
  { guide: 'quay', state: 'finished', from: '2026-10-27', to: '2026-10-27', heard: 2, locale: 'be' },
];
const STORED = [{ guide: 'quay', mb: 84 }, { guide: 'amber', mb: 128 }];
const SENT = { guide: 'gates', score: 4, locale: 'en', version: '2', delivery: 'sent' };
const RATINGS = {
  history: [{ guide: 'amber', score: 5, locale: 'be', version: '3', delivery: 'sent' }, SENT],
  pending: [
    { guide: 'quay', score: 4, locale: 'be', version: '5', delivery: 'draft' },
    { guide: 'amber', score: 5, locale: 'be', version: '3', delivery: 'pending' },
    { guide: 'gates', score: null, locale: 'en', version: '2', delivery: 'deletePending' },
  ],
  conflict: [{ guide: 'amber', score: 3, locale: 'be', version: '3', delivery: 'conflict' }, SENT],
  action: [{ guide: 'amber', score: 5, locale: 'be', version: '3', delivery: 'actionRequired' }, SENT],
};

// Delivery states word for word from 21 §5.4. `sending` has no string in the
// contract yet, so the mockup does not show it.
const DELIVERY = {
  draft: { id: `${F}stateDraft`, icon: 'pencil', tone: 'plain' },
  pending: { id: `${F}statePending`, icon: 'wifi-off', tone: 'notice' },
  sent: { id: `${F}stateSent`, icon: 'check', tone: 'plain' },
  conflict: { id: `${F}stateConflict`, icon: 'circle-alert', tone: 'notice error' },
  actionRequired: { id: `${F}stateActionRequired`, icon: 'circle-alert', tone: 'notice error' },
  deletePending: { id: `${F}stateDeletePending`, icon: 'wifi-off', tone: 'notice' },
};
const STATE_TAG = { active: ['free', 'play'], paused: ['paid', 'pause'], finished: ['', 'check'] };

const fill = (text, values = {}) => text.replace(/\$\{(\w+)\}/g, (_, key) => values[key]);
const fact = (iconName, text) => el('span', { className: 'fact' }, icon(iconName, 14), text);
const section = (title, aside) => el('div', { className: 'sec' }, el('h3', { textContent: title }), aside && el('span', { textContent: aside }));
const rows = (items, emptyText) => (items.length
  ? el('div', { className: 'rows' }, ...items)
  : el('p', { className: 'empty', textContent: emptyText }));

// One session: the durable facts only — state, days, heard count, its own locale.
function sessionCard(session, s) {
  const [tone, glyph] = STATE_TAG[session.state];
  const days = session.to && session.to !== session.from ? `${session.from} — ${session.to}` : session.from;
  const locale = fact('languages', LOCALES[session.locale]);
  locale.lang = session.locale;
  return el('article', { className: 'card' },
    el('h4', { className: 'row-title t-display', textContent: GUIDES[session.guide] }),
    el('div', { className: 'facts' },
      el('span', { className: `tag ${tone}` }, icon(glyph, 12), s(`${C}stateLabel.${session.state}`)),
      fact('clock', days),
      fact('headphones', s(`${C}heardCount`, { count: session.heard })),
      locale));
}

function downloadCard(item, locked, { s, t, say }) {
  const title = GUIDES[item.guide];
  const remove = iconButton('trash', `${t(DELETE_DOWNLOAD)}: ${title}`, () => say(locked
    ? `Загрузку «${title}» выдаліць нельга: яе выкарыстоўвае бягучая прагулка. Прычына напісана ў радку.`
    : `Выдаленне загрузкі «${title}»: вызваляецца ${item.mb} МБ. Радкі гісторыі і ацэнкі застаюцца.`));
  if (locked) remove.setAttribute('aria-disabled', 'true');
  return el('article', { className: 'card split' },
    el('div', { className: 'grow' },
      el('h4', { className: 'row-title t-display', textContent: title }),
      el('div', { className: 'facts' }, fact('download', s(`${C}sizeMb`, { mb: item.mb }))),
      locked && el('p', { className: 'reason', textContent: t(IN_USE) })),
    remove);
}

function ratingCard(item, { s, say }) {
  const title = GUIDES[item.guide], delivery = DELIVERY[item.delivery];
  const stars = el('span', { className: 'stars' }, ...[1, 2, 3, 4, 5].map((n) => {
    const star = icon('star', 16);
    if (n <= item.score) star.classList.add('on');
    return star;
  }));
  stars.setAttribute('aria-hidden', 'true');
  const edit = iconButton('pencil', `${s(`${F}myEdit`)}: ${title}`, () => say(
    `Адкрываецца форма ацэнкі «${title}» — часовая паверхня; «Назад» вяртае ў KUDY.${
      item.delivery === 'conflict' ? ` Канфлікт вырашаецца ў форме кнопкай «${s(`${F}resolveConflict`)}»; сляпога паўтору няма.` : ''}`));
  return el('article', { className: 'card' },
    el('div', { className: 'split' },
      el('div', { className: 'grow' },
        el('span', { className: 't-small', textContent: s(`${F}guideWord`) }),
        el('h4', { className: 'row-title t-display', textContent: title })),
      edit),
    el('div', { className: 'facts' },
      // A rating whose deletion waits for the network has no desired value: a dash, as in the app.
      item.score === null ? el('span', { textContent: '—' }) : el('span', { className: 'fact' }, stars, s(`${F}ratingOf`, { score: item.score })),
      el('span', { textContent: s(`${F}targetLine`, { locale: item.locale, version: item.version }) })),
    el('p', { className: `delivery ${delivery.tone}` }, icon(delivery.icon, 16), el('span', { textContent: s(delivery.id) })));
}

await mountBoard({
  controls: [{
    id: 'view',
    label: 'Стан',
    options: [
      ['history', 'З гісторыяй'], ['empty', 'Пустая гісторыя'], ['active', 'Ідзе прагулка'], ['paused', 'Прагулка прыпынена'],
      ['pending', 'Ацэнкі чакаюць сеткі'], ['conflict', 'Канфлікт ацэнкі'], ['action', 'Адпраўка ацэнкі спынена'],
      ['unavailable', 'Гісторыя недаступная'],
    ],
  }],
  stringIds: STRING_IDS,
  build({ body, state, strings, say }) {
    const s = (id, values) => fill(strings[id], values);
    const t = (map) => map[state.locale];
    const ctx = { s, t, say };
    const view = state.view, empty = view === 'empty';
    const live = view === 'active' || view === 'paused' ? { ...LIVE, state: view } : null;

    const settings = el('button', { className: 'card nav-row', type: 'button' },
      icon('settings', 20),
      el('span', { className: 'grow' },
        el('span', { textContent: t(SETTINGS) }),
        el('span', { className: 't-secondary', textContent: `${LOCALES[state.locale]} · ${t(THEME_SYSTEM)}` })),
      icon('chevron-right', 20));
    settings.addEventListener('click', () => say('Адкрываецца экран «Налады»: мова інтэрфейсу, тэма і астатняе. «Назад» вяртае сюды.'));

    const content = el('div', { className: 'pad' }, settings);
    if (view === 'unavailable') {
      // A failed history read: no rows are invented, and there is a named way out.
      content.append(el('div', { className: 'notice error unavailable' },
        el('p', {}, icon('circle-alert', 18), el('span', { textContent: s(`${C}historyUnavailable`) })),
        button(s(`${C}retry`), { iconName: 'refresh-cw', onPress: () => say('Гісторыя чытаецца нанова; пры ўдачы з’яўляюцца радкі прагулак.') })));
    } else {
      content.append(section(s(`${C}currentWalk`)), rows(live ? [sessionCard(live, s)] : [], s(`${C}noCurrentWalk`)));
    }

    const stored = empty ? [] : STORED;
    const total = stored.reduce((sum, item) => sum + item.mb, 0);
    content.append(
      section(t(DOWNLOADS), stored.length ? s(`${C}sizeMb`, { mb: total }) : null),
      rows(stored.map((item) => downloadCard(item, live?.guide === item.guide, ctx)), t(NO_DOWNLOADS)),
      section(s(`${F}mySection`)),
      rows((empty ? [] : RATINGS[view] ?? RATINGS.history).map((item) => ratingCard(item, ctx)), s(`${F}myEmpty`)));

    // The history is last because it is the only list that keeps growing.
    if (view !== 'unavailable') {
      content.append(section(s(`${C}pastWalks`)), rows(empty ? [] : PAST.map((session) => sessionCard(session, s)), s(`${C}noPastWalks`)));
    }

    body.append(
      topbar({
        title: s(`${C}myKudy`),
        backLabel: s(`${C}back`),
        onBack: () => say('Назад: вяртанне на экран, з якога адкрылі KUDY. Прагулку і гук гэта не мяняе.'),
        right: live ? [walkButton(s(`${C}walk`), () => say(`Вяртанне да бягучай прагулкі («${s(`${C}walk`)}»): панэль у ранейшым становішчы.`))] : [],
      }),
      el('div', { className: 'scroll' }, content));
  },
});
