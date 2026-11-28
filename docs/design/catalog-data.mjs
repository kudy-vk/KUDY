// Reads docs/design/catalog.md and turns its tables into the item list the
// gallery page (catalog.html) shows. catalog.md stays the only place where a
// screen, its mockup and its status are written down; this module only reads.

const VIEWABLE = /\.(html?|png|jpe?g|gif|webp|svg)$/i;
// One level of nested brackets covers labels such as [app/route/[id].tsx](…).
const LINK = /\[((?:[^\[\]]|\[[^\[\]]*\])*)\]\(([^)\s]+)\)/g;

const STATUS_KINDS = [
  ['Прынята', 'accepted'],
  ['Часткова', 'partial'],
  ['Прапанова', 'proposal'],
];

export function statusKind(status) {
  const hit = STATUS_KINDS.find(([prefix]) => status.startsWith(prefix));
  return hit ? hit[1] : 'other';
}

// The gallery fragment carries the item key and the registered view href:
// `v2/<item>/<view>`, each part encodeURIComponent-ed, so a raw '/' inside the
// fragment can only be the separator. Older item-only fragments (no raw '/')
// keep working and open the item's first view. URL text is only decoded and
// matched, never trusted: the page renders hrefs that parseCatalog returned.
function tryDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function fragmentOf(itemKey, viewHref = '') {
  return ['v2', itemKey, viewHref].map(encodeURIComponent).join('/');
}

// Returns { item, view } for a fragment, or null when the fragment cannot be
// decoded at all and the page must fall back to its default item.
export function parseFragment(raw) {
  const parts = (raw ?? '').split('/');
  const versioned = parts[0] === 'v2' && parts.length === 3;
  const item = tryDecode(versioned ? parts[1] : raw ?? '');
  const view = versioned ? tryDecode(parts[2]) : null;
  if (item === null || (versioned && view === null)) return null;
  return { item, view };
}

// The view is matched by its registered href, so reordering the catalog.md
// links of a row does not move an already-created link's target.
export function viewIndexOf(item, viewHref) {
  return Math.max(0, item.views.findIndex((view) => view.href === viewHref));
}

function plain(cell) {
  return cell
    .replace(LINK, '$1')
    .replace(/[*`]/g, '')
    .trim();
}

// Only a relative path or an https link may reach an href/src on the page.
function safeTarget(target) {
  if (/^https:\/\//i.test(target)) return 'external';
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return null;
  return 'relative';
}

function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

export function parseCatalog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let section = null;
  let header = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const heading = /^##\s+(?:\d+\.\s*)?(.+)$/.exec(line);
    if (heading) {
      section = { title: heading[1].trim(), items: [] };
      sections.push(section);
      header = null;
      continue;
    }
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    if (!section) continue;
    if (header === null) {
      const next = lines[i + 1] ?? '';
      if (/^\s*\|\s*:?-{3,}/.test(next)) {
        header = cells(line).map(plain);
        i += 1;
      }
      continue;
    }

    const row = cells(line);
    const statusIndex = header.findIndex((name) => name.startsWith('Статус'));
    const status = statusIndex >= 0 ? plain(row[statusIndex] ?? '') : '';
    const views = [];
    const links = [];
    for (const match of line.matchAll(LINK)) {
      const [, label, target] = match;
      const kind = safeTarget(target);
      if (kind === 'external') links.push({ label: plain(label), href: target });
      if (kind === 'relative' && VIEWABLE.test(target.split('#')[0])) {
        if (!views.some((view) => view.href === target)) views.push({ label: plain(label), href: target });
      }
    }
    const notes = header
      .map((name, index) => ({ name, text: plain(row[index] ?? '') }))
      .filter((note, index) => index > 0 && index !== statusIndex && note.text && note.text !== '—');
    section.items.push({ title: plain(row[0] ?? ''), status, kind: statusKind(status), views, links, notes });
  }

  // A table with nothing to look at (document lists) is not a gallery section.
  return sections.filter((entry) => entry.items.some((item) => item.views.length > 0));
}
