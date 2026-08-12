// he 可访问性语义检查：lang/dir、导航 aria-label、主要 landmark、无重复 id、img alt
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://localhost:56212/he/', { waitUntil: 'load' });
const r = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')];
  const missingAlt = imgs.filter((i) => i.getAttribute('alt') === null).length;
  const ariaNav = [...document.querySelectorAll('nav[aria-label]')].map((n) => n.getAttribute('aria-label')).slice(0, 5);
  const landmarks = ['header', 'footer', 'main', 'nav'].map((t) => `${t}:${document.querySelectorAll(t).length}`).join(' | ');
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
  const buttons = [...document.querySelectorAll('button')].filter((b) => !b.getAttribute('aria-label') && !b.textContent.trim()).length;
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    imgTotal: imgs.length,
    missingAlt,
    ariaNav,
    landmarks,
    dupIds: dupIds.slice(0, 5),
    unnamedIconButtons: buttons,
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
