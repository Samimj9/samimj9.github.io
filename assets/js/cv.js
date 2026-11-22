import { $, h, loadJSON, isTodo, isUrl, fmtDate, authorNodes, mailto, socials, initThemeToggle } from './lib.js';

const [profile, pubs, projects, experience, education] = await Promise.all(
  ['profile', 'publications', 'projects', 'experience', 'education'].map(loadJSON)
);

initThemeToggle($('#theme-toggle'));
$('#print-btn').addEventListener('click', () => window.print());

const strip = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const section = (title, ...kids) => h('section', { class: 'cv-section' }, h('h2', { text: title }), ...kids);

if (profile) {
  $('#cv-name').textContent = profile.name;
  $('#cv-role').textContent = profile.role;
  const c = $('#cv-contact');
  const m = mailto(profile.links?.email);
  const add = (node) => c.append(h('li', {}, node));
  if (m) add(h('a', { href: m.href, text: m.addr }));
  if (profile.location && !isTodo(profile.location)) add(profile.location);
  add(h('a', { href: profile.siteUrl, text: strip(profile.siteUrl) }));
  for (const s of socials(profile)) if (s.ok) add(h('a', { href: s.url, text: s.key === 'scholar' ? 'Google Scholar' : strip(s.url) }));
  document.title = `Curriculum Vitae | ${profile.name}`;
}

const body = $('#cv-body');

if (profile?.statement) body.append(section('Summary', h('p', { class: 'cv-summary', text: profile.statement })));

const entries = (items, title, org) => (items || []).map((it) =>
  h('article', { class: 'cv-item' },
    h('div', { class: 'cv-row' }, h('h3', { text: it[title] }), h('span', { class: 'cv-date mono', text: it.period || '' })),
    h('p', { class: 'cv-org' }, it[org], it.location ? ` · ${it.location}` : ''),
    it.summary ? h('p', { class: 'cv-text', text: it.summary }) : null,
    it.points?.length ? h('ul', { class: 'cv-points' }, it.points.map((t) => h('li', { text: t }))) : null));

if (education?.length) body.append(section('Education', ...entries(education, 'degree', 'school')));
if (experience?.length) body.append(section('Experience', ...entries(experience, 'role', 'org')));

if (pubs?.length) {
  const self = profile?.selfNames || [];
  const label = { journal: 'Journal', conference: 'Conference', preprint: 'Preprint', review: 'Under review' };
  const sorted = [...pubs].sort((a, b) => (b.year || 9999) - (a.year || 9999));
  body.append(section('Publications',
    h('ol', { class: 'cv-pubs' }, sorted.map((p) =>
      h('li', {},
        h('span', { class: 'cv-pub-title', text: p.title }), '. ',
        h('span', {}, authorNodes(p.authors, self)), '. ',
        h('em', { text: p.venue || p.venueShort || '' }),
        p.year ? `, ${p.year}` : '',
        ` (${p.status || label[p.type] || p.type}).`,
        p.doi ? h('span', { class: 'cv-link' }, ' ', h('a', { href: isUrl(p.doi) ? p.doi : `https://doi.org/${p.doi}`, text: 'DOI' })) : null)))));
}

if (projects?.length) {
  body.append(section('Selected projects',
    ...projects.map((p) =>
      h('article', { class: 'cv-item' },
        h('div', { class: 'cv-row' },
          h('h3', {}, p.title, p.subtitle ? h('span', { class: 'cv-sub', text: ` (${p.subtitle})` }) : null),
          p.github ? h('a', { class: 'cv-date mono', href: p.github, text: strip(p.github) }) : null),
        h('p', { class: 'cv-text', text: p.pitch }),
        p.tags?.length ? h('p', { class: 'cv-tags mono', text: p.tags.join(' · ') }) : null))));
}

if (profile?.interests?.length) {
  body.append(section('Research interests', h('p', { class: 'cv-text', text: profile.interests.map((i) => i.title).join(' · ') })));
}

body.append(h('p', { class: 'cv-foot mono', text: `Last updated ${fmtDate(profile?.lastUpdated || '')}` }));
