// Shared non-duplicating DOM enhancer for the *-polish.html catalog variants.
// Each *-polish.html loads its canonical base module (about-257.mjs, guides.mjs,
// preview.mjs, run.mjs, end.mjs, feedback.mjs) and calls enhancePolish(kind),
// which observes the rendered .phone frames and applies the proposed UX/UI
// polish without copying a single line from the base modules.
import { el, icon, svg } from './kit.mjs';

function vignetteSvg() {
  return svg('svg', { viewBox: '0 0 64 64', width: 64, height: 64, 'aria-hidden': 'true', class: 'g-vignette' },
    svg('circle', { cx: 32, cy: 32, r: 24, fill: 'none', stroke: 'currentColor', 'stroke-width': '1', 'stroke-dasharray': '2 3', opacity: '0.45' }),
    svg('path', { d: 'M18 44 C 22 30, 42 34, 46 20', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
    svg('circle', { cx: 18, cy: 44, r: 3.2, fill: 'currentColor' }),
    svg('circle', { cx: 32, cy: 32, r: 2.6, fill: 'var(--card)', stroke: 'currentColor', 'stroke-width': '1.6' }),
    svg('circle', { cx: 46, cy: 20, r: 3.5, fill: 'var(--accent)' }));
}

const STEP_METAS = {
  from: ['Port Lotniczy 01, 02 · PKM', '210 · 110 · N3 · POLREGIO', 'ZTM · POLREGIO'],
  to: ['Dworzec Główny 10 · Wrzeszcz', '210 · 110 · N3 · POLREGIO', 'ZTM · POLREGIO'],
};

function enhanceAbout(phone) {
  for (const key of ['from', 'to']) {
    const btn = phone.querySelector(`[data-key="direction:${key}"]`);
    if (btn && !btn.querySelector('.route-caption')) {
      btn.append(el('span', { className: 'route-caption', textContent: btn.getAttribute('aria-label') ?? key }));
    }
  }
  const toChecked = phone.querySelector('[data-key="direction:to"]')?.getAttribute('aria-checked') === 'true';
  const metas = STEP_METAS[toChecked ? 'to' : 'from'];
  phone.querySelectorAll('.airport-step-fold > .fold-head .fold-title').forEach((titleBox, idx) => {
    if (!titleBox.querySelector('.fold-meta') && metas[idx]) {
      titleBox.append(el('span', { className: 'fold-meta', textContent: metas[idx] }));
    }
  });
  const kt = phone.querySelector('.tourist-card');
  const srcFold = phone.querySelector('.source-fold');
  if (kt && srcFold && kt.compareDocumentPosition(srcFold) & Node.DOCUMENT_POSITION_PRECEDING) {
    srcFold.before(kt);
  }
  const mapBox = phone.querySelector('.zoomview.atlas');
  const atlasCard = phone.querySelector('.atlas-card');
  const switches = phone.querySelector('.layer-switches');
  if (mapBox && atlasCard && switches && switches.compareDocumentPosition(atlasCard) & Node.DOCUMENT_POSITION_FOLLOWING) {
    switches.before(atlasCard);
  }
}

function enhanceGuides(phone) {
  phone.querySelectorAll('.g-photo').forEach((box) => {
    if (!box.querySelector('.g-vignette')) box.replaceChildren(vignetteSvg());
  });
  phone.querySelectorAll('.g-card .g-head').forEach((head) => {
    const name = head.querySelector('.g-name');
    if (name && !head.querySelector('.g-heading')) {
      const wrap = el('span', { className: 'g-heading' },
        name,
        el('span', { className: 'g-facts' },
          el('span', { className: 'g-fact' }, icon('clock', 14), '45–60 хв'),
          el('span', { className: 'g-dot', textContent: '·' }),
          el('span', { className: 'g-fact' }, icon('map-pin', 14), '7 кропак')));
      head.append(wrap);
    }
  });
}

function enhancePreview(phone) {
  const map = phone.querySelector('.pv-map');
  const firstStop = phone.querySelector('.pv-stops li p');
  if (map && firstStop && !map.querySelector('.pv-map-bar')) {
    map.append(el('div', { className: 'pv-map-bar', 'aria-hidden': 'true' },
      icon('map-pin', 14),
      el('span', { textContent: `Старт: ${firstStop.textContent}` })));
  }
  phone.querySelectorAll('.pv-row[role="group"]').forEach((row) => {
    if (!row.classList.contains('pv-lang-row')) {
      const label = row.getAttribute('aria-label') ?? '';
      const cap = label.charAt(0).toUpperCase() + label.slice(1);
      const ic = row.querySelector('.icon');
      row.classList.add('pv-lang-row');
      if (ic) {
        const lbl = el('span', { className: 'pv-lang-label' }, ic, el('span', { textContent: cap }));
        row.prepend(lbl);
      }
    }
  });
  const allBtn = phone.querySelector('.pv-all');
  if (allBtn && !allBtn.querySelector('span')) {
    allBtn.prepend(el('span', { textContent: allBtn.getAttribute('aria-label') ?? '' }));
  }
}

function enhanceRun(phone) {
  const dockMenu = phone.querySelector('.run-dock [data-k="menu"]');
  const topbar = phone.querySelector('.topbar');
  if (dockMenu && topbar) {
    topbar.append(dockMenu);
  }
}

function enhanceEnd(phone) {
  const invite = phone.querySelector('.end-invite');
  const sec = phone.querySelector('.end-scroll > h3.sec');
  if (invite && sec && sec.compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING) {
    sec.before(invite);
  }
}

function enhanceFeedback(phone) {
  const sec = phone.querySelector('.fb-section');
  const chips = phone.querySelector('.fb-chips');
  if (sec && chips && !sec.parentElement.classList.contains('fb-reasons-head')) {
    const selected = chips.querySelectorAll('[aria-pressed="true"]').length;
    const head = el('div', { className: 'fb-reasons-head' },
      sec.cloneNode(true),
      el('span', { className: 'fb-reasons-count', textContent: `${selected} / 3` }));
    sec.replaceWith(head);
  }
}

const HANDLERS = {
  about: enhanceAbout,
  guides: enhanceGuides,
  preview: enhancePreview,
  run: enhanceRun,
  end: enhanceEnd,
  feedback: enhanceFeedback,
};

export function mountPolishEnhancer(kind) {
  const apply = () => {
    document.querySelectorAll('.phone').forEach((phone) => HANDLERS[kind]?.(phone));
  };
  const observer = new MutationObserver(() => {
    observer.disconnect();
    apply();
    observer.observe(document.body, { childList: true, subtree: true });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  apply();
}
