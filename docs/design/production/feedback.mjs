// Rating form (app/feedback.tsx): a temporary surface that rates a guide's whole
// experience or a physical place. Five stars without a default, a closed list
// of reasons per target kind (at most three), the disclosure next to Send, and
// an honest delivery state. Rules: docs/design/screens-and-transitions.md
// «Feedback form (temporary surface)», docs/design/visual-language.md §8.
import { button, el, icon, iconButton, mountBoard } from './kit.mjs';

const FB = (key) => `native.feedback.${key}`;
// The closed reason lists of controllers/useFeedbackController.ts.
const REASONS = {
  guide: ['interesting_stories', 'clear_delivery', 'too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
  place: ['worth_visiting', 'description_mismatch', 'hard_to_reach', 'access_problem'],
};
const STRING_IDS = [
  ...['formTitleGuide', 'formTitlePlace', 'targetLine', 'scaleHint', 'starLabel', 'reasonsTitle', 'disclosureTitle', 'disclosureBody',
    'disclosureAnalytics', 'send', 'deleteButton', 'resolveConflict', 'stateConflict', 'guideWord', 'placeWord',
    'errorText.feedback-resolution-required'].map(FB),
  ...[...new Set([...REASONS.guide, ...REASONS.place])].map((code) => FB(`reasonText.${code}`)),
  'native.chrome.back', 'native.chrome.loading',
];

// New strings of this screen. The app has no records for them yet; these are
// proposals that need a native-speaker review before they enter the contract.
// «Прапусціць» is the word docs/11_run_interaction.md §16.7 already uses.
const NEW = {
  skip: { be: 'Прапусціць', en: 'Skip', uk: 'Пропустити', de: 'Überspringen', es: 'Omitir', fr: 'Passer', cs: 'Přeskočit', sv: 'Hoppa över' },
  choose: { be: 'Каб адправіць, выберы ацэнку', en: 'Choose a rating to send', uk: 'Щоб надіслати, вибери оцінку', de: 'Wähle zum Senden eine Bewertung', es: 'Para enviar, elige una valoración', fr: 'Pour envoyer, choisis une note', cs: 'Pro odeslání vyber hodnocení', sv: 'Välj ett betyg för att skicka' },
};

// Illustrative targets, the same made-up names as on the Run mockup; the
// content language and version in the facts line are examples too.
const TARGET = { guide: 'Шпацыр па старым горадзе', place: 'Ратуша' };
const FACTS = { locale: 'be', version: '1.2.0' };
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

    const top = el('div', { className: 'topbar' }, iconButton('arrow-left', strings['native.chrome.back'], () => say(leave)));
    const scroll = el('div', { className: 'fb-scroll scroll' });
    const foot = el('div', { className: 'fb-foot' });
    body.append(top, scroll, foot);

    function render() {
      const held = body.contains(document.activeElement) ? document.activeElement.dataset.k : null;

      // The header names who is rated and what for: a guide's whole experience or a physical place.
      const header = el('div', { className: 'fb-target' },
        el('span', { className: 'tag', textContent: t(kind === 'guide' ? 'guideWord' : 'placeWord') }),
        el('span', { className: `name${kind === 'guide' ? ' t-display' : ''}`, textContent: TARGET[kind] }),
        el('h2', { className: 'fb-question', textContent: t(kind === 'guide' ? 'formTitleGuide' : 'formTitlePlace') }),
        el('p', { className: 't-small', textContent: t('targetLine').replace('${locale}', FACTS.locale).replace('${version}', FACTS.version) }));

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
        const chip = keyed(el('button', { className: 'chip', type: 'button' }, chosen && icon('check', 16), t(`reasonText.${code}`)), code);
        chip.setAttribute('aria-pressed', String(chosen));
        if (off) chip.setAttribute('aria-disabled', 'true');
        chip.addEventListener('click', () => {
          if (off) return;
          if (chosen) form.reasons.delete(code); else form.reasons.add(code);
          render();
        });
        chips.append(chip);
      }

      const note = el('div', { className: 'card fb-note' }, el('p', { className: 't-strong', textContent: t('disclosureTitle') }),
        el('p', { className: 't-secondary', textContent: t('disclosureBody') }), el('p', { className: 't-secondary', textContent: t('disclosureAnalytics') }));

      scroll.replaceChildren(...[header, notice, el('div', {}, stars, ends),
        el('div', {}, el('h3', { className: 'fb-section', textContent: t('reasonsTitle') }), chips), note,
        // A rating that already exists on the device can be deleted from here.
        conflict && keyed(button(t('deleteButton'), { iconName: 'trash', onPress: () => say('Ацэнка выдаляецца. Калі сеткі няма, выдаленне чакае яе і пра гэта напісана.') }), 'delete')].filter(Boolean));

      // Send is off until a star is chosen, while sending and during a conflict;
      // the reason is always written next to it.
      const reason = form.score === null ? NEW.choose[state.locale] : conflict ? t('errorText.feedback-resolution-required') : null;
      const off = busy || reason !== null;
      const send = keyed(button(busy ? strings['native.chrome.loading'] : t('send'), { kind: 'primary', disabled: off, onPress: () => say('Ацэнка захоўваецца на прыладзе і адпраўляецца. Форма закрываецца і вяртае на экран, з якога яе адкрылі.') }), 'send');
      foot.replaceChildren(...[reason && el('p', { className: 'fb-reason' }, icon('info', 16), el('span', { textContent: reason })),
        el('div', { className: 'fb-actions' }, keyed(button(NEW.skip[state.locale], { onPress: () => say(leave) }), 'skip'), send)].filter(Boolean));

      if (held) body.querySelector(`[data-k="${held}"]`)?.focus();
    }
    render();
  },
});
