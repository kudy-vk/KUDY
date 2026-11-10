// The collection card (app/collection/[id].tsx): an editorial group of links —
// its description and the cards of its members. A collection starts no walk,
// is not a purchase and has no audio, so the screen has no main button and no
// «listen» control (NAV11, D07). With a paid member it carries the `mixed`
// mark and opens nothing of the paid content. States follow
// docs/design/screens-and-transitions.md «Collection card (падборка)».
import { el, icon, mountBoard, topbar, walkButton } from './kit.mjs';
import { codes, discoveryContent, langOf, offerCard, pick, prose, readOffers, remark, sr } from './offers.mjs';

const S = {
  back: 'native.chrome.back', walk: 'native.chrome.walk',
  guide: 'native.nearby.guideLabel', place: 'native.nearby.placeLabel',
  text: 'native.nearby.textLabel', audio: 'native.nearby.audioLabel',
  unit: 'native.nearby.durationUnit', duration: 'native.chrome.durationLabel',
  free: 'native.chrome.access.free', paid: 'native.chrome.access.paid', mixed: 'native.chrome.access.mixed',
};

// New strings: the app has no records for them yet. Proposals that need a
// native-speaker review before they enter the contract.
const COLLECTION = {
  be: 'Падборка', en: 'Collection', uk: 'Добірка', de: 'Sammlung', es: 'Selección',
  fr: 'Sélection', cs: 'Výběr', sv: 'Urval',
};
const CONDITIONS = {
  be: 'Умовы', en: 'Conditions', uk: 'Умови', de: 'Bedingungen', es: 'Condiciones',
  fr: 'Conditions', cs: 'Podmínky', sv: 'Villkor',
};


// The real collection, its members and their texts come from the published discovery sources.
const content = discoveryContent();

const COLLECTION_ID = 'collection-gdansk-halfday';
// Mockup fixtures, not content. Recorded audio languages are a fact of the
// published index, not of the source files.
const AUDIO = { 'offer-guide-gdansk-first-walk': ['be', 'en'], 'offer-place-gdansk-highgate': ['be'] };
// Synthetic test items: the content has one collection, and it has a paid
// member. The texts below restate published annotations and add no fact.
const TOWNHALL = {
  id: 'offer-place-gdansk-townhall', kind: 'place', duration: null, textLocales: ['be'], audioLocales: [], access: 'free',
  text: { title: { be: 'Ратуша' }, summary: { be: 'Стартавае месца гіда: ратуша з вытанчаным шпілем.' } },
};
const OVERLAP_NOTE = { be: 'Ратуша — стартавае месца гіда: яна ёсць і ў гідзе, і асобнай карткай.' };
const FREE_ONLY = {
  title: { be: 'Брама і манастыр (тэставая падборка)' },
  description: { be: 'Тэставая падборка для макета: два бясплатныя месцы старога горада, без гіда.' },
  members: ['offer-place-gdansk-highgate', 'offer-place-gdansk-franciscan'],
};


// What the screen shows in each board state.
function collectionView(view, index, offers) {
  const byId = new Map(offers.map((offer) => [offer.id, offer]));
  if (view === 'free') {
    return { title: FREE_ONLY.title, description: FREE_ONLY.description, members: FREE_ONLY.members.map((id) => byId.get(id)), textLocales: ['be'] };
  }
  const collection = index.collections.find((entry) => entry.collection_id === COLLECTION_ID);
  const own = offers.find((offer) => offer.kind === 'collection' && offer.ref.collection_id === COLLECTION_ID);
  const sameRef = (ref, member) => ref.kind === member.kind && (ref.route_id ?? ref.place_id) === (member.route_id ?? member.place_id);
  const members = collection.members.map((member) => offers.find((offer) => sameRef(offer.ref, member)));
  // The overlap state adds the guide's start place right after the guide.
  if (view === 'overlap') members.splice(1, 0, TOWNHALL);
  return {
    title: collection.localized.title, description: collection.localized.description,
    why: own.text.why_recommended, conditions: own.text.conditions, duration: own.duration,
    overlap: view === 'overlap' ? OVERLAP_NOTE : null,
    members, textLocales: own.textLocales,
  };
}

await mountBoard({
  controls: [
    { id: 'view', label: 'Склад', options: [
      ['mixed', 'З платным гідам (змешана)'], ['free', 'Толькі бясплатныя месцы'], ['overlap', 'З нататкай пра перасячэнне'],
    ] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: Object.values(S),
  async build({ body, state, strings, say }) {
    const [index, route] = await content;
    const t = (key) => strings[S[key]];
    const locale = state.locale;
    const view = collectionView(state.view, index, readOffers(index, route, AUDIO));
    // The rule of 21 §3.2: mixed with any paid member, free otherwise.
    const access = view.members.some((member) => member.access !== 'free') ? 'mixed' : 'free';
    const titleOf = (offer) => pick(offer.text.title, locale);
    const open = (offer) => say(offer.kind === 'guide'
      ? `Адкрываецца прэв'ю гіда «${titleOf(offer)}». Падборка не адкрывае платны змест: пакупка, загрузка і пачатак прагулкі — асобныя дзеянні на прэв'ю. Назад вяртае ў падборку.`
      : `Адкрываецца картка месца «${titleOf(offer)}». Назад вяртае ў падборку.`);

    body.append(topbar({
      title: COLLECTION[locale],
      backLabel: t('back'),
      onBack: () => say('Назад: вяртанне на экран, з якога адкрылі падборку. Прагулка і гук не мяняюцца.'),
      right: state.walk === 'yes' ? [walkButton(t('walk'), () => say(`Вяртанне да бягучай прагулкі («${t('walk')}») у ранейшым становішчы панэлі.`))] : [],
    }));

    const page = el('div', { className: 'page scroll' });
    const name = el('h3', { className: 'name', textContent: pick(view.title, locale) });
    name.lang = langOf(view.title, locale);
    // A collection has no audio of its own, so it shows text languages only.
    const meta = el('div', { className: 'meta' },
      el('span', { className: 'facts' },
        el('span', { className: 'fact' }, icon('layers', 16)),
        view.duration && el('span', { className: 'fact' }, icon('clock', 16), sr(`${t('duration')}: `), `${view.duration.min_minutes}–${view.duration.max_minutes} ${t('unit')}`),
        el('span', { className: 'fact' }, icon('book-open', 16), sr(`${t('text')}: `), codes(view.textLocales))),
      el('span', { className: `tag ${access}`, textContent: t(access) }));
    page.append(name, meta, prose('description', view.description, locale));
    if (view.why) page.append(prose('why', view.why, locale));
    // Confirmed conditions are never hidden (20 §5); here they also say that the
    // collection unlocks nothing of the paid guide.
    if (view.conditions) page.append(remark('info', CONDITIONS[locale], view.conditions, locale));
    if (view.overlap) page.append(remark('circle-alert', null, view.overlap, locale, ' overlap'));

    const members = el('ul', { className: 'members' }, ...view.members.map((member) => el('li', {}, offerCard(member, { t, locale, onOpen: open }))));
    page.append(members);
    body.append(page);
  },
});
