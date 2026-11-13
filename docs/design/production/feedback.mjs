// Rating form (app/feedback.tsx): a temporary surface that rates a guide's whole
// experience or a physical place. Five stars without a default, a closed list
// of reasons per target kind (at most three), the disclosure next to Send, and
// an honest delivery state. Rules: docs/design/screens-and-transitions.md
// «Feedback form (temporary surface)», docs/design/visual-language.md §8.
import { button, el, icon, iconButton, mountBoard, svg } from './kit.mjs';
import { discoveryContent, pick } from './offers.mjs';
import { EXISTING_REASON_CODES, suggestedReasons, keepCompatibleReasons, positiveLabel } from './feedback-reasons.mjs';
const FB = (key) => `native.feedback.${key}`;
// Existing reason codes keep their canonical translations; new positive copy is mockup-only.
const STRING_IDS = [
  ...['formTitleGuide', 'formTitlePlace', 'scaleHint', 'starLabel', 'reasonsTitle', 'disclosureTitle', 'disclosureBody',
    'disclosureAnalytics', 'send', 'deleteButton', 'resolveConflict', 'stateConflict', 'guideWord', 'placeWord',
    'errorText.feedback-resolution-required'].map(FB),
  ...EXISTING_REASON_CODES.map((code) => FB(`reasonText.${code}`)),
  'native.chrome.back', 'native.chrome.loading',
];

// Mockup-only strings need native-speaker review and addition to the app's message contract.
// The preview does not submit review text to the server; validation belongs to #207.
const REVIEW_MAX = 500;
const NEW = {
  review: { en: 'Want to add a few words? We are listening', be: 'Хочаш дадаць пару слоў? Мы слухаем', uk: 'Хочеш додати кілька слів? Ми слухаємо', de: 'Noch ein paar Worte? Wir hören zu', es: '¿Quieres contar algo más? Te escuchamos', fr: 'Tu veux ajouter quelques mots ? On t’écoute', cs: 'Chceš přidat pár slov? Posloucháme', sv: 'Vill du säga några ord till? Vi lyssnar' },
  noPersonal: { en: 'No personal data, please', be: 'Толькі без асабістых даных, добра?', uk: 'Тільки без особистих даних, гаразд?', de: 'Bitte keine persönlichen Daten', es: 'Sin datos personales, por favor', fr: 'Sans données personnelles, s’il te plaît', cs: 'Prosím bez osobních údajů', sv: 'Inga personuppgifter, tack' },
  choose: { be: 'Каб адправіць, выберы ацэнку', en: 'Choose a rating to send', uk: 'Щоб надіслати, вибери оцінку', de: 'Wähle zum Senden eine Bewertung', es: 'Para enviar, elige una valoración', fr: 'Pour envoyer, choisis une note', cs: 'Pro odeslání vyber hodnocení', sv: 'Välj ett betyg för att skicka' },
  introGuide: { en: 'So, how was that walk?', be: 'Ну як табе гэтая прагулка?', uk: 'Ну як тобі ця прогулянка?', de: 'Na, wie war der Spaziergang?', es: 'Bueno, ¿qué tal el paseo?', fr: 'Alors, cette balade ?', cs: 'Tak co, jaká byla procházka?', sv: 'Nå, hur var promenaden?' },
  introPlace: { en: 'So, how did you like this place?', be: 'Ну як табе гэтае месца?', uk: 'Ну як тобі це місце?', de: 'Na, wie fandest du diesen Ort?', es: 'Bueno, ¿qué tal este lugar?', fr: 'Alors, cet endroit ?', cs: 'Tak co, jak se ti líbilo tohle místo?', sv: 'Nå, vad tyckte du om platsen?' },
  pickStars: { en: 'Pick some stars — we will give you a few ideas', be: 'Выберы зоркі — і падкінем пару ідэй', uk: 'Вибери зірки — підкинемо кілька ідей', de: 'Wähle Sterne – wir geben dir ein paar Ideen', es: 'Elige estrellas y te damos algunas ideas', fr: 'Choisis des étoiles, on te souffle quelques idées', cs: 'Vyber hvězdičky a nabídneme pár nápadů', sv: 'Välj stjärnor så får du några idéer' },
  negative: { en: 'Where did we get it wrong?', be: 'Дзе мы далі маху?', uk: 'Де ми схибили?', de: 'Was haben wir vermasselt?', es: '¿En qué fallamos?', fr: 'Où est-ce qu’on s’est loupés ?', cs: 'Kde jsme šlápli vedle?', sv: 'Vad missade vi?' },
  improve: { en: 'What should we tune up?', be: 'Што б нам падкруціць?', uk: 'Що нам підкрутити?', de: 'Was können wir besser machen?', es: '¿Qué podemos mejorar?', fr: 'Qu’est-ce qu’on pourrait améliorer ?', cs: 'Co bychom mohli vylepšit?', sv: 'Vad kan vi fila på?' },
  positive: { en: 'What really worked for you?', be: 'Што табе асабліва зайшло?', uk: 'Що тобі особливо зайшло?', de: 'Was hat dir besonders gefallen?', es: '¿Qué te gustó especialmente?', fr: 'Qu’est-ce qui t’a vraiment plu ?', cs: 'Co tě obzvlášť bavilo?', sv: 'Vad gillade du extra mycket?' },
  delighted: { en: 'What deserves a special shout-out?', be: 'За што тут асобны рэспект?', uk: 'За що тут окремий респект?', de: 'Was verdient besonderes Lob?', es: '¿Qué merece una mención especial?', fr: 'Qu’est-ce qui mérite un bravo ?', cs: 'Co si zaslouží zvláštní pochvalu?', sv: 'Vad förtjänar extra beröm?' },
  hintMore: { en: 'Pick up to three if you feel like it. Stars alone are fine too.', be: 'Можаш ткнуць да трох. А можаш пакінуць проста зоркі — усё добра.', uk: 'Можеш вибрати до трьох. Або лишити тільки зірки — теж добре.', de: 'Wähl bis zu drei aus, wenn du magst. Sterne allein reichen auch.', es: 'Marca hasta tres si quieres. Con las estrellas basta también.', fr: 'Choisis-en jusqu’à trois si tu veux. Les étoiles seules suffisent aussi.', cs: 'Vyber klidně až tři. Stačí ale i samotné hvězdičky.', sv: 'Välj upp till tre om du vill. Bara stjärnor går också bra.' },
  reviewPlaceholder: { en: 'Was there a moment you will remember?', be: 'Быў момант, які асабліва запомніўся?', uk: 'Був момент, який особливо запам’ятався?', de: 'Gab es einen Moment, der dir in Erinnerung bleibt?', es: '¿Hubo un momento que recordarás?', fr: 'Un moment que tu garderas en mémoire ?', cs: 'Byl nějaký okamžik, který ti utkvěl?', sv: 'Var det ett ögonblick du minns särskilt?' },
  sendReview: { be: 'Адправіць водгук', en: 'Send feedback', uk: 'Надіслати відгук', de: 'Feedback senden', es: 'Enviar opinión', fr: 'Envoyer mon avis', cs: 'Odeslat hodnocení', sv: 'Skicka omdöme' },
  moreIdeas: { en: 'A few more ideas (+${count})', be: 'Яшчэ ідэі (+${count})', uk: 'Ще ідеї (+${count})', de: 'Noch mehr Ideen (+${count})', es: 'Más ideas (+${count})', fr: 'Encore des idées (+${count})', cs: 'Další nápady (+${count})', sv: 'Fler idéer (+${count})' },
};

// A miniature of the route-map diagram from the accepted guide preview
// (preview.mjs), not a fabricated cover photograph or geographical claim.
// The map stays light in both themes (DT-4).
function targetIllustration(kind) {
  const streets = svg('path', { class: 'fb-cover-street', d: 'M-5 22L105 34M-5 74L105 62M22 -5L30 105M68 -5L60 105' });
  const isGuide = kind === 'guide';
  const points = isGuide ? [[18, 63], [48, 49], [82, 24]] : [[50, 42]];
  const route = isGuide ? svg('path', { class: 'fb-cover-route', d: 'M18 63 L48 49 L82 24' }) : null;
  const dots = points.map(([cx, cy]) => svg('circle', { class: 'fb-cover-pin', cx, cy, r: isGuide ? 5 : 7 }));
  const cover = el('span', { className: 'fb-cover' },
    svg('svg', { viewBox: '0 0 100 84', 'aria-hidden': 'true' }, streets, ...(route ? [route] : []), ...dots));
  cover.setAttribute('aria-hidden', 'true');
  return cover;
}
const keyed = (node, key) => { node.dataset.k = key; return node; };

await mountBoard({
  controls: [
    { id: 'target', label: 'Што ацэньваюць', options: [['guide', 'Гід'], ['place', 'Месца']] },
    { id: 'status', label: 'Стан формы', options: [
      ['none', 'Нічога не выбрана'], ['low', '2 зоркі'], ['middle', '3 зоркі'],
      ['stars', '4 зоркі'], ['five', '5 зорак'], ['sending', 'Адпраўляецца'], ['conflict', 'Канфлікт з серверам'],
    ] },
  ],
  stringIds: STRING_IDS,
  async build({ body, state, strings, say }) {
    const t = (key) => strings[FB(key)];
    const w = (key) => NEW[key][state.locale] ?? NEW[key].en;
    const kind = state.target;
    const [discovery] = await discoveryContent();
    const targetOffer = discovery.offers.find((offer) => offer.ref.kind === kind);
    if (!targetOffer) throw new Error(`No published ${kind} target`);
    const targetName = pick(targetOffer.localized.title, state.locale);
    // No preselected score or reasons on entry. The board can preview 2/3/4 stars.
    const exampleScore = { low: 2, middle: 3, stars: 4, five: 5, sending: 4, conflict: 4 };
    const form = { score: exampleScore[state.status] ?? null, reasons: new Set() };
    const busy = state.status === 'sending', conflict = state.status === 'conflict';
    const leave = 'Форма закрываецца і вяртае на экран, з якога яе адкрылі. Нічога не запісана і нічога не заблакавана.';

    // Who sees a rating is a hint behind the «i» in the corner, not a block in the form.
    const hint = el('div', { className: 'card fb-hint', hidden: true },
      el('p', { className: 't-strong', textContent: t('disclosureTitle') }),
      el('p', { className: 't-secondary', textContent: t('disclosureBody') }),
      el('p', { className: 't-secondary', textContent: t('disclosureAnalytics') }));
    const info = iconButton('info', t('disclosureTitle'), () => {
      hint.hidden = !hint.hidden;
      info.setAttribute('aria-expanded', String(!hint.hidden));
    });
    info.setAttribute('aria-expanded', 'false');
    // Back leaves the form without saving, so it is also the way to skip it.
    const top = el('div', { className: 'topbar' }, iconButton('arrow-left', strings['native.chrome.back'], () => say(leave)), el('div', { className: 'title' }), info);
    let reviewText = '';
    let showAllHints = false;
    const scroll = el('div', { className: 'fb-scroll scroll' });
    const foot = el('div', { className: 'fb-foot' });
    body.append(top, hint, scroll, foot);

    function render() {
      const held = body.contains(document.activeElement) ? document.activeElement.dataset.k : null;
      const previousScroll = scroll.scrollTop;

      // The header names who is rated and what for: a guide's whole experience or a physical place.
      const header = el('div', { className: 'fb-target' },
        el('div', { className: 'card fb-target-head' },
          targetIllustration(kind),
          el('div', { className: 'fb-target-copy' },
            el('span', { className: 'tag', textContent: t(kind === 'guide' ? 'guideWord' : 'placeWord') }),
            el('span', { className: `name${kind === 'guide' ? ' t-display' : ''}`, textContent: targetName,
              lang: targetOffer.localized.title[state.locale] ? state.locale : 'be' }))),
        el('h2', { className: 'fb-question', textContent: w(kind === 'guide' ? 'introGuide' : 'introPlace') }));

      let notice = null;
      if (conflict) {
        // A conflict is shown as it is; the form never resends blindly.
        notice = el('div', { className: 'notice error fb-conflict' }, icon('circle-alert', 18), el('div', {},
          el('span', { className: 't-strong', textContent: t('stateConflict') }),
          keyed(button(t('resolveConflict'), { iconName: 'refresh-cw', onPress: () => say('Праграма правярае стан ацэнкі на серверы. Паўторнай адпраўкі наўздагад няма.') }), 'resolve')));
        notice.setAttribute('role', 'status');
      }

      const stars = el('div', { className: 'fb-stars' });
      stars.setAttribute('role', 'group');
      stars.setAttribute('aria-label', header.querySelector('h2').textContent);
      for (let value = 1; value <= 5; value += 1) {
        const star = keyed(el('button', { className: `fb-star${form.score !== null && value <= form.score ? ' on' : ''}`, type: 'button' }, icon('star', 34)), `star${value}`);
        star.setAttribute('aria-label', t('starLabel').replace('${score}', value));
        star.setAttribute('aria-pressed', String(form.score === value));
        if (busy) star.setAttribute('aria-disabled', 'true');
        star.addEventListener('click', () => {
          if (busy) return;
          form.reasons = new Set(keepCompatibleReasons(kind, value, form.reasons));
          if (form.score !== value) showAllHints = false;
          form.score = value;
          render();
        });
        stars.append(star);
      }
      // The two ends of the scale, from the app's own hint, shown without the digits.
      const ends = el('div', { className: 'fb-ends t-small' }, ...t('scaleHint').split(' · ').map((part) => el('span', { textContent: part.replace(/^\d\s*—\s*/, '') })));

      const chips = el('div', { className: 'fb-chips' });
      const availableReasons = suggestedReasons(kind, form.score);
      // The first four prompts keep the optional text field in easy reach.
      // Keep the full list open when a selected reason would otherwise be hidden.
      const mustExpand = availableReasons.slice(4).some((code) => form.reasons.has(code));
      const visibleReasons = showAllHints || mustExpand ? availableReasons : availableReasons.slice(0, 4);
      for (const code of visibleReasons) {
        const chosen = form.reasons.has(code), off = busy || (!chosen && form.reasons.size >= 3);
        const chip = keyed(el('button', { className: 'chip', type: 'button' },
          el('span', { className: 'fb-chip-mark' }, icon('check', 14)),
          form.score >= 4 ? positiveLabel(code, state.locale) : t(`reasonText.${code}`)), code);
        chip.setAttribute('aria-pressed', String(chosen));
        if (off) chip.setAttribute('aria-disabled', 'true');
        chip.addEventListener('click', () => {
          if (off) return;
          if (chosen) form.reasons.delete(code); else form.reasons.add(code);
          render();
        });
        chips.append(chip);
      }

      // The draft survives star and chip redraws; the review remains optional.
      // This is a UI preview only; the live API currently accepts no free-text field.
      const field = keyed(el('textarea', {
        className: 'fb-review', rows: 3, maxLength: REVIEW_MAX, value: reviewText,
        placeholder: w('reviewPlaceholder'), disabled: busy,
      }), 'review');
      const counter = el('span', { textContent: `${reviewText.length} / ${REVIEW_MAX}` });
      field.addEventListener('input', () => {
        reviewText = field.value;
        counter.textContent = `${reviewText.length} / ${REVIEW_MAX}`;
      });
      const note = el('div', { className: 'fb-write' },
        el('label', { className: 'fb-review-label' },
          el('span', { className: 'fb-section', textContent: w('review') }), field),
        el('p', { className: 't-small fb-write-note' },
          el('span', { textContent: w('noPersonal') }), counter));

      const hintTitle = w(form.score === null ? 'pickStars' :
        form.score === 5 ? 'delighted' : form.score === 4 ? 'positive' :
        form.score === 3 ? 'improve' : 'negative');
      const more = availableReasons.length > visibleReasons.length
        ? keyed(button(w('moreIdeas').replace('${count}', String(availableReasons.length - visibleReasons.length)), {
          onPress: () => {
            showAllHints = true;
            render();
            body.querySelector(`[data-k="${availableReasons[4]}"]`)?.focus({ preventScroll: true });
          },
        }), 'more')
        : null;
      if (more) more.classList.add('fb-more');
      const reasonsBlock = el('section', { className: 'fb-reasons' },
        el('h3', { className: 'fb-section', textContent: hintTitle }),
        form.score === null ? null : el('p', { className: 't-small fb-voice-note', textContent: w('hintMore') }),
        form.score === null ? null : chips, more);
      scroll.replaceChildren(...[header, notice, el('div', { className: 'card fb-score-card' }, stars, ends),
        reasonsBlock, note,
        // A rating that already exists on the device can be deleted from here.
        conflict && keyed(button(t('deleteButton'), { iconName: 'trash', onPress: () => say('Ацэнка выдаляецца. Калі сеткі няма, выдаленне чакае яе і пра гэта напісана.') }), 'delete')].filter(Boolean));

      // Send is off until a star is chosen, while sending and during a conflict;
      // the reason is always written next to it.
      const reason = form.score === null ? w('choose') : conflict ? t('errorText.feedback-resolution-required') : null;
      const off = busy || reason !== null;
      const send = keyed(button(w('sendReview'), {
        kind: 'primary', block: true, disabled: off,
        onPress: () => say('Ацэнка захоўваецца на прыладзе і адпраўляецца. Форма закрываецца і вяртае на экран, з якога яе адкрылі.'),
      }), 'send');
      // A labelled primary action avoids confusing the send symbol with a route icon.
      const why = el('p', { className: 'fb-reason', textContent: busy ? strings['native.chrome.loading'] : reason ?? '' });
      foot.replaceChildren(why, send);
      scroll.scrollTop = previousScroll;
      if (held) body.querySelector(`[data-k="${held}"]`)?.focus({ preventScroll: true });
    }
    render();
  },
});
