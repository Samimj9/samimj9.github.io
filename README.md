# samimj9.github.io

Personal academic website of **Sami Al Majanini**: plain HTML, CSS and vanilla JS, no build step, served by GitHub Pages from `main` (root). Live at <https://samimj9.github.io>.

All content lives in `data/*.json`; JavaScript renders it. You normally never touch the HTML.

## File structure

```
index.html            single-page site (skeleton, SEO tags, JSON-LD)
cv.html               web CV rendered from the same JSON, prints cleanly to A4
404.html              styled not-found page
data/                 ALL CONTENT: profile, news, publications, projects, experience, education (.json)
assets/
  css/style.css       design tokens, themes, layout   (cv.css = CV + print styles)
  js/main.js          renders sections, nav, filters  (lib.js = helpers/icons, cv.js, hero-canvas.js)
  fonts/              self-hosted Newsreader, Inter, JetBrains Mono (woff2)
  img/                profile photo      img/projects/  project images
  cv.pdf              downloadable CV (replace with your own)
  og-image.png        1200x630 social card
tools/                dev-only: templates + script to regenerate og-image / icons
favicon.svg, favicon.ico, apple-touch-icon.png, sitemap.xml, robots.txt
```

Find everything left to fill in: `grep -rn "TODO" data index.html`

## Editing content

Keep valid JSON (double quotes, commas between items, no trailing commas). Fields starting with `_` (e.g. `_todo`) are notes and are ignored. Empty or missing optional fields are simply not shown.

| File | What it controls |
|---|---|
| `profile.json` | name, role line, research statement, photo, about text, "at a glance" facts, research-interest cards, links, location, contact blurb, `lastUpdated` |
| `news.json` | array, **newest first**. `{ "date": "2026-03", "text": "…", "link": "https://…" }` (`link` optional). Dates can be `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. 5 are shown, the rest behind "Show all". |
| `publications.json` | see below |
| `projects.json` | `title, subtitle?, initials, pitch, tags[], github, demo?, image?, accent` |
| `experience.json` / `education.json` | `role/degree, org/school, location, period, summary, points[]` |

**Email** is split (`"email": {"user": "you", "domain": "example.com"}`) and only assembled in the browser, so scrapers don't see it. **ORCID**: set `links.orcid` to your URL, and add it to `sameAs` in the JSON-LD block of `index.html`.

### Add a publication

Add an object to `data/publications.json` (any order; grouped by year automatically; no `year` => "In progress"):

```json
{
  "id": "almajanini2026example",
  "type": "journal",
  "year": 2026,
  "title": "Paper title",
  "authors": ["S. Al Majanini", "A. Coauthor"],
  "venue": "Full venue name",
  "venueShort": "Short Venue 2026",
  "status": "",
  "pdf": "https://…", "doi": "10.1109/…", "code": "https://github.com/…",
  "bibtex": "@article{…}"
}
```
`type` is `journal`, `conference`, `preprint` or `review` (shown as "Under review"). The PDF / DOI / Code / BibTeX buttons appear only if the field has a value. Your name ("S. Al Majanini" or "Sami Al Majanini", also "Al Majanini, S.") is bolded automatically; add variants to `selfNames` in `profile.json`. Use `\n` for line breaks inside `bibtex`.

### Add a news item

Put a new object **at the top** of `data/news.json`.

## Upload a photo from iPhone

1. Open **github.com** in Safari, go to this repo, then the **`assets/img`** folder (project images: `assets/img/projects`).
2. **Add file → Upload files**, choose the photo, **Commit changes**.
3. Edit `data/profile.json` and set `"photo"` to the uploaded filename, e.g. `"assets/img/IMG_1234.jpeg"` (for a project: `"image": "assets/img/projects/cortextrace.png"` in `projects.json`).
4. Wait about a minute for Pages to redeploy, then hard-refresh.

`.jpg .jpeg .png .webp` all work. The photo is cropped with `object-fit: cover`; adjust framing with `"photoPosition"` (default `"center 25%"`, e.g. `"center 40%"` to move the crop down) and edit `photoAlt`. If the file is missing or the field is empty, an "SM" monogram is shown instead. Tip: very large phone photos are fine but slow the page; export at about 1200 px wide if you can. Projects without an image get a generated cover in their `accent` colour.

## Theme, animation, CV

* Light/dark follows the OS; the toggle stores your choice in `localStorage`.
* The hero EEG animation pauses off-screen and is static under `prefers-reduced-motion`.
* **CV:** `cv.html` prints to A4 (Print / Save as PDF). `assets/cv.pdf` is what the hero button links to; regenerate it from `cv.html` (or upload your own) when content changes.
* **Social card:** `tools/og-template.html` (uses the profile photo) is rendered to `assets/og-image.png`; to regenerate, run `node tools/make-assets.cjs` with Playwright installed.

## Local preview

```
python -m http.server 8000   # then open http://localhost:8000
```
(Opening `index.html` directly from disk will not work because JSON is loaded with `fetch`.)
