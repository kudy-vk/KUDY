// Five design *proposals* for the airport direction switch in the HTML
// catalog copy #257. They are not wired into about-257.mjs until owner approval.
// Icons and tokens come from the production kit, not a separate icon library.
import { icon, el } from './kit.mjs';
import { airportFlightIcon, airportCityRouteIcon } from './about-257-flight-icons.mjs';

export const DIRECTION_VARIANTS = [
  {
    id: 'arrows',
    title: 'Стрэлка + самалёт',
    description: 'Звычайны двухпазіцыйны пераключальнік KUDY. Змяняюцца толькі значкі.',
    caveat: 'Найменшая змена да цяперашняга экрана.',
  },
  {
    id: 'flight',
    title: 'Узлёт і пасадка',
    description: 'Папярэдні варыянт №2: пасадка з аэрапорта і ўзлёт у аэрапорт. Контур самалёта — з канона KUDY.',
    caveat: 'Гістарычны выбар. Заменены больш відавочным маршрутам «горад / самалёт».',
  },
  {
    id: 'route',
    title: 'Горад → самалёт / самалёт → горад',
    description: 'Дзве вектарныя SVG без кругоў: каляровы Гданьск і блакітны самалёт з вельмі тонкай абводкай. Танчэйшая стрэлка і светла-бронзавы градыент без ніжняй палоскі.',
    caveat: 'Абноўлены графічны варыянт у копіі экрана «Пра горад» #257; візуальны вердыкт яшчэ патрэбны.',
  },
  {
    id: 'centre',
    title: 'Адзін самалёт, дзве стрэлкі',
    description: 'Самалёт нерухомы ў цэнтры. Накірунак выбіраецца стрэлкай злева ці справа.',
    caveat: 'Кампактна, але налева і направа — не заўсёды відавочна «з / у».',
  },
  {
    id: 'medals',
    title: 'Два медальёны KUDY',
    description: 'Тая ж ручная мова контураў, што ў коле «Пра горад», са стрэлкамі на самалётах.',
    caveat: 'Візуальна блізка да брэнда, але дадае яшчэ два медальёны побач з асноўным колам.',
  },
];

const labels = {
  from: 'З аэрапорта',
  to: 'У аэрапорт',
};
const variantsRoot = document.querySelector('#directions');
const themeButtons = [...document.querySelectorAll('[data-set-theme]')];
if (!variantsRoot) throw new Error('Missing #directions preview host');

function glyph(name, size = 23, classes = '') {
  const node = icon(name, size);
  for (const name of classes.split(' ').filter(Boolean)) node.classList.add(name);
  return node;
}
function cell(className, ...children) { return el('span', { className }, ...children); }

function arrow(dir, size = 19) {
  return glyph('arrow-left', size, dir === 'to' ? 'r180' : '');
}

function basicVisual(direction) {
  return el('span', { className: 'glyph-row' },
    ...(direction === 'from'
      ? [arrow('from'), glyph('plane')]
      : [glyph('plane'), arrow('to')]));
}

function flightVisual(direction) {
  return cell('flight-symbol', airportFlightIcon(direction));
}

function routeVisual(direction) {
  return cell('glyph-row', airportCityRouteIcon(direction));
}

function medalVisual(direction) {
  return el('span', { className: 'glyph-row' },
    glyph('plane', 26),
    cell('corner-arrow', arrow(direction, 17)));
}

function button(direction, content) {
  const node = el('button', { type: 'button' }, content);
  node.setAttribute('role', 'radio');
  node.setAttribute('aria-label', labels[direction]);
  node.dataset.direction = direction;
  return node;
}

function controlFor(kind) {
  const roleProps = { className: 'direction-control v' + ({
    arrows: 1, flight: 2, route: 3, centre: 4, medals: 5,
  })[kind] };

  const left = button('from', kind === 'arrows' ? basicVisual('from')
    : kind === 'flight' ? flightVisual('from')
    : kind === 'route' ? routeVisual('from')
    : kind === 'centre' ? arrow('from', 26) : medalVisual('from'));
  const right = button('to', kind === 'arrows' ? basicVisual('to')
    : kind === 'flight' ? flightVisual('to')
    : kind === 'route' ? routeVisual('to')
    : kind === 'centre' ? arrow('to', 26) : medalVisual('to'));
  const centre = kind === 'centre' ? cell('centre-plane', glyph('plane', 27)) : null;
  const group = el('div', roleProps, left, ...(centre ? [centre] : []), right);
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Кірунак паездкі');
  return group;
}

function makeExample(variant, index) {
  const heading = el('div', { className: 'option-heading' },
    el('b', { textContent: String(index + 1).padStart(2, '0') }),
    el('h2', { id: 'variant-' + variant.id, textContent: variant.title }));
  const control = controlFor(variant.id);

  const previewSteps = el('div', { className: 'preview-steps' },
    el('span', { textContent: 'Выйдзі з тэрмінала' }),
    el('span', { textContent: 'Выберы рэйс' }),
    el('span', { textContent: 'Вазьмі білет' }));
  const state = el('div', { className: 'preview-state', ariaLive: 'polite' });

  const medallion = el('span', { className: 'sample-medallion' }, glyph('plane', 27));
  const phone = el('div', { className: 'sample-phone' },
    el('div', { className: 'sample-top' },
      cell('back', glyph('arrow-left', 22)),
      el('span', { textContent: 'Пра горад' })),
    el('div', { className: 'sample-wheel' },
      medallion, el('b', { textContent: 'Аэрапорт' })),
    el('div', { className: 'sample-content' },
      el('h3', { textContent: 'З аэрапорта і назад' }),
      control, state, previewSteps));

  phone.dataset.theme = 'light';
  previewSteps.setAttribute('aria-hidden', 'true');
  state.setAttribute('aria-live', 'polite');

  function setDirection(next, focus = false) {
    const radioButtons = [...control.querySelectorAll('[role="radio"]')];
    for (const radio of radioButtons) {
      const selected = radio.dataset.direction === next;
      radio.setAttribute('aria-checked', String(selected));
      radio.tabIndex = selected ? 0 : -1;
    }
    state.textContent = 'Абраны кірунак: ' + labels[next];
    previewSteps.firstElementChild.textContent =
      next === 'from' ? 'Выйдзі з тэрмінала' : 'Дабярыся да прыпынку';
    if (focus) control.querySelector('[aria-checked="true"]').focus();
  }

  control.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-direction]');
    if (button) setDirection(button.dataset.direction);
  });
  control.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    setDirection(event.key === 'ArrowRight' ? 'to' : 'from', true);
  });
  setDirection('from');

  const option = el('section', { className: 'option' },
    heading,
    el('p', { textContent: variant.description }),
    phone,
    el('p', { textContent: variant.caveat }));
  option.setAttribute('aria-labelledby', heading.lastElementChild.id);
  if (variant.id === 'route') option.classList.add('owner-chosen');
  return option;
}

for (const [i, variant] of DIRECTION_VARIANTS.entries()) {
  variantsRoot.append(makeExample(variant, i));
}

function setTheme(theme) {
  for (const phone of document.querySelectorAll('.sample-phone')) {
    phone.dataset.theme = theme;
  }
  for (const control of themeButtons) {
    control.setAttribute('aria-pressed', String(control.dataset.setTheme === theme));
  }
}
for (const control of themeButtons) {
  control.addEventListener('click', () => setTheme(control.dataset.setTheme));
}
