import {
  $, $$, h, icon, loadJSON, isTodo, isUrl, fmtDate, authorNodes, mailto, extLink, socials, initThemeToggle
} from './lib.js';

const root = document.documentElement;
root.classList.add('js');

const [profile, news, pubs, projects, experience, education] = await Promise.all(
  ['profile', 'news', 'publications', 'projects', 'experience', 'education'].map(loadJSON)
);

/* ================= nav ================= */
function initNav() {
  const nav = $('#nav');
  const btn = $('#menu-toggle');
  const menu = $('#site-menu');
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
  matchMedia('(min-width: 1000px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // scroll-spy
  const links = new Map($$('a[href^="#"]', menu).map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(en.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) links.forEach((a) => a.removeAttribute('aria-current'));
  }, { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));
}

/* ================= hero ================= */
function monogram(initials, name) {
  const t = document.createElement('template');
  t.innerHTML = `<svg class="monogram" viewBox="0 0 400 500" role="img" aria-label="${name} (monogram)" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".04"/></linearGradient></defs>
    <rect width="400" height="500" fill="url(#mg)"/>
    <path d="M0 380c40 0 40-60 80-60s40 90 80 90 40-130 80-130 40 110 80 110 40-30 80-30" fill="none" stroke="var(--accent)" stroke-opacity=".35" stroke-width="1.5"/>
    <text x="200" y="285" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-size="150" font-weight="400" fill="var(--accent)" letter-spacing="-4"></text></svg>`;
  const svg = t.content.firstChild;
  svg.querySelector('text').textContent = initials;
  return svg;
}

function renderPhoto(frame, p) {
  const mono = monogram(p.initials || 'SM', p.name);
  const img = frame.querySelector('img.photo-img');   // static <img> in index.html => discovered by the parser early (LCP)
  frame.prepend(mono);
  const src = (p.photo || '').trim();
  if (!img) return;
  if (!src) { img.remove(); return; }                 // empty field: monogram only
  img.alt = p.photoAlt || `Portrait of ${p.name}`;
  img.style.objectPosition = p.photoPosition || 'center 25%';
  const ok = () => { mono.setAttribute('aria-hidden', 'true'); mono.removeAttribute('role'); };
  img.addEventListener('load', ok);
  img.addEventListener('error', () => img.remove());   // monogram stays: never a broken image
  const want = src.includes('%') ? src : encodeURI(src);
  if (new URL(want, location.href).href !== img.src) { img.src = want; }
  else if (img.complete) { img.naturalWidth ? ok() : img.remove(); }
}

function renderHero(p) {
  $('#hero-name').textContent = p.name;
  $('#hero-role').textContent = p.role;
  $('#hero-statement').textContent = p.statement;
  renderPhoto($('#photo-frame'), p);

  const acts = $('#hero-actions');
  const L = p.links || {};
  const row = h('div', { class: 'hero-icons' });
  if (L.cv) acts.append(h('a', { class: 'btn btn-primary', href: L.cv }, icon('cv', 18), 'Curriculum Vitae'));
  const m = mailto(L.email);
  if (m) row.append(h('a', { class: 'icon-btn', href: m.href, 'aria-label': 'Email', title: 'Email' }, icon('mail', 18)));
  for (const s of socials(p)) {
    if (!s.ok) continue;
    row.append(extLink(s.url, icon(s.key, 18), { class: 'icon-btn', 'aria-label': s.label, title: s.label }));
  }
  acts.append(row);
}

/* ================= about + interests ================= */
function renderAbout(p) {
  const body = $('#about-body');
  const text = h('div', { class: 'prose' }, (p.about || []).map((t) => h('p', { text: t })));
  const facts = h('dl', { class: 'facts' }, (p.facts || []).flatMap((f) => [h('dt', { text: f.label }), h('dd', { text: f.value })]));
  body.replaceChildren(text, facts);
}

function renderInterests(p) {
  $('#research-body').replaceChildren(
    h('ul', { class: 'cards' }, (p.interests || []).map((it, i) =>
      h('li', { class: 'card interest' },
        h('span', { class: 'card-idx mono', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
        h('span', { class: 'interest-icon' }, icon(it.icon, 44)),
        h('h3', { text: it.title }),
        h('p', { text: it.text })
      )))
  );
}

/* ================= news ================= */
function renderNews(items) {
  const body = $('#news-body');
  if (!items?.length) { body.replaceChildren(h('p', { class: 'muted', text: 'Nothing yet.' })); return; }
  const LIMIT = 5;
  const list = h('ol', { class: 'timeline' }, items.map((n, i) =>
    h('li', { class: 'tl-item', hidden: i >= LIMIT, 'data-extra': i >= LIMIT ? '1' : null },
      h('span', { class: 'tl-date mono', text: fmtDate(n.date) }),
      h('p', { class: 'tl-text' }, n.link && isUrl(n.link) ? extLink(n.link, n.text, { class: 'prose-link' }) : n.text)
    )));
  body.replaceChildren(list);
  if (items.length > LIMIT) {
    const t = h('button', { class: 'btn btn-ghost', type: 'button', 'aria-expanded': 'false' }, `Show all ${items.length}`, icon('down', 16));
    t.addEventListener('click', () => {
      const open = t.getAttribute('aria-expanded') !== 'true';
      $$('[data-extra]', list).forEach((li) => { li.hidden = !open; });
      t.setAttribute('aria-expanded', String(open));
      t.replaceChildren(open ? 'Show fewer' : `Show all ${items.length}`, icon(open ? 'up' : 'down', 16));
    });
    body.append(h('div', { class: 'more' }, t));
  }
}

/* ================= publications ================= */
const TYPE_LABEL = { journal: 'Journal', conference: 'Conference', preprint: 'Preprint', review: 'Under review' };

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
  try {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0' });
    ta.value = text; document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}

function pubItem(pub, self, idx) {
  const act = (label, href, ic) => h('a', { class: 'pill', href, target: '_blank', rel: 'noopener noreferrer' }, ic ? icon(ic, 14) : null, label);
  const doi = pub.doi ? (isUrl(pub.doi) ? pub.doi : `https://doi.org/${pub.doi}`) : '';
  const actions = h('div', { class: 'pub-actions' });
  if (pub.pdf) actions.append(act('PDF', pub.pdf, 'cv'));
  if (doi) actions.append(act('DOI', doi, 'link'));
  if (pub.code) actions.append(act('Code', pub.code, 'code'));

  const li = h('li', { class: 'pub', 'data-type': pub.type });
  if (pub.bibtex) {
    const panelId = `bib-${pub.id || idx}`;
    const toggle = h('button', { class: 'pill', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId }, 'BibTeX');
    const copy = h('button', { class: 'pill copy', type: 'button' }, icon('copy', 14), h('span', { text: 'Copy' }));
    const status = h('span', { class: 'sr-only', role: 'status' });
    const panel = h('div', { class: 'bib', id: panelId, hidden: true },
      h('pre', {}, h('code', { text: pub.bibtex })), copy, status);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    });
    copy.addEventListener('click', async () => {
      const ok = await copyText(pub.bibtex);
      copy.replaceChildren(icon(ok ? 'check' : 'copy', 14), h('span', { text: ok ? 'Copied' : 'Press Ctrl+C' }));
      status.textContent = ok ? 'BibTeX copied to clipboard' : 'Copy failed';
      setTimeout(() => { copy.replaceChildren(icon('copy', 14), h('span', { text: 'Copy' })); status.textContent = ''; }, 2200);
    });
    actions.append(toggle);
    li.append(h('h4', { class: 'pub-title', text: pub.title }),
      h('p', { class: 'pub-authors' }, authorNodes(pub.authors, self)),
      pubMeta(pub), actions, panel);
  } else {
    li.append(h('h4', { class: 'pub-title', text: pub.title }),
      h('p', { class: 'pub-authors' }, authorNodes(pub.authors, self)),
      pubMeta(pub), actions);
  }
  if (!actions.children.length) actions.remove();
  return li;
}

function pubMeta(pub) {
  return h('p', { class: 'pub-meta' },
    h('span', { class: `badge badge-${pub.type}`, text: TYPE_LABEL[pub.type] || pub.type }),
    pub.venueShort ? h('span', { class: 'badge badge-venue', text: pub.venueShort }) : null,
    pub.venue && pub.venue !== pub.venueShort ? h('span', { class: 'venue', text: pub.venue }) : null,
    pub.status ? h('span', { class: 'status mono', text: pub.status }) : null);
}

function renderPubs(list, p) {
  const body = $('#publications-body');
  if (!list?.length) { body.replaceChildren(h('p', { class: 'muted', text: 'Nothing yet.' })); return; }
  const self = p.selfNames || [p.name];

  // group by year (no year => "In progress", first), years descending
  const groups = new Map();
  list.forEach((pub, i) => {
    const key = pub.year ? String(pub.year) : 'In progress';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push([pub, i]);
  });
  const keys = [...groups.keys()].sort((a, b) =>
    a === 'In progress' ? -1 : b === 'In progress' ? 1 : Number(b) - Number(a));

  const groupEls = keys.map((k) =>
    h('section', { class: 'year-group', 'aria-label': k },
      h('h3', { class: 'year', text: k }),
      h('ol', { class: 'pub-list' }, groups.get(k).map(([pub, i]) => pubItem(pub, self, i)))));

  // type filter chips (only types that exist)
  const counts = {};
  list.forEach((x) => { counts[x.type] = (counts[x.type] || 0) + 1; });
  const types = ['journal', 'conference', 'preprint', 'review'].filter((t) => counts[t]);
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter publications by type' });
  const live = h('p', { class: 'sr-only', role: 'status' });
  let current = 'all';
  const apply = (type) => {
    current = type;
    $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.type === type)));
    let shown = 0;
    groupEls.forEach((g) => {
      let any = false;
      $$('.pub', g).forEach((li) => {
        const show = type === 'all' || li.dataset.type === type;
        li.hidden = !show; any = any || show; if (show) shown++;
      });
      g.hidden = !any;
    });
    live.textContent = `${shown} publication${shown === 1 ? '' : 's'} shown`;
  };
  [['all', 'All', list.length], ...types.map((t) => [t, TYPE_LABEL[t], counts[t]])].forEach(([t, label, n]) => {
    const c = h('button', { class: 'chip', type: 'button', 'data-type': t, 'aria-pressed': String(t === current) },
      label, h('span', { class: 'chip-n mono', text: String(n) }));
    c.addEventListener('click', () => apply(t));
    chips.append(c);
  });

  const scholar = p.links?.scholar;
  body.replaceChildren(chips, live, ...groupEls,
    isUrl(scholar) ? h('p', { class: 'more' }, extLink(scholar, ['Full list on Google Scholar', icon('right', 16)], { class: 'text-link' })) : null);
}

/* ================= projects ================= */
function hash(str) { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
  const n = parseInt(m[1], 16); const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Generated cover: accent gradient, faint EEG-like traces seeded by the title, big initials. */
function coverSVG(pr) {
  const accent = /^#[0-9a-f]{6}$/i.test(pr.accent || '') ? pr.accent : '#1f8a83';
  const initials = (pr.initials || pr.title.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)).toUpperCase();
  const r = rng(hash(pr.title));
  let paths = '';
  for (let k = 0; k < 5; k++) {
    const y = 60 + k * 58; let d = `M0 ${y}`; const f1 = 0.02 + r() * 0.04, f2 = 0.07 + r() * 0.08, a = 8 + r() * 18, ph = r() * 6;
    for (let x = 8; x <= 640; x += 8) d += ` L${x} ${(y + Math.sin(x * f1 + ph) * a + Math.sin(x * f2 + ph * 2) * a * 0.45 * Math.sin(x * 0.012 + k)).toFixed(1)}`;
    paths += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${(0.1 + r() * 0.16).toFixed(2)}" stroke-width="1.2"/>`;
  }
  const id = 'cv' + hash(pr.title);
  const t = document.createElement('template');
  t.innerHTML = `<svg class="cover-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Generated cover for ${pr.title.replace(/"/g, '')}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(accent, -0.5)}"/><stop offset="1" stop-color="${shade(accent, -0.05)}"/></linearGradient></defs>
    <rect width="640" height="360" fill="url(#${id})"/>${paths}
    <text x="32" y="322" font-family="Newsreader, Georgia, serif" font-size="120" font-weight="400" fill="#fff" fill-opacity=".92" letter-spacing="-3"></text></svg>`;
  const svg = t.content.firstChild;
  svg.querySelector('text').textContent = initials;
  return svg;
}

function projectCover(pr) {
  const wrap = h('div', { class: 'cover' });
  const fallback = () => { wrap.replaceChildren(coverSVG(pr)); };
  if (!pr.image) { fallback(); return wrap; }
  const img = new Image();
  img.width = 640; img.height = 360; img.loading = 'lazy'; img.decoding = 'async';
  img.alt = `${pr.title} project image`;
  img.addEventListener('error', fallback);
  img.src = pr.image.includes('%') ? pr.image : encodeURI(pr.image);
  wrap.append(img);
  return wrap;
}

function renderProjects(items) {
  const body = $('#projects-body');
  if (!items?.length) { body.replaceChildren(h('p', { class: 'muted', text: 'Nothing yet.' })); return; }
  body.replaceChildren(h('ul', { class: 'project-grid' }, items.map((pr) => {
    const href = pr.github || pr.demo;
    const title = h('h3', { class: 'project-title' },
      href ? extLink(href, pr.title, { class: 'card-link' }) : pr.title,
      pr.subtitle ? h('span', { class: 'project-sub mono', text: pr.subtitle }) : null);
    return h('li', { class: 'card project' },
      projectCover(pr),
      h('div', { class: 'project-body' },
        title,
        h('p', { class: 'project-pitch', text: pr.pitch }),
        h('ul', { class: 'tags', 'aria-label': 'Tags' }, (pr.tags || []).map((t) => h('li', { class: 'tag mono', text: t }))),
        href ? h('span', { class: 'project-go mono', 'aria-hidden': 'true' }, pr.github ? icon('github', 15) : icon('out', 15), pr.github ? 'GitHub' : 'Open', icon('out', 13)) : null));
  })));
}

/* ================= timelines ================= */
function renderTimeline(sel, items, titleKey, orgKey) {
  const body = $(sel);
  if (!items?.length) { body.replaceChildren(h('p', { class: 'muted', text: 'Nothing yet.' })); return; }
  body.replaceChildren(h('ol', { class: 'timeline' }, items.map((it) =>
    h('li', { class: 'tl-item' },
      h('span', { class: 'tl-date mono', text: it.period || '' }),
      h('h3', { class: 'tl-title', text: it[titleKey] }),
      h('p', { class: 'tl-org' }, it[orgKey], it.location ? h('span', { class: 'muted', text: ` · ${it.location}` }) : null),
      it.summary ? h('p', { class: 'tl-text', text: it.summary }) : null,
      it.points?.length ? h('ul', { class: 'tl-points' }, it.points.map((t) => h('li', { text: t }))) : null))));
}

/* ================= contact + footer ================= */
function renderContact(p) {
  $('#contact-blurb').textContent = p.contactBlurb || '';
  const rows = h('ul', { class: 'contact-list' });
  const m = mailto(p.links?.email);
  rows.append(h('li', {},
    h('span', { class: 'c-ico' }, icon('mail', 20)), h('span', { class: 'c-label mono', text: 'Email' }),
    m ? h('a', { class: 'c-val', href: m.href }, m.addr) : h('span', { class: 'c-val is-todo', text: 'TODO: set links.email in data/profile.json' })));
  if (p.location) rows.append(h('li', {},
    h('span', { class: 'c-ico' }, icon('pin', 20)), h('span', { class: 'c-label mono', text: 'Location' }),
    h('span', { class: `c-val${isTodo(p.location) ? ' is-todo' : ''}`, text: p.location })));
  for (const s of socials(p)) {
    rows.append(h('li', {},
      h('span', { class: 'c-ico' }, icon(s.key, 20)), h('span', { class: 'c-label mono', text: s.label }),
      s.ok ? extLink(s.url, [s.handle, icon('out', 14)], { class: 'c-val' })
           : h('span', { class: 'c-val is-todo', text: `TODO: set links.${s.key} in data/profile.json` })));
  }
  $('#contact-body').replaceChildren(rows);
}

function renderFooter(p) {
  $('#year').textContent = String(new Date().getFullYear());
  $('#foot-name').textContent = p.name;
  const d = p.lastUpdated || (document.lastModified ? new Date(document.lastModified).toISOString().slice(0, 10) : '');
  $('#updated').textContent = d ? fmtDate(d) : '';
  if (d) $('#updated').setAttribute('datetime', d);
}

/* ================= scroll reveal ================= */
function initReveal() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('.reveal').forEach((el) => io.observe(el));
}

/* ================= boot ================= */
initThemeToggle($('#theme-toggle'));
initNav();
if (profile) {
  renderHero(profile); renderAbout(profile); renderInterests(profile);
  renderContact(profile); renderFooter(profile);
}
renderNews(news);
renderPubs(pubs, profile || {});
renderProjects(projects);
renderTimeline('#experience-body', experience, 'role', 'org');
renderTimeline('#education-body', education, 'degree', 'school');
initReveal();
import('./hero-canvas.js').catch((e) => console.warn('hero canvas unavailable', e));
