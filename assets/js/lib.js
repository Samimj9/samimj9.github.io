/* Shared helpers: DOM builder, icons, data loading, formatting. No dependencies. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Tiny hyperscript helper. Uses textContent for text, so JSON content can never inject HTML. */
export function h(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return n;
}

/* ---------- icons (inline SVG, currentColor) ---------- */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  // brands (filled)
  github: ['0 0 24 24', 'fill="currentColor"', '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>'],
  linkedin: ['0 0 24 24', 'fill="currentColor"', '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>'],
  scholar: ['0 0 24 24', 'fill="currentColor"', '<path d="M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>'],
  orcid: ['0 0 24 24', 'fill="currentColor"', '<path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z"/>'],
  // ui (stroked)
  mail: ['0 0 24 24', STROKE, '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="m3.5 7 8.5 6.5L20.5 7"/>'],
  cv: ['0 0 24 24', STROKE, '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5"/>'],
  pin: ['0 0 24 24', STROKE, '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'],
  out: ['0 0 24 24', STROKE, '<path d="M7 17 17 7M8.5 7H17v8.5"/>'],
  right: ['0 0 24 24', STROKE, '<path d="M5 12h14M13 6l6 6-6 6"/>'],
  up: ['0 0 24 24', STROKE, '<path d="M12 19V5M6 11l6-6 6 6"/>'],
  down: ['0 0 24 24', STROKE, '<path d="m6 9 6 6 6-6"/>'],
  copy: ['0 0 24 24', STROKE, '<rect x="8.5" y="8.5" width="11" height="11" rx="1.5"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'],
  check: ['0 0 24 24', STROKE, '<path d="m5 12.5 4.5 4.5L19 7.5"/>'],
  code: ['0 0 24 24', STROKE, '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'],
  link: ['0 0 24 24', STROKE, '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'],
  print: ['0 0 24 24', STROKE, '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6"/>'],
  sun: ['0 0 24 24', STROKE, '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'],
  moon: ['0 0 24 24', STROKE, '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'],
  // research (48px, drawn for the cards)
  eeg: ['0 0 48 48', STROKE, '<path d="M4 12h6l2.5-5 3.5 10 3-7 2 2h4"/><path d="M4 24h5l2 4 3-9 3 12 3-7h5l2-3 2 5 2-2h6" /><path d="M4 37h7l2-3 3 5 3-8 2 6h4l2-2h6"/>'],
  manifold: ['0 0 48 48', STROKE, '<circle cx="24" cy="24" r="17"/><ellipse cx="24" cy="24" rx="17" ry="6"/><path d="M13.5 15c3 7 11 10 19.500 6" stroke-dasharray="2 3"/><circle cx="13.500" cy="15" r="2" fill="currentColor"/><circle cx="33" cy="21" r="2" fill="currentColor"/>'],
  graph: ['0 0 48 48', STROKE, '<path d="M10 14 24 8l14 9M10 14l5 21M24 8l-9 27M24 8l9 28M38 17l-5 19M15 35h18"/><circle cx="10" cy="14" r="3.5" fill="var(--bg-2)"/><circle cx="24" cy="8" r="3.5" fill="var(--bg-2)"/><circle cx="38" cy="17" r="3.5" fill="var(--bg-2)"/><circle cx="15" cy="35" r="3.5" fill="var(--bg-2)"/><circle cx="33" cy="36" r="3.5" fill="var(--bg-2)"/>'],
  interp: ['0 0 48 48', STROKE, '<circle cx="20" cy="20" r="13"/><path d="m30 30 12 12"/><path d="M13 22h4v-5h3v9h3v-4h3" />']
};

export function icon(name, size = 20) {
  const d = ICONS[name];
  if (!d) return document.createComment('missing icon ' + name);
  const t = document.createElement('template');
  t.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${d[0]}" width="${size}" height="${size}" ${d[1]} aria-hidden="true" focusable="false">${d[2]}</svg>`;
  return t.content.firstChild;
}

/* ---------- data ---------- */
export async function loadJSON(name) {
  try {
    const r = await fetch(`data/${name}.json`);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn(`Could not load data/${name}.json`, e);
    return null;
  }
}

/* ---------- formatting ---------- */
export const isTodo = (v) => typeof v === 'string' && /TODO/i.test(v);
export const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v.trim());

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(s) {
  if (typeof s !== 'string') return String(s ?? '');
  let m;
  if ((m = /^(\d{4})$/.exec(s))) return m[1];
  if ((m = /^(\d{4})-(\d{2})$/.exec(s))) return `${MONTHS[+m[2] - 1] || ''} ${m[1]}`.trim();
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) return `${+m[3]} ${MONTHS[+m[2] - 1] || ''} ${m[1]}`.trim();
  return s;
}

const tokens = (s) => s.toLowerCase().replace(/[*†‡§.,]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

/** Returns an array of nodes: authors joined by commas, with the site owner in <strong>. */
export function authorNodes(authors = [], selfNames = []) {
  const mine = new Set(selfNames.map(tokens));
  const out = [];
  authors.forEach((a, i) => {
    if (i) out.push(', ');
    out.push(mine.has(tokens(a)) ? h('strong', { class: 'me' }, a) : a);
  });
  return out;
}

export function mailto(email) {
  if (!email || isTodo(email.user) || isTodo(email.domain) || !email.user || !email.domain) return null;
  const addr = `${email.user}@${email.domain}`;
  return { addr, href: `mailto:${addr}` };
}

export function extLink(href, children, props = {}) {
  return h('a', { href, target: '_blank', rel: 'noopener noreferrer', ...props }, children);
}

/** Social links that are actually set (skips TODO placeholders). */
export function socials(profile) {
  const L = profile.links || {};
  const defs = [
    ['github', 'GitHub', L.github, (u) => u.replace(/^https?:\/\/(www\.)?/, '')],
    ['scholar', 'Google Scholar', L.scholar, () => 'Citations & publications'],
    ['linkedin', 'LinkedIn', L.linkedin, (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')],
    ['orcid', 'ORCID', L.orcid, (u) => u.replace(/^https?:\/\/(www\.)?/, '')]
  ];
  return defs.map(([key, label, url, handle]) => ({
    key, label, url, ok: isUrl(url) && !isTodo(url), handle: isUrl(url) ? handle(url) : null
  }));
}

/* ---------- theme (shared by all pages) ---------- */
export function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initThemeToggle(btn) {
  if (!btn) return;
  const paint = () => {
    const cur = effectiveTheme();
    btn.replaceChildren(icon(cur === 'dark' ? 'sun' : 'moon', 18));
    btn.setAttribute('aria-label', cur === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    const meta = document.querySelector('meta[name="theme-color"][data-dyn]');
    if (meta) meta.content = cur === 'dark' ? '#0c0e10' : '#f6f4ef';
  };
  btn.addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    paint();
    window.dispatchEvent(new Event('themechange'));
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    paint();
    window.dispatchEvent(new Event('themechange'));
  });
  paint();
}
