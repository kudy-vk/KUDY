// The place card (app/place/[id].tsx): the public projection of one place, its
// Moment teaser with an explicit Play, the link to the guide's preview and the
// place rating as an explicit action. States follow
// docs/design/screens-and-transitions.md «Place card»: the card exists only
// for a published place, uses no GPS and reads the same facts from the cache.
import { button, el, icon, mountBoard } from './kit.mjs';
import { codes, discoveryContent, langOf, openPage, pick, prose, remark, sr } from './offers.mjs';

const S = {
  place: 'native.nearby.placeLabel', back: 'native.chrome.back', walk: 'native.chrome.walk',
  cache: 'native.chrome.validCache', free: 'native.chrome.access.free',
  text: 'native.place.textLabel', audio: 'native.place.audioLabel',
  unit: 'native.place.durationUnit', duration: 'native.chrome.durationLabel',
  teaser: 'native.place.teaserLabel', play: 'native.place.playLabel', stop: 'native.place.stopLabel',
  live: 'native.place.nowPlaying', preview: 'native.place.guideLink', noTeasers: 'native.place.empty',
  rate: 'native.feedback.ratePlace',
};

// A new string: the app has no record for it yet. A proposal that needs a
// native-speaker review before it enters the contract.
const CONDITIONS = {
  be: 'Умовы', en: 'Conditions', uk: 'Умови', de: 'Bedingungen', es: 'Condiciones',
  fr: 'Conditions', cs: 'Podmínky', sv: 'Villkor',
};

const OFFER_ID = 'offer-place-gdansk-highgate';
const content = discoveryContent().then(([index]) => index);

// Mockup fixtures, not content. Recorded audio languages are a fact of the
// published index; the content has no Moment teasers yet, so this one restates
// the published annotation and adds no fact of its own.
const AUDIO = ['be'];
const MOMENT = 'Ад гэтай брамы галоўная вуліца вядзе да Доўгага рынку. Кароткая гісторыя перад першымі крокамі.';


// The teaser of this place. Nothing sounds until Play is pressed.
function momentCard({ t, title, say }) {
  let playing = false;
  const play = el('button', { className: 'btn primary playbtn', type: 'button' });
  const live = el('p', { className: 'moment-live', textContent: t('live') });
  live.setAttribute('role', 'status');
  const paint = () => {
    play.replaceChildren(icon(playing ? 'square' : 'play', 20));
    play.setAttribute('aria-label', t(playing ? 'stop' : 'play'));
    live.hidden = !playing;
  };
  play.addEventListener('click', () => {
    playing = !playing;
    paint();
    say(playing
      ? `Тэйзер месца «${title}» грае на адзіным плэеры — толькі пасля яўнага націску. Стан прагулкі не мяняецца.`
      : `Тэйзер месца «${title}» спынены.`);
  });
  paint();
  const preview = el('button', { className: 'textlink', type: 'button' }, t('preview'), icon('chevron-right', 16));
  preview.addEventListener('click', () => say('Адкрываецца прэв\'ю гіда, не запуск прагулкі. Назад вяртае на картку месца.'));
  const text = el('p', { className: 'moment-text', textContent: MOMENT });
  text.lang = 'be';
  return el('div', { className: 'card moment moment-card' }, play,
    el('div', { className: 'moment-body' }, el('p', { className: 'moment-label', textContent: t('teaser') }), text, live, preview));
}

await mountBoard({
  controls: [
    { id: 'view', label: 'Стан', options: [['ready', 'Звычайны'], ['offline', 'Без сеткі, з кэша']] },
    { id: 'teaser', label: 'Тэйзер', options: [['yes', 'Ёсць'], ['no', 'Няма']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
  ],
  stringIds: Object.values(S),
  async build({ body, state, strings, say }) {
    const index = await content;
    const offer = index.offers.find((entry) => entry.offer_id === OFFER_ID);
    const t = (key) => strings[S[key]];
    const locale = state.locale;
    const title = pick(offer.localized.title, locale);

    const page = openPage(body, {
      title: t('place'),
      backLabel: t('back'),
      backText: 'Назад: вяртанне на экран, з якога адкрылі картку. Прагулка і гук не мяняюцца.',
      walkLabel: state.walk === 'yes' ? t('walk') : null,
      cacheText: state.view === 'offline' ? t('cache') : null,
      say,
    });

    const hero = el('div', { className: 'hero' }, icon('image', 28));
    hero.setAttribute('aria-hidden', 'true');
    const name = el('h3', { className: 'name', textContent: title });
    name.lang = langOf(offer.localized.title, locale);
    const range = offer.estimated_duration;
    const meta = el('div', { className: 'meta' },
      el('span', { className: 'facts' },
        el('span', { className: 'fact' }, icon('map-pin', 16)),
        el('span', { className: 'fact' }, icon('clock', 16), sr(`${t('duration')}: `), `${range.min_minutes}–${range.max_minutes} ${t('unit')}`),
        el('span', { className: 'fact' }, icon('book-open', 16), sr(`${t('text')}: `), codes(Object.keys(offer.localized.title))),
        el('span', { className: 'fact' }, icon('headphones', 16), sr(`${t('audio')}: `), codes(AUDIO))),
      el('span', { className: 'tag free', textContent: t('free') }));
    page.append(hero, name, meta,
      prose('summary', offer.localized.summary, locale),
      prose('why', offer.localized.why_recommended, locale),
      // Confirmed conditions are never hidden (20 §5).
      remark('info', CONDITIONS[locale], offer.localized.conditions, locale));

    page.append(state.teaser === 'yes'
      ? momentCard({ t, title, say })
      : el('p', { className: 't-secondary', textContent: t('noTeasers') }));

    // The visitor's own rating: an explicit action, never asked for by the card itself.
    const rate = button(t('rate'), {
      iconName: 'star', block: true,
      onPress: () => say('Спачатку пытанне «Ці быў ты тут?»; пасля «Быў тут — ацаніць» адкрываецца форма ацэнкі месца. Гэта часовая паверхня: Назад з яе вяртае на картку, пропуск нічога не запісвае.'),
    });
    rate.classList.add('rate');
    page.append(rate);
    body.append(page);
  },
});
