// First-run language picker proposal (language-onboarding.html):
// Reuses the shared inertia wheel (`wheel` from `./about-wheel.mjs`) so all
// 13 interface languages stand as equal medallions on the ring with zero
// duplicated carousel physics.
import { adZone, el, icon, iconButton, LOCALES, mountBoard, panorama, registerIcons, svg } from './kit.mjs';
import { wheel } from './about-wheel.mjs';

registerIcons({
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
});

const LANG_META = {
  be: ['Хадзем, паглядзім · у сваім тэмпе', 'Гданьск', 'Куды сёння?', 'Выберы мову праграмы', 'Пакруці кола або націсні на медальён', 'Працягнуць па-беларуску', 'Мову заўсёды можна змяніць у «KUDY → Налады».'],
  en: ['Let’s go and see · at your own pace', 'Gdańsk', 'Where to today?', 'Choose app language', 'Spin the wheel or tap a medallion', 'Continue in English', 'You can change the language anytime in KUDY → Settings.'],
  pl: ['Chodźmy zobaczyć · we własnym tempie', 'Gdańsk', 'Dokąd dzisiaj?', 'Wybierz język aplikacji', 'Zakręć kołem lub dotknij medalionu', 'Kontynuuj po polsku', 'Język możesz zmienić w każdej chwili w KUDY → Ustawienia.'],
  uk: ['Ходімо подивимось · у своєму темпі', 'Гданськ', 'Куди сьогодні?', 'Обери мову застосунку', 'Прокрути коло або натисни на медальйон', 'Продовжити українською', 'Мову завжди можна змінити в «KUDY → Налаштування».'],
  de: ['Komm, schauen wir · in deinem Tempo', 'Danzig', 'Wohin heute?', 'App-Sprache wählen', 'Drehe das Rad oder tippe auf ein Medaillon', 'Weiter auf Deutsch', 'Die Sprache kann jederzeit in KUDY → Einstellungen geändert werden.'],
  es: ['Vamos a ver · a tu propio ritmo', 'Gdansk', '¿Adónde hoy?', 'Elige el idioma', 'Gira la rueda o toca un medallón', 'Continuar en español', 'Puedes cambiar el idioma en cualquier momento en KUDY → Ajustes.'],
  fr: ['Allons voir · à votre propre rythme', 'Gdańsk', 'Où aller aujourd’hui ?', 'Choisir la langue', 'Tournez la roue ou touchez un médaillon', 'Continuer en français', 'Modifiable à tout moment dans KUDY → Paramètres.'],
  cs: ['Pojďme se podívat · vlastním tempem', 'Gdaňsk', 'Kam dnes?', 'Vyberte jazyk aplikace', 'Otočte kolem nebo klepněte na medailon', 'Pokračovat česky', 'Jazyk lze kdykoli změnit v KUDY → Nastavení.'],
  sv: ['Kom, vi tittar · i din egen takt', 'Gdańsk', 'Vart i dag?', 'Välj språk i appen', 'Snurra hjulet eller tryck på en medaljong', 'Fortsätt på svenska', 'Språket kan ändras när som helst i KUDY → Inställningar.'],
  nb: ['Kom, la oss se · i ditt eget tempo', 'Gdańsk', 'Hvor i dag?', 'Velg appspråk', 'Snurr hjulet eller trykk på en medaljong', 'Fortsett på norsk', 'Du kan endre språket når som helst i KUDY → Innstillinger.'],
  da: ['Kom, lad os se · i dit eget tempo', 'Gdańsk', 'Hvorhen i dag?', 'Vælg appsprog', 'Drej hjulet eller tryk på en medaljon', 'Fortsæt på dansk', 'Sproget kan ændres når som helst i KUDY → Indstillinger.'],
  nl: ['Kom, laten we kijken · in je eigen tempo', 'Gdańsk', 'Waarheen vandaag?', 'Kies je taal', 'Draai aan het wiel of tik op een medaillon', 'Doorgaan in het Nederlands', 'Je kunt de taal altijd wijzigen in KUDY → Instellingen.'],
  pt: ['Vamos ver · ao seu próprio ritmo', 'Gdańsk', 'Para onde hoje?', 'Escolha o idioma', 'Gire a roda ou toque num medalhão', 'Continuar em português', 'Pode alterar o idioma a qualquer momento em KUDY → Definições.'],
};

const ALL_LANGS = Object.entries(LOCALES).map(([code, name]) => {
  const [greeting, city, where, title, sub, confirm, later] = LANG_META[code] ?? LANG_META.en;
  return { id: code, code: code.toUpperCase(), label: name, greeting, city, where, title, sub, confirm, later };
});

function menuPreviewSvg() {
  const coords = [
    ['M 55 35 L 145 25 L 155 95 L 70 110 Z', 102, 68, 'lo-piece'],
    ['M 185 30 L 295 40 L 280 115 L 175 100 Z', 235, 74, 'lo-piece'],
    ['M 45 130 L 145 122 L 152 195 L 55 205 Z', 98, 162, 'lo-piece'],
    ['M 178 125 L 295 132 L 285 205 L 170 198 Z', 232, 165, 'lo-piece'],
    ['M 115 215 L 225 212 L 218 268 L 110 265 Z', 166, 240, 'lo-piece off'],
  ];
  return svg('svg', { viewBox: '0 0 340 290', class: 'lo-map-svg', 'aria-hidden': 'true' },
    ...coords.map(([d, cx, cy, cls]) =>
      svg('g', { class: cls },
        svg('path', { d, class: 'lo-piece-shape' }),
        svg('circle', { cx, cy, r: 18, class: 'lo-medal-disc' }))));
}

await mountBoard({
  controls: [
    {
      id: 'mode',
      label: 'Выгляд каруселі',
      options: [
        ['wheel', 'Кола медальёнаў (як у «Пра горад»)'],
        ['cards', 'Карткавая карусель (білеты)'],
        ['cached', '2-і запуск (мова ўжо ў кэшы)'],
      ],
    },
  ],
  stringIds: ['native.chrome.walk'],
  build({ body, state, say, device }) {
    let index = Math.max(0, ALL_LANGS.findIndex((item) => item.id === state.locale));

    const cityNode = el('span', { className: 'lo-city' });
    const whereNode = el('h2', { className: 'lo-menu-title t-display' });
    const titleNode = el('h3', { className: 'lo-title' });
    const subNode = el('p', { className: 'lo-sub' });
    const pickedNameNode = el('div', { className: 'lo-picked-name t-display' });
    const pickedGreetNode = el('div', { className: 'lo-picked-greet' });
    const footNoteNode = el('p', { className: 'lo-foot-note' });
    const confirmLabelNode = el('span');

    function syncText(item) {
      cityNode.textContent = item.city;
      whereNode.textContent = item.where;
      titleNode.textContent = item.title;
      subNode.textContent = item.sub;
      pickedNameNode.textContent = item.label;
      pickedGreetNode.textContent = item.greeting;
      footNoteNode.textContent = item.later;
      confirmLabelNode.textContent = item.confirm;
    }

    function drawMode() {
      const current = ALL_LANGS[index];
      syncText(current);
      body.replaceChildren();

      const menuWrap = el('div', { className: 'lo-menu-bg' },
        el('div', { className: 'lo-menu-top' },
          el('div', { className: 'lo-menu-head' },
            el('span', { className: 'lo-brand', textContent: 'KUDY' }),
            cityNode,
            iconButton('settings', 'KUDY / Налады', () => say('Адкрываецца экран KUDY / Налады.'), 20)),
          whereNode,
          el('div', { className: 'lo-canvas' }, menuPreviewSvg())),
        el('div', { className: 'lo-rest' },
          state.mode === 'cached'
            ? el('div', { className: 'notice lo-cached-banner' },
                icon('check', 18),
                el('div', { className: 'lo-cached-copy' },
                  el('span', { textContent: `Мова «${current.label}» (${current.code}) узятая з кэша прылады — вакно выбару больш не паказваецца.` }),
                  el('button', {
                    type: 'button',
                    className: 'lo-reset-btn',
                    textContent: 'Скінуць кэш мовы (праверыць 1-ы запуск)',
                    onclick: () => {
                      state.mode = 'wheel';
                      const sel = document.getElementById('mode');
                      if (sel) sel.value = 'wheel';
                      drawMode();
                      say('Кэш мовы ачышчаны: пры запуску зноў паказваецца карусель моў.');
                    },
                  })))
            : null,
          panorama()),
        adZone(false));

      if (state.mode === 'cached') {
        body.append(menuWrap);
        return;
      }

      menuWrap.setAttribute('aria-hidden', 'true');
      menuWrap.classList.add('lo-dimmed');

      const wheelNode = wheel({
        items: ALL_LANGS,
        index,
        slot: Math.min(96, Math.floor(device.w / 3.2)),
        label: current.title,
        lang: current.id,
        controls: 'lo-spotlight',
        onSelect(nextIdx) {
          index = nextIdx;
          const nextItem = ALL_LANGS[index];
          state.locale = nextItem.id;
          const locSel = document.getElementById('locale');
          if (locSel) locSel.value = nextItem.id;
          syncText(nextItem);
          say(`Кола спынілася на «${nextItem.label}» (${nextItem.code}).`);
        },
      });
      wheelNode.classList.add('lo-carousel', `lo-carousel-${state.mode}`);

      const stepBy = (dir) => {
        const key = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
        wheelNode.dispatchEvent(new KeyboardEvent('keydown', { key }));
      };

      const stageRow = el('div', { className: 'lo-stage-row', id: 'lo-spotlight' },
        iconButton('chevron-left', 'Папярэдняя мова', () => stepBy(-1), 20),
        el('div', { className: 'lo-Spotlight' }, pickedNameNode, pickedGreetNode),
        iconButton('chevron-right', 'Наступная мова', () => stepBy(1), 20));

      const confirmBtn = el('button', {
        type: 'button',
        className: 'btn primary block',
        onclick: () => {
          const chosenItem = ALL_LANGS[index];
          state.mode = 'cached';
          const sel = document.getElementById('mode');
          if (sel) sel.value = 'cached';
          drawMode();
          say(`Мова «${chosenItem.label}» захаваная ў лакальны кэш (settings.ui_locale).`);
        },
      }, icon('check', 20), confirmLabelNode);

      const sheet = el('div', { className: 'lo-scrim' },
        el('section', { className: 'lo-sheet', role: 'dialog', 'aria-modal': 'true' },
          el('div', { className: 'lo-grip', 'aria-hidden': 'true' }),
          el('div', { className: 'lo-head-center' }, titleNode, subNode),
          wheelNode,
          stageRow,
          confirmBtn,
          footNoteNode));

      body.append(menuWrap, sheet);
    }

    drawMode();
  },
});
