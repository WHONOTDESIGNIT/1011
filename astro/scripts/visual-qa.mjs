import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const qaDir = join(__dirname, '..', 'docs', 'design-references', 'qa');
mkdirSync(qaDir, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
const CLONE_URL = 'http://localhost:4321/develo-clone';
const ORIGINAL_URL = 'https://www.develodesign.co.uk/';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Screenshot clone
  console.log('Screenshotting clone...');
  const clonePage = await browser.newPage();
  await clonePage.setViewportSize(VIEWPORT);
  await clonePage.goto(CLONE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await clonePage.waitForTimeout(3000);
  await clonePage.screenshot({ path: join(qaDir, 'clone-full.png'), fullPage: true });
  await clonePage.close();

  // Screenshot original
  console.log('Screenshotting original...');
  const origPage = await browser.newPage();
  await origPage.setViewportSize(VIEWPORT);
  await origPage.goto(ORIGINAL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await origPage.waitForTimeout(5000);
  await origPage.screenshot({ path: join(qaDir, 'original-full.png'), fullPage: true });

  // Extract key dimensions from both for comparison
  const cloneDims = await (async () => {
    const p = await browser.newPage();
    await p.setViewportSize(VIEWPORT);
    await p.goto(CLONE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForTimeout(2000);
    const dims = await p.evaluate(() => {
      const sections = [
        '.trust-bar', '.site-header', '.hero', '.hero-wrapper', '.hero-content-card',
        '.what-we-do', '.our-clients', '.stat-cards', '.expertise', '.our-work'
      ];
      const result = {};
      sections.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) { result[sel] = null; return; }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        result[sel] = {
          offsetTop: el.offsetTop,
          height: r.height,
          padding: cs.padding,
          maxWidth: cs.maxWidth,
          display: cs.display,
        };
      });
      // Also get heading styles
      const h1 = document.querySelector('h1');
      if (h1) {
        const cs = getComputedStyle(h1);
        result['h1'] = { fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily, letterSpacing: cs.letterSpacing, color: cs.color };
      }
      return result;
    });
    await p.close();
    return dims;
  })();

  const origDims = await (async () => {
    const p = await browser.newPage();
    await p.setViewportSize(VIEWPORT);
    await p.goto(ORIGINAL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForTimeout(5000);
    const dims = await p.evaluate(() => {
      const sections = [
        '.trust-signals-container', '.navbar', '.hero-section', '.hero-wrapper', '.hero-content-card',
        '.usp-accordion-bleed', '.our-clients-section', '.stat-cards-section', '.hero-content-logos', '.our-work-section'
      ];
      const result = {};
      sections.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) { result[sel] = null; return; }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        result[sel] = {
          offsetTop: el.offsetTop,
          height: r.height,
          padding: cs.padding,
          maxWidth: cs.maxWidth,
          display: cs.display,
        };
      });
      const h1 = document.querySelector('h1');
      if (h1) {
        const cs = getComputedStyle(h1);
        result['h1'] = { fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily, letterSpacing: cs.letterSpacing, color: cs.color };
      }
      return result;
    });
    await p.close();
    return dims;
  })();

  console.log('\n=== DIMENSION COMPARISON ===');
  console.log('Section                 | Clone                  | Original');
  console.log('------------------------|------------------------|------------------------');
  for (const key of Object.keys(cloneDims)) {
    const c = cloneDims[key];
    const o = origDims[key];
    if (!c || !o) continue;
    const match = JSON.stringify(c) === JSON.stringify(o) ? '✓' : '✗';
    console.log(`${match} ${key.padEnd(18)} | ${JSON.stringify(c).padEnd(35).slice(0,35)} | ${JSON.stringify(o).slice(0,35)}`);
  }

  await browser.close();
  console.log('\nScreenshots saved to docs/design-references/qa/');
  console.log('Done.');
})();
