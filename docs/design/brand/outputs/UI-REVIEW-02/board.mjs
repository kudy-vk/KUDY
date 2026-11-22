import { el, icon, mountBoard } from '../../../production/kit.mjs';

const proposal = {
  a: { back: 'arrow-left', backStyle: 'bare', walk: 'footprints', walkStyle: 'filled' },
  b: { back: 'arrow-left', backStyle: 'outline', walk: 'footprints', walkStyle: 'outline' },
  c: { back: 'arrow-left', backStyle: 'tinted', walk: 'navigation', walkStyle: 'tinted squared' },
};
const titleByLocale = {
  be: 'Падрабязнасці маршруту па Гданьску',
  en: 'Details of the Gdańsk walking route',
  uk: 'Подробиці маршруту Гданськом',
  de: 'Details des Stadtrundgangs in Danzig',
  pl: 'Szczegóły trasy spaceru po Gdańsku',
};
const stateByLocale = {
  be: { active: 'Прагулка ідзе', paused: 'Прагулка на паўзе', none: 'Няма прагулкі' },
  en: { active: 'Walk active', paused: 'Walk paused', none: 'No walk' },
};
const trueRunState = (state) => state.walk === 'active' || state.walk === 'paused';
const visibleShortcut = (state) => trueRunState(state) && state.screen !== 'run';

function control(name, style, label, message, say) {
  const node = el('button', { type: 'button', className: 'control ' + style, title: label },
    el('span', { className: 'circle' }, icon(name, 22)));
  node.setAttribute('aria-label', label);
  node.addEventListener('click', () => say(message));
  return node;
}

await mountBoard({
  controls: [
    { id: 'variant', label: 'Варыянт', options: [['a', 'A · Класічны'], ['b', 'B · Сіметрычны'], ['c', 'C · Куты']] },
    { id: 'walk', label: 'Стан прагулкі', options: [['active', 'Ідзе'], ['paused', 'На паўзе'], ['none', 'Няма / завершана']] },
    { id: 'screen', label: 'Экран', options: [['other', 'Унутраны экран'], ['run', 'Run']] },
    { id: 'extra', label: 'Яшчэ кнопка', options: [['yes', 'Ёсць (info)'], ['no', 'Няма']] },
  ],
  stringIds: ['native.chrome.back', 'native.chrome.walk', 'native.chrome.guidesLink', 'native.place.resumeLabel'],
  build({ body, state, strings, say }) {
    const variant = proposal[state.variant];
    const isRun = state.screen === 'run';
    const shortcut = visibleShortcut(state);
    const title = isRun ? strings['native.chrome.walk'] : (titleByLocale[state.locale] || titleByLocale.en);
    const labelBack = strings['native.chrome.back'];
    const labelWalk = strings['native.place.resumeLabel'] + ' · ' + strings['native.chrome.walk'];
    const bar = el('header', { className: 'proposal-header variant-' + state.variant });
    bar.append(control(variant.back, variant.backStyle, labelBack,
      'Back: вярнуцца на паверхню-крыніцу; прагулка і аўдыё не спыняюцца.', say));
    const heading = el('h2', { className: 'title', textContent: title, title });
    bar.append(heading);

    // The extra page action is hidden on the narrowest large-text layout; no overlap.
    const narrow = Number(state.device.split('x')[0]) === 320 && Number(state.scale) > 1;
    if (state.extra === 'yes' && !narrow && !isRun) {
      bar.append(control('info', 'more', 'Інфармацыя', 'Адкрыць звесткі пра экран.', say));
    }
    if (shortcut) {
      bar.append(control(variant.walk, variant.walkStyle, labelWalk,
        'Run: вярнуцца ў ранейшае становішча панэлі, не запускаючы гук.', say));
    }
    body.append(bar);
    const status = (stateByLocale[state.locale] || stateByLocale.en)[state.walk];
    const context = el('section', { className: 'screen-example' },
      el('span', { className: 'eyebrow', textContent: 'KUDY · UI-REVIEW-02' }),
      el('span', { className: 'state-pill', textContent: status }),
      el('div', { className: 'card' },
        el('strong', { textContent: title }),
        el('div', { className: 'line' }),
        el('div', { className: 'line short' }),
        el('div', { className: 'line' })));
    body.append(context);
    if (narrow && state.extra === 'yes') {
      body.append(el('p', { className: 't-small', style: 'padding:0 20px;' },
        'На 320 dp з буйным тэкстам дадатковае дзеянне схавана з шапкі: патрэбна асобнае рашэнне пра доступ да яго.'));
    }
  },
});
export { visibleShortcut, proposal };
