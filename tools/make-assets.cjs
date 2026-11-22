// Regenerates assets/og-image.png, apple-touch-icon.png and favicon.ico. Needs Playwright + Pillow (dev only, not part of the site).
//   node tools/make-assets.cjs
const { chromium } = require('playwright');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch();
  const shot = async (rel, out, w, h) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(root, rel)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(root, out) }); await p.close();
  };
  await shot('tools/og-template.html', 'assets/og-image.png', 1200, 630);
  await shot('tools/icon.html?size=180&r=0', 'apple-touch-icon.png', 180, 180);
  await shot('tools/icon.html?size=64&r=14', 'tools/_icon64.png', 64, 64);
  await b.close();
  execFileSync('python3', ['-c', `from PIL import Image;Image.open(r'${root}/tools/_icon64.png').save(r'${root}/favicon.ico',sizes=[(32,32),(16,16)])`]);
  require('node:fs').unlinkSync(path.join(root, 'tools/_icon64.png'));
})();
