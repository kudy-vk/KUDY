// End of a walk (the finished session of app/run/[id].tsx): the result by the
// stories really heard, «Яшчэ можна адкрыць» and the optional rating invitation.
// Rules: docs/design/screens-and-transitions.md «End (завяршэнне)» and
// docs/11_run_interaction.md §4.3, §9, §16.7. Every string is the app's own.
import { button, el, icon, mountBoard, panorama, topbar } from './kit.mjs';

const IDS = {
  back: 'native.chrome.back',
  ended: 'native.run.endedTitle',
  heard: 'native.chrome.heardCount',
  more: 'native.run.missedStoriesTitle',
  base: 'native.run.storyBase',
  extended: 'native.run.storyExtended',
  inviteTitle: 'native.feedback.inviteTitle',
  inviteRate: 'native.feedback.inviteRate',
  inviteDismiss: 'native.feedback.inviteDismiss',
  pending: 'native.feedback.statePending',
  rating: 'native.feedback.ratingOf',
};

// Illustrative content: a made-up guide and made-up stories, the same as on the
// Run mockup. It is not real route content and stays Belarusian in every language.
const GUIDE = 'Шпацыр па старым горадзе';
// How many stories were heard; the screen shows the count, never the list of names.
const HEARD = 3;
// The unit of the list is a story, not a stop: an extra story of a heard stop
// is its own row; locked stories never appear here (11 §3.1).
const OPEN = [{ name: 'Брама', layer: 'base' }, { name: 'Плошча', layer: 'extended' }];
// The example rating that waits for the network in the «pending» state.
const RATED = 4;

await mountBoard({
  controls: [
    { id: 'more', label: 'Яшчэ можна адкрыць', options: [['yes', 'Ёсць гісторыі'], ['many', 'Шмат гісторый (20)'], ['no', 'Усё праслухана']] },
    { id: 'rating', label: 'Ацэнка', options: [['invite', 'Запрашэнне ацаніць'], ['none', 'Без запрашэння'], ['pending', 'Ацэнка чакае сеткі']] },
  ],
  stringIds: Object.values(IDS),
  build({ body, state, strings, say }) {
    const t = (key) => strings[IDS[key]];
    const bar = topbar({
      title: t('ended'),
      backLabel: t('back'),
      onBack: () => say('Back вяртае туды, адкуль адкрылі прагулку. Прагулка ўжо завершана і не аднаўляецца.'),
    });

    const open = state.more === 'no' ? [] : state.more === 'many'
      ? Array.from({ length: 20 }, (_, index) => ({ name: `Тэставая гісторыя ${index + 1}`, layer: index % 3 ? 'base' : 'extended' }))
      : OPEN;
    const share = el('div', { className: 'progress end-share' }, el('i'));
    share.firstChild.style.width = `${Math.round((HEARD / (HEARD + open.length)) * 100)}%`;
    share.setAttribute('aria-hidden', 'true');
    const badge = el('span', { className: 'end-badge' }, icon('check', 24));
    badge.setAttribute('aria-hidden', 'true');
    const hero = el('div', { className: 'end-hero' }, badge,
      el('h3', { className: 't-display', textContent: GUIDE }),
      el('span', { className: 'tag free' }, icon('headphones', 16), t('heard').replace('${count}', HEARD)),
      // A bar instead of a list of names: it reads the same for three stories and for thirty.
      share);
    const scroll = el('div', { className: 'end-scroll scroll' }, hero);

    if (open.length) {
      const list = el('ul', { className: 'end-list' });
      for (const story of open) {
        const layer = t(story.layer);
        const row = el('button', { className: 'card end-row', type: 'button' }, icon('book-open', 20),
          el('span', {}, el('span', { className: 't-display', textContent: story.name }), el('span', { className: 't-small', textContent: layer })),
          icon('chevron-right', 20));
        row.setAttribute('aria-label', `${story.name} — ${layer}`);
        row.addEventListener('click', () => say(`Адкрываецца картка гісторыі «${story.name}» з поўным тэкстам. Прагулка застаецца завершанай.`));
        list.append(el('li', {}, row));
      }
      scroll.append(el('h3', { className: 'sec', textContent: `${t('more')} · ${open.length}` }), list);
    }

    if (state.rating === 'invite') {
      // Optional and not modal, at most once per walk: either answer removes it.
      const invite = el('div', { className: 'card end-invite' });
      const leave = (text) => { invite.remove(); say(text); };
      invite.append(el('p', { textContent: t('inviteTitle') }), el('div', { className: 'end-actions' },
        button(t('inviteRate'), { iconName: 'star', onPress: () => leave('Адкрываецца форма ацэнкі (feedback.html). Back з формы вяртае сюды; другога запрашэння на гэтым экране не будзе.') }),
        button(t('inviteDismiss'), { onPress: () => leave('Запрашэнне схавана. Нічога не запісана і нічога не заблакавана.') })));
      scroll.append(invite);
    } else if (state.rating === 'pending') {
      // The rating was saved without a network: it waits honestly, nothing is lost.
      // The stars show which rating waits; their name is the app's «N з 5».
      const stars = el('span', { className: 'end-stars' }, ...[1, 2, 3, 4, 5].map((value) => {
        const star = icon('star', 16);
        if (value <= RATED) star.classList.add('on');
        return star;
      }));
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', t('rating').replace('${score}', RATED));
      const note = el('div', { className: 'notice end-pending' }, icon('clock', 18), el('div', {}, stars, el('span', { textContent: t('pending') })));
      note.setAttribute('role', 'status');
      scroll.append(note);
    }

    scroll.append(el('div', { className: 'end-rest' }, panorama()));
    body.append(bar, scroll);
  },
});
