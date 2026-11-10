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
