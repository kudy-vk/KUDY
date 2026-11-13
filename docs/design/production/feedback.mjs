// Rating form (app/feedback.tsx): a temporary surface that rates a guide's whole
// experience or a physical place. Five stars without a default, a closed list
// of reasons per target kind (at most three), the disclosure next to Send, and
// an honest delivery state. Rules: docs/design/screens-and-transitions.md
// «Feedback form (temporary surface)», docs/design/visual-language.md §8.
import { button, el, icon, iconButton, mountBoard, svg } from './kit.mjs';
import { discoveryContent, pick } from './offers.mjs';
import { REASON_SUGGESTIONS, suggestedReasons, keepCompatibleReasons } from './feedback-reasons.mjs';
const FB = (key) => `native.feedback.${key}`;
// Retain every code for translations; only a sentiment-matched subset is shown.
const REASON_CODES = [...new Set(Object.values(REASON_SUGGESTIONS)
  .flatMap((groups) => [...groups.positive, ...groups.needsWork]))];
const STRING_IDS = [
  ...['formTitleGuide', 'formTitlePlace', 'scaleHint', 'starLabel', 'reasonsTitle', 'disclosureTitle', 'disclosureBody',
    'disclosureAnalytics', 'send', 'deleteButton', 'resolveConflict', 'stateConflict', 'guideWord', 'placeWord',
    'errorText.feedback-resolution-required'].map(FB),
  ...REASON_CODES.map((code) => FB(`reasonText.${code}`)),
  'native.chrome.back', 'native.chrome.loading',
];

// Mockup-only strings need native-speaker review and addition to the app's message contract.
// The preview does not submit review text to the server; validation belongs to #207.
const REVIEW_MAX = 500;
const NEW = {
  review: { be: 'Водгук (неабавязкова)', en: 'Review (optional)', uk: 'Відгук (необов’язково)', de: 'Rückmeldung (optional)', es: 'Opinión (opcional)', fr: 'Avis (facultatif)', cs: 'Recenze (nepovinné)', sv: 'Omdöme (valfritt)' },
  noPersonal: { be: 'Не пішы асабістых даных', en: 'Do not write personal data', uk: 'Не пиши особистих даних', de: 'Bitte keine persönlichen Daten', es: 'No escribas datos personales', fr: 'N’écris pas de données personnelles', cs: 'Nepiš osobní údaje', sv: 'Skriv inga personuppgifter' },
  choose: { be: 'Каб адправіць, выберы ацэнку', en: 'Choose a rating to send', uk: 'Щоб надіслати, вибери оцінку', de: 'Wähle zum Senden eine Bewertung', es: 'Para enviar, elige una valoración', fr: 'Pour envoyer, choisis une note', cs: 'Pro odeslání vyber hodnocení', sv: 'Välj ett betyg för att skicka' },
  pickStars: { be: 'Ацані зоркамі — падкажам, што можна адзначыць', en: 'Choose stars to see useful prompts', uk: 'Вибери зірки — запропонуємо підказки', de: 'Wähle Sterne, um Hinweise zu sehen', es: 'Elige estrellas para ver sugerencias', fr: 'Choisis des étoiles pour voir des suggestions', cs: 'Vyber hvězdičky a zobrazí se možnosti', sv: 'Välj stjärnor så visas förslag' },
  negative: { be: 'Што не спадабалася?', en: 'What did not work?', uk: 'Що не сподобалося?', de: 'Was hat dir nicht gefallen?', es: '¿Qué no te gustó?', fr: 'Qu’est-ce qui ne t’a pas plu ?', cs: 'Co se ti nelíbilo?', sv: 'Vad fungerade inte?' },
  improve: { be: 'Што можна палепшыць?', en: 'What could be better?', uk: 'Що можна покращити?', de: 'Was könnte besser sein?', es: '¿Qué se podría mejorar?', fr: 'Qu’est-ce qui pourrait être amélioré ?', cs: 'Co by šlo zlepšit?', sv: 'Vad kan bli bättre?' },
  positive: { be: 'Што спадабалася?', en: 'What did you like?', uk: 'Що сподобалося?', de: 'Was hat dir gefallen?', es: '¿Qué te gustó?', fr: 'Qu’est-ce qui t’a plu ?', cs: 'Co se ti líbilo?', sv: 'Vad gillade du?' },
  sendReview: { be: 'Адправіць водгук', en: 'Send feedback', uk: 'Надіслати відгук', de: 'Feedback senden', es: 'Enviar opinión', fr: 'Envoyer mon avis', cs: 'Odeslat hodnocení', sv: 'Skicka omdöme' },
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
      ['stars', '4 зоркі'], ['sending', 'Адпраўляецца'], ['conflict', 'Канфлікт з серверам'],
    ] },
  ],
  stringIds: STRING_IDS,
  async build({ body, state, strings, say }) {
    const t = (key) => strings[FB(key)];
    const kind = state.target;
    const [discovery] = await discoveryContent();
    const targetOffer = discovery.offers.find((offer) => offer.ref.kind === kind);
    if (!targetOffer) throw new Error(`No published ${kind} target`);
    const targetName = pick(targetOffer.localized.title, state.locale);
    // No preselected score or reasons on entry. The board can preview 2/3/4 stars.
    const exampleScore = { low: 2, middle: 3, stars: 4, sending: 4, conflict: 4 };
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
        el('h2', { className: 'fb-question', textContent: kind === 'guide' && state.locale === 'be'
          ? 'Як табе гід?' : t(kind === 'guide' ? 'formTitleGuide' : 'formTitlePlace') }));

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
          form.score = value;
          render();
        });
        stars.append(star);
      }
      // The two ends of the scale, from the app's own hint, shown without the digits.
      const ends = el('div', { className: 'fb-ends t-small' }, ...t('scaleHint').split(' · ').map((part) => el('span', { textContent: part.replace(/^\d\s*—\s*/, '') })));

      const chips = el('div', { className: 'fb-chips' });
      for (const code of suggestedReasons(kind, form.score)) {
        const chosen = form.reasons.has(code), off = busy || (!chosen && form.reasons.size >= 3);
        const chip = keyed(el('button', { className: 'chip', type: 'button' },
          el('span', { className: 'fb-chip-mark' }, icon('check', 14)), t(`reasonText.${code}`)), code);
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
        className: 'fb-review', rows: 3, maxLength: REVIEW_MAX, value: reviewText, disabled: busy,
      }), 'review');
      const counter = el('span', { textContent: `${reviewText.length} / ${REVIEW_MAX}` });
      field.addEventListener('input', () => {
        reviewText = field.value;
        counter.textContent = `${reviewText.length} / ${REVIEW_MAX}`;
      });
      const note = el('div', { className: 'fb-write' },
        el('label', { className: 'fb-review-label' },
          el('span', { className: 'fb-section', textContent: NEW.review[state.locale] }), field),
        el('p', { className: 't-small fb-write-note' },
          el('span', { textContent: NEW.noPersonal[state.locale] }), counter));

      const hintTitle = form.score === null ? NEW.pickStars[state.locale] :
        NEW[form.score >= 4 ? 'positive' : form.score === 3 ? 'improve' : 'negative'][state.locale];
      const reasonsBlock = el('section', { className: 'fb-reasons' },
        el('h3', { className: 'fb-section', textContent: hintTitle }),
        form.score === null ? null : chips);
      scroll.replaceChildren(...[header, notice, el('div', { className: 'card fb-score-card' }, stars, ends),
        reasonsBlock, note,
        // A rating that already exists on the device can be deleted from here.
        conflict && keyed(button(t('deleteButton'), { iconName: 'trash', onPress: () => say('Ацэнка выдаляецца. Калі сеткі няма, выдаленне чакае яе і пра гэта напісана.') }), 'delete')].filter(Boolean));

      // Send is off until a star is chosen, while sending and during a conflict;
      // the reason is always written next to it.
      const reason = form.score === null ? NEW.choose[state.locale] : conflict ? t('errorText.feedback-resolution-required') : null;
      const off = busy || reason !== null;
      const send = keyed(button(NEW.sendReview[state.locale], {
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
