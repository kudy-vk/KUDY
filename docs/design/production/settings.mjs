// Settings screen (no route in the app yet): the six blocks of the hierarchy
// accepted as decision S1 — language, appearance, «Гіды для мяне», «Мае
// знаходкі», comfort, help and data — and the separate exclusions screen of
// «Гіды для мяне» (S2). Choices made inside the phone are real: they redraw
// both phones, because both show the same app with one stored preference.
import { button, el, icon, LOCALES, mountBoard, registerIcons, topbar, walkButton } from './kit.mjs';

// Lucide shapes this screen alone needs (lucide-react-native, ISC).
registerIcons({
  smartphone: [['rect', { width: '14', height: '20', x: '5', y: '2', rx: '2', ry: '2' }], ['path', { d: 'M12 18h.01' }]],
  gem: [['path', { d: 'M10.5 3 8 9l4 13 4-13-2.5-6' }], ['path', { d: 'M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z' }], ['path', { d: 'M2 9h20' }]],
  shield: [['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }]],
  'message-square': [['path', { d: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z' }]],
  activity: [['path', { d: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2' }]],
  wind: [['path', { d: 'M12.8 19.6A2 2 0 1 0 14 16H2' }], ['path', { d: 'M17.5 8a2.5 2.5 0 1 1 2 4H2' }], ['path', { d: 'M9.8 4.4A2 2 0 1 1 11 8H2' }]],
  'eye-off': [['path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }], ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }], ['path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }], ['path', { d: 'm2 2 20 20' }]],
});

const BACK = 'native.chrome.back', WALK = 'native.chrome.walk', LANGUAGE = 'native.chrome.languageLabel';
const SOON = 'native.chrome.comingSoon', PRIVACY = 'web.ui.privacyTitle';

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
// Each list follows ORDER.
const ORDER = ['be', 'en', 'uk', 'de', 'es', 'fr', 'cs', 'sv'];
const T = {
  title: ['Налады', 'Settings', 'Налаштування', 'Einstellungen', 'Ajustes', 'Réglages', 'Nastavení', 'Inställningar'],
  storyLang: ['Мова гісторый можа адрознівацца', 'Story language may differ', 'Мова історій може відрізнятися', 'Die Sprache der Geschichten kann abweichen', 'El idioma de las historias puede ser otro', 'La langue des histoires peut être différente', 'Jazyk příběhů se může lišit', 'Berättelsernas språk kan vara ett annat'],
  look: ['Выгляд', 'Appearance', 'Вигляд', 'Darstellung', 'Apariencia', 'Apparence', 'Vzhled', 'Utseende'],
  system: ['Як у прылады', 'Same as device', 'Як у пристрої', 'Wie am Gerät', 'Como el dispositivo', 'Comme l’appareil', 'Podle zařízení', 'Som enheten'],
  light: ['Светлая', 'Light', 'Світла', 'Hell', 'Clara', 'Clair', 'Světlý', 'Ljust'],
  dark: ['Цёмная', 'Dark', 'Темна', 'Dunkel', 'Oscura', 'Sombre', 'Tmavý', 'Mörkt'],
  nowLight: ['Зараз: светлая', 'Now: light', 'Зараз: світла', 'Jetzt: hell', 'Ahora: clara', 'Actuellement : clair', 'Nyní: světlý', 'Nu: ljust'],
  nowDark: ['Зараз: цёмная', 'Now: dark', 'Зараз: темна', 'Jetzt: dunkel', 'Ahora: oscura', 'Actuellement : sombre', 'Nyní: tmavý', 'Nu: mörkt'],
  guidesForMe: ['Гіды для мяне', 'Guides for me', 'Гіди для мене', 'Guides für mich', 'Guías para mí', 'Guides pour moi', 'Průvodci pro mě', 'Guider för mig'],
  showAll: ['Паказваць усё', 'Show everything', 'Показувати все', 'Alles anzeigen', 'Mostrar todo', 'Tout afficher', 'Zobrazovat vše', 'Visa allt'],
  hiddenCount: ['Схавана груп: ${n}', 'Hidden groups: ${n}', 'Приховано груп: ${n}', 'Ausgeblendete Gruppen: ${n}', 'Grupos ocultos: ${n}', 'Groupes masqués : ${n}', 'Skryté skupiny: ${n}', 'Dolda grupper: ${n}'],
  finds: ['Мае знаходкі', 'My finds', 'Мої знахідки', 'Meine Fundstücke', 'Mis hallazgos', 'Mes trouvailles', 'Moje nálezy', 'Mina fynd'],
  findsReason: ['Калекцыя яшчэ не адкрытая', 'The collection is not open yet', 'Колекція ще не відкрита', 'Die Sammlung ist noch nicht geöffnet', 'La colección aún no está abierta', 'La collection n’est pas encore ouverte', 'Sbírka ještě není otevřená', 'Samlingen är inte öppen än'],
  comfort: ['Зручнасць', 'Comfort', 'Зручність', 'Komfort', 'Comodidad', 'Confort', 'Pohodlí', 'Bekvämlighet'],
  lessMotion: ['Менш руху', 'Reduce motion', 'Менше руху', 'Weniger Bewegung', 'Menos movimiento', 'Moins d’animations', 'Méně pohybu', 'Mindre rörelse'],
  lessMotionNote: ['Без дадатковых анімацый. Налада прылады ўлічваецца заўсёды.', 'No extra animations. The device setting is always respected.', 'Без додаткових анімацій. Налаштування пристрою враховується завжди.', 'Keine zusätzlichen Animationen. Die Geräteeinstellung gilt immer.', 'Sin animaciones adicionales. El ajuste del dispositivo se respeta siempre.', 'Sans animations supplémentaires. Le réglage de l’appareil est toujours respecté.', 'Bez dalších animací. Nastavení zařízení platí vždy.', 'Inga extra animationer. Enhetens inställning gäller alltid.'],
  dragonSounds: ['Гукі дракона', 'Dragon sounds', 'Звуки дракона', 'Drachenklänge', 'Sonidos del dragón', 'Sons du dragon', 'Zvuky draka', 'Drakens ljud'],
  helpData: ['Даведка і даныя', 'Help and data', 'Довідка і дані', 'Hilfe und Daten', 'Ayuda y datos', 'Aide et données', 'Nápověda a data', 'Hjälp och data'],
  terms: ['Умовы', 'Terms', 'Умови', 'Bedingungen', 'Condiciones', 'Conditions', 'Podmínky', 'Villkor'],
  feedback: ['Зваротная сувязь', 'Feedback', 'Зворотний зв’язок', 'Feedback', 'Comentarios', 'Votre avis', 'Zpětná vazba', 'Återkoppling'],
  downloads: ['Загрузкі і сховішча', 'Downloads and storage', 'Завантаження і сховище', 'Downloads und Speicher', 'Descargas y almacenamiento', 'Téléchargements et stockage', 'Stažené soubory a úložiště', 'Nedladdningar och lagring'],
  consent: ['Аналітыка і дыягностыка збояў', 'Analytics and crash diagnostics', 'Аналітика і діагностика збоїв', 'Analyse und Absturzdiagnose', 'Analítica y diagnóstico de fallos', 'Statistiques et diagnostic des plantages', 'Analytika a diagnostika pádů', 'Analys och kraschdiagnostik'],
  granted: ['Згода дадзена', 'Consent given', 'Згоду надано', 'Einwilligung erteilt', 'Consentimiento dado', 'Consentement donné', 'Souhlas udělen', 'Samtycke givet'],
  revoked: ['Згода адкліканая', 'Consent withdrawn', 'Згоду відкликано', 'Einwilligung widerrufen', 'Consentimiento retirado', 'Consentement retiré', 'Souhlas odvolán', 'Samtycke återkallat'],
  none: ['Яшчэ не пыталі', 'Not asked yet', 'Ще не запитували', 'Noch nicht gefragt', 'Aún no se ha preguntado', 'Pas encore demandé', 'Zatím bez dotazu', 'Inte tillfrågad än'],
  deleteData: ['Выдаліць даныя прылады', 'Delete device data', 'Видалити дані пристрою', 'Gerätedaten löschen', 'Borrar los datos del dispositivo', 'Supprimer les données de l’appareil', 'Smazat data zařízení', 'Radera enhetens data'],
  deleteNote: ['Сцірае запіс прылады і ацэнкі на серверы. Загрузкі застаюцца.', 'Erases the device record and ratings on the server. Downloads stay.', 'Стирає запис пристрою та оцінки на сервері. Завантаження залишаються.', 'Löscht den Geräteeintrag und die Bewertungen auf dem Server. Downloads bleiben.', 'Borra el registro del dispositivo y las valoraciones en el servidor. Las descargas se conservan.', 'Efface l’enregistrement de l’appareil et les notes sur le serveur. Les téléchargements restent.', 'Smaže záznam zařízení a hodnocení na serveru. Stažené soubory zůstanou.', 'Raderar enhetens post och betygen på servern. Nedladdningarna finns kvar.'],
  hide: ['Схаваць у аглядзе гідаў', 'Hide in the guide overview', 'Приховати в огляді гідів', 'In der Guide-Übersicht ausblenden', 'Ocultar en el listado de guías', 'Masquer dans la liste des guides', 'Skrýt v přehledu průvodců', 'Dölj i guideöversikten'],
  reset: ['Нічога не хаваць', 'Hide nothing', 'Нічого не приховувати', 'Nichts ausblenden', 'No ocultar nada', 'Ne rien masquer', 'Nic neskrývat', 'Dölj ingenting'],
  keep: ['Пошук, прамыя спасылкі, набытыя, захаваныя і загружаныя гіды і бягучая прагулка застаюцца даступнымі.', 'Search, direct links, purchased, saved and downloaded guides and the current walk stay available.', 'Пошук, прямі посилання, придбані, збережені й завантажені гіди та поточна прогулянка залишаються доступними.', 'Suche, direkte Links, gekaufte, gespeicherte und heruntergeladene Guides sowie der aktuelle Rundgang bleiben verfügbar.', 'La búsqueda, los enlaces directos, las guías compradas, guardadas y descargadas y el recorrido actual siguen disponibles.', 'La recherche, les liens directs, les guides achetés, enregistrés et téléchargés ainsi que la visite en cours restent accessibles.', 'Hledání, přímé odkazy, zakoupení, uložení a stažení průvodci i aktuální procházka zůstávají dostupné.', 'Sökning, direktlänkar, köpta, sparade och nedladdade guider samt den aktuella promenaden finns kvar.'],
};
// Author tags are content, not interface: they stay Belarusian. Two examples
// from the concept; the app shows a tag only when a published guide carries it.
const TAGS = { belarus: 'Беларускія сляды', italy: 'Італьянскія сляды' };
const THEMES = [['system', 'smartphone'], ['light', 'sun'], ['dark', 'moon']];
const THEME_SAID = {
  system: 'Тэма: як у прылады. Кожны тэлефон зноў паказвае тэму сваёй прылады.',
  light: 'Тэма: светлая. Ручны выбар мацнейшы за тэму прылады, таму абодва тэлефоны цяпер светлыя. Выбар захоўваецца на прыладзе.',
  dark: 'Тэма: цёмная. Ручны выбар мацнейшы за тэму прылады, таму абодва тэлефоны цяпер цёмныя. Выбар захоўваецца на прыладзе.',
};

// What the person chose inside the phone. It lives outside the phones, so a
// redraw (and the other theme's phone) shows the same stored choice.
const prefs = { theme: 'system', hidden: new Set(), lessMotion: false, sounds: true };
const scrollAt = {};
let after = null; // { text, theme, focus }: what to report and re-focus after the redraw

// Applies a choice: optionally moves a board switch, then redraws both phones.
function apply(text, theme, focus, control, value) {
  after = { text, theme, focus };
  const select = document.getElementById(control ?? 'device');
  if (control) select.value = value;
  select.dispatchEvent(new Event('change'));
}

function row(iconName, name, { note, trailing, onPress, key, warn } = {}) {
  const node = el(onPress ? 'button' : 'div', { className: `srow${warn ? ' warn' : ''}` },
    icon(iconName, 20),
    el('span', { className: 'grow' },
      el('span', { textContent: name }),
      note && el('span', { className: 't-secondary', textContent: note })),
    trailing);
  if (onPress) { node.type = 'button'; node.addEventListener('click', onPress); }
  if (key) node.dataset.key = key;
  return node;
}

function toggleRow(iconName, name, note, on, key, onPress) {
  const node = row(iconName, name, { note, trailing: el('i', { className: 'track' }), onPress, key });
  node.classList.add('wide');
  node.setAttribute('role', 'switch');
  node.setAttribute('aria-checked', String(on));
  return node;
}

await mountBoard({
  controls: [
    { id: 'view', label: 'Экран', options: [['settings', 'Налады'], ['guides', 'Гіды для мяне']] },
    { id: 'walk', label: 'Прагулка', options: [['no', 'Не ідзе'], ['yes', 'Ідзе']] },
    { id: 'consent', label: 'Згода на аналітыку', options: [['none', 'Яшчэ не пыталі'], ['granted', 'Дадзена'], ['revoked', 'Адкліканая']] },
    { id: 'sounds', label: 'Гукі дракона', options: [['no', 'Не выпушчаныя'], ['yes', 'Выпушчаныя']] },
  ],
  stringIds: [BACK, WALK, LANGUAGE, SOON, PRIVACY],
  build({ frame, body, theme, state, strings, say }) {
    const t = (key, values = {}) => T[key][ORDER.indexOf(state.locale)].replace(/\$\{(\w+)\}/g, (_, name) => values[name]);
    const act = (text, focus, control, value) => apply(text, theme, focus, control, value);
    const walk = state.walk === 'yes' && walkButton(strings[WALK], () => say(`Вяртанне да бягучай прагулкі («${strings[WALK]}»): панэль у ранейшым становішчы.`));
    const hidden = prefs.hidden.size;
    const guidesStatus = hidden ? t('hiddenCount', { n: hidden }) : t('showAll');
    // A manual choice wins over the device theme (DT-3); «as on the device» follows the phone.
    frame.dataset.theme = prefs.theme === 'system' ? theme : prefs.theme;
    const content = el('div', { className: 'pad' });
    const heading = (text) => el('h3', { className: 'sec', textContent: text });
    const group = (...rows) => el('div', { className: 'card group' }, ...rows);

    if (state.view === 'guides') {
      // The exclusions screen: everything is shown by default, a pressed chip hides its group.
      const chips = el('div', { className: 'chips' }, ...Object.entries(TAGS).map(([id, name]) => {
        const off = prefs.hidden.has(id);
        const chip = el('button', { className: 'chip', type: 'button' }, off && icon('eye-off', 16), name);
        chip.setAttribute('aria-pressed', String(off));
        chip.dataset.key = `tag-${id}`;
        chip.addEventListener('click', () => {
          if (off) prefs.hidden.delete(id); else prefs.hidden.add(id);
          act(off ? `«${name}» зноў паказваецца ў аглядзе гідаў.` : `«${name}» схавана ў аглядзе гідаў. Набытае, захаванае і бягучая прагулка не мяняюцца.`, `[data-key="tag-${id}"]`);
        });
        return chip;
      }));
      chips.setAttribute('role', 'group');
      chips.setAttribute('aria-label', t('hide'));
      content.append(heading(t('hide')), chips, el('p', { className: 'hide-status', textContent: guidesStatus }),
        hidden > 0 && button(t('reset'), { onPress: () => { prefs.hidden.clear(); act('Нічога не схавана: зноў паказваюцца ўсе гіды.', '.chip'); } }),
        el('p', { className: 't-small keep', textContent: t('keep') }));
    } else {
      // 1. Language: self-names; the choice changes the interface at once.
      const languages = el('div', { className: 'chips' }, ...Object.entries(LOCALES).map(([code, name]) => {
        const chip = el('button', { className: 'chip', type: 'button', lang: code, textContent: name });
        chip.setAttribute('aria-pressed', String(code === state.locale));
        chip.dataset.key = `lang-${code}`;
        chip.addEventListener('click', () => act(`Мова інтэрфейсу: ${name}. Мова бягучай прагулкі і яе радок у гісторыі не мяняюцца.`, `[data-key="lang-${code}"]`, 'locale', code));
        return chip;
      }));
      languages.setAttribute('role', 'group');
      languages.setAttribute('aria-label', strings[LANGUAGE]);

      // 2. Appearance: system / light / dark, stored locally.
      const segments = el('div', { className: 'seg' }, ...THEMES.map(([id, glyph]) => {
        const option = el('button', { type: 'button' }, icon(glyph, 18), el('span', { textContent: t(id) }));
        option.setAttribute('role', 'radio');
        option.setAttribute('aria-checked', String(prefs.theme === id));
        option.dataset.key = `theme-${id}`;
        option.addEventListener('click', () => { prefs.theme = id; act(THEME_SAID[id], `[data-key="theme-${id}"]`); });
        return option;
      }));
      segments.setAttribute('role', 'radiogroup');
      segments.setAttribute('aria-label', t('look'));

      // 4. «Мае знаходкі»: shown in the first release as a «soon» placeholder (S3).
      const finds = row('gem', t('finds'), { note: t('findsReason'), trailing: el('span', { className: 'tag' }, icon('hourglass', 12), strings[SOON]) });
      finds.classList.add('off', 'wide', 'gap');
      finds.addEventListener('click', () => say(`«${t('finds')}»: раздзел яшчэ не адкрыты, націск нічога не робіць.`));

      const consentOn = state.consent === 'granted';
      content.append(
        heading(strings[LANGUAGE]),
        group(languages, row('info', t('storyLang'), {
          trailing: icon('chevron-right', 20),
          onPress: () => say('Адкрываецца тлумачэнне: мова гісторый выбіраецца для гіда асобна. Бягучую прагулку гэта не пераключае.'),
        })),
        heading(t('look')),
        el('div', { className: 'card theme' }, segments,
          prefs.theme === 'system' && el('p', { className: 't-small', textContent: t(theme === 'dark' ? 'nowDark' : 'nowLight') })),
        // 3. «Гіды для мяне»: the summary; the exclusions live on their own screen.
        el('div', { className: 'card group gap' }, row('sliders-horizontal', t('guidesForMe'), {
          note: guidesStatus, trailing: icon('chevron-right', 20), key: 'guides',
          onPress: () => act('Адкрыўся экран «Гіды для мяне».', '.topbar .iconbtn', 'view', 'guides'),
        })),
        finds,
        // 5. Comfort: a switch appears only when its feature exists.
        heading(t('comfort')),
        group(
          toggleRow('wind', t('lessMotion'), t('lessMotionNote'), prefs.lessMotion, 'motion', () => {
            prefs.lessMotion = !prefs.lessMotion;
            act(prefs.lessMotion ? 'Менш руху: дадатковыя анімацыі выключаныя.' : 'Менш руху выключана: дзейнічае толькі налада прылады.', '[data-key="motion"]');
          }),
          state.sounds === 'yes' && toggleRow('volume-2', t('dragonSounds'), null, prefs.sounds, 'sounds', () => {
            prefs.sounds = !prefs.sounds;
            act(prefs.sounds ? 'Гукі дракона ўключаныя.' : 'Гукі дракона выключаныя. Важная інфармацыя ад гуку не залежыць.', '[data-key="sounds"]');
          })),
        // 6. Help and data: consent is withdrawn at the same depth it is given.
        heading(t('helpData')),
        group(
          row('shield', strings[PRIVACY], { trailing: icon('external-link', 18), onPress: () => say('Адкрываецца палітыка прыватнасці на сайце. Сайт светлы; тэма дадатку не мяняецца.') }),
          row('file-text', t('terms'), { trailing: icon('external-link', 18), onPress: () => say('Адкрываюцца ўмовы выкарыстання на сайце.') }),
          row('message-square', t('feedback'), { trailing: icon('chevron-right', 20), onPress: () => say('Адкрываецца зваротная сувязь з камандай KUDY.') }),
          row('download', t('downloads'), { trailing: icon('chevron-right', 20), onPress: () => say('Адкрываецца KUDY: загрузкі і сховішча кіруюцца там.') }),
          toggleRow('activity', t('consent'), t(state.consent), consentOn, 'consent', () => act(
            consentOn ? 'Згода адкліканая: лог застаецца толькі на прыладзе, дадатак працуе цалкам.' : 'Згода дадзена: падзеі адпраўляюцца без каардынат.',
            '[data-key="consent"]', 'consent', consentOn ? 'revoked' : 'granted')),
          row('trash', t('deleteData'), { note: t('deleteNote'), warn: true, onPress: () => say('Выдаленне даных прылады: сціраюцца запіс прылады і ацэнкі на серверы; загрузкі застаюцца.') })));
    }

    const guides = state.view === 'guides';
    const scroller = el('div', { className: 'scroll' }, content);
    body.append(
      topbar({
        title: t(guides ? 'guidesForMe' : 'title'),
        backLabel: strings[BACK],
        onBack: guides
          ? () => act('Назад: вяртанне ў «Налады». Выбар захаваны.', '[data-key="guides"]', 'view', 'settings')
          : () => say('Назад: вяртанне ў KUDY. Прагулку і гук гэта не мяняе.'),
        right: walk ? [walk] : [],
      }),
      scroller);

    // After a choice: keep the place, the focus and the report of what happened.
    const place = `${theme}:${state.view}`;
    scroller.scrollTop = scrollAt[place] ?? 0;
    if (after) {
      say(after.text);
      if (after.theme === theme) body.querySelector(after.focus)?.focus({ preventScroll: true });
      if (theme === 'dark') after = null;
    }
    return () => { scrollAt[place] = scroller.scrollTop; };
  },
});
