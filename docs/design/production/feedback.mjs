// Rating form (app/feedback.tsx): a temporary surface that rates a guide's whole
// experience or a physical place. Five stars without a default, a closed list
// of reasons per target kind (at most three), the disclosure next to Send, and
// an honest delivery state. Rules: docs/design/screens-and-transitions.md
// «Feedback form (temporary surface)», docs/design/visual-language.md §8.
import { button, el, fab, icon, iconButton, mountBoard, registerIcons } from './kit.mjs';

// Lucide «send» (lucide-react-native 1.49.0, ISC): the one action of this form.
registerIcons({
  send: [
    ['path', { d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z' }],
    ['path', { d: 'm21.854 2.147-10.94 10.939' }],
  ],
});
const FB = (key) => `native.feedback.${key}`;
// The closed reason lists of controllers/useFeedbackController.ts.
const REASONS = {
  guide: ['interesting_stories', 'clear_delivery', 'too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
  place: ['worth_visiting', 'description_mismatch', 'hard_to_reach', 'access_problem'],
};
const STRING_IDS = [
  ...['formTitleGuide', 'formTitlePlace', 'scaleHint', 'starLabel', 'reasonsTitle', 'disclosureTitle', 'disclosureBody',
    'disclosureAnalytics', 'send', 'deleteButton', 'resolveConflict', 'stateConflict', 'guideWord', 'placeWord',
    'errorText.feedback-resolution-required'].map(FB),
  ...[...new Set([...REASONS.guide, ...REASONS.place])].map((code) => FB(`reasonText.${code}`)),
  'native.chrome.back', 'native.chrome.loading',
];

// Mockup-only strings need native-speaker review and addition to the app's message contract.
// The preview does not submit review text to the server; validation belongs to #207.
const REVIEW_MAX = 500;
const NEW = {
  review: { be: 'Водгук (неабавязкова)', en: 'Review (optional)', uk: 'Відгук (необов’язково)', de: 'Rückmeldung (optional)', es: 'Opinión (opcional)', fr: 'Avis (facultatif)', cs: 'Recenze (nepovinné)', sv: 'Omdöme (valfritt)' },
  noPersonal: { be: 'Не пішы асабістых даных', en: 'Do not write personal data', uk: 'Не пиши особистих даних', de: 'Bitte keine persönlichen Daten', es: 'No escribas datos personales', fr: 'N’écris pas de données personnelles', cs: 'Nepiš osobní údaje', sv: 'Skriv inga personuppgifter' },
  choose: { be: 'Каб адправіць, выберы ацэнку', en: 'Choose a rating to send', uk: 'Щоб надіслати, вибери оцінку', de: 'Wähle zum Senden eine Bewertung', es: 'Para enviar, elige una valoración', fr: 'Pour envoyer, choisis une note', cs: 'Pro odeslání vyber hodnocení', sv: 'Välj ett betyg för att skicka' },
};

// Illustrative targets, the same made-up names as on the Run mockup.
const TARGET = { guide: 'Шпацыр па старым горадзе', place: 'Ратуша' };
const keyed = (node, key) => { node.dataset.k = key; return node; };

await mountBoard({
  controls: [
    { id: 'target', label: 'Што ацэньваюць', options: [['guide', 'Гід'], ['place', 'Месца']] },
    { id: 'status', label: 'Стан формы', options: [['none', 'Нічога не выбрана'], ['stars', 'Зоркі выбраныя'], ['sending', 'Адпраўляецца'], ['conflict', 'Канфлікт з серверам']] },
  ],
  stringIds: STRING_IDS,
  build({ body, state, strings, say }) {
    const t = (key) => strings[FB(key)];
    const kind = state.target;
    // No default score: the form opens empty unless the board asks for a filled example.
    const form = state.status === 'none' ? { score: null, reasons: new Set() } : { score: 4, reasons: new Set([REASONS[kind][0]]) };
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

      // The header names who is rated and what for: a guide's whole experience or a physical place.
      const header = el('div', { className: 'fb-target' },
        el('div', { className: 'fb-target-head' },
          el('span', { className: 'fb-mark' }, icon(kind === 'guide' ? 'route' : 'map-pin', 24)),
          el('div', { className: 'fb-target-copy' },
            el('span', { className: 'tag', textContent: t(kind === 'guide' ? 'guideWord' : 'placeWord') }),
            el('span', { className: `name${kind === 'guide' ? ' t-display' : ''}`, textContent: TARGET[kind] }))),
        el('h2', { className: 'fb-question', textContent: t(kind === 'guide' ? 'formTitleGuide' : 'formTitlePlace') }));

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
        star.addEventListener('click', () => { if (!busy) { form.score = value; render(); } });
        stars.append(star);
      }
      // The two ends of the scale, from the app's own hint, shown without the digits.
      const ends = el('div', { className: 'fb-ends t-small' }, ...t('scaleHint').split(' · ').map((part) => el('span', { textContent: part.replace(/^\d\s*—\s*/, '') })));

      const chips = el('div', { className: 'fb-chips' });
      for (const code of REASONS[kind]) {
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

      scroll.replaceChildren(...[header, notice, el('div', { className: 'card fb-score-card' }, stars, ends),
        el('div', {}, el('h3', { className: 'fb-section', textContent: t('reasonsTitle') }), chips), note,
        // A rating that already exists on the device can be deleted from here.
        conflict && keyed(button(t('deleteButton'), { iconName: 'trash', onPress: () => say('Ацэнка выдаляецца. Калі сеткі няма, выдаленне чакае яе і пра гэта напісана.') }), 'delete')].filter(Boolean));

      // Send is off until a star is chosen, while sending and during a conflict;
      // the reason is always written next to it.
      const reason = form.score === null ? NEW.choose[state.locale] : conflict ? t('errorText.feedback-resolution-required') : null;
      const off = busy || reason !== null;
      const send = keyed(fab('send', t('send'), { disabled: off, onPress: () => say('Ацэнка захоўваецца на прыладзе і адпраўляецца. Форма закрываецца і вяртае на экран, з якога яе адкрылі.') }), 'send');
      // The footer is the same on every screen with one action: what the action
      // waits for on the left, the round action on the right.
      const why = el('p', { className: 'fb-reason', textContent: busy ? strings['native.chrome.loading'] : reason ?? '' });
      foot.replaceChildren(why, send);

      if (held) body.querySelector(`[data-k="${held}"]`)?.focus();
    }
    render();
  },
});
