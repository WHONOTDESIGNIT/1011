// ro 罗马尼亚语多浏览器测试：Chromium / Edge / Firefox / WebKit(Safari)
// 4 视口 × 3 页面，检查：
// 1) lang=ro / dir=ltr
// 2) 无横向溢出（不同屏幕尺寸下排版正常）
// 3) 罗马尼亚语变音符正常渲染，无乱码（U+FFFD / mojibake）
// 4) 语言切换器包含罗马尼亚语（Română），可跳转至 /ro/ 并渲染罗马尼亚语内容
import { chromium, firefox, webkit } from 'playwright';

const BASE = 'http://localhost:4321';
const PAGES = ['/ro/', '/ro/products/lumi/', '/ro/faq/'];
const VIEWPORTS = [
  { w: 1920, h: 1080 },
  { w: 1366, h: 768 },
  { w: 375, h: 667 },
  { w: 390, h: 844 },
];

const RO_MARKERS = ['Produse IPL', 'Clienți', 'Întrebări frecvente', 'Despre noi'];

const engines = [
  { name: 'chromium', launch: () => chromium.launch() },
  { name: 'msedge', launch: () => chromium.launch({ channel: 'msedge' }) },
  { name: 'firefox', launch: () => firefox.launch() },
  { name: 'webkit(safari)', launch: () => webkit.launch() },
];

let fail = 0;
let total = 0;
let switcherOk = true;
for (const eng of engines) {
  const browser = await eng.launch();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    for (const p of PAGES) {
      total++;
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const r = await page.evaluate((markers) => {
        const text = document.body.innerText;
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          hasReplacement: document.documentElement.outerHTML.includes('\uFFFD'),
          roMarkers: markers.filter((m) => text.includes(m)),
        };
      }, RO_MARKERS);
      const overflow = r.sw > r.cw;
      const ok = r.lang === 'ro' && r.dir === 'ltr' && !overflow && !r.hasReplacement && r.roMarkers.length > 0;
      if (!ok) {
        fail++;
        console.log(`FAIL ${eng.name} ${vp.w}x${vp.h} ${p} → lang=${r.lang} dir=${r.dir} overflow=${overflow} mojibake=${r.hasReplacement} ro命中=${r.roMarkers.length}`);
      }
    }
    await page.close();
  }

  // 语言切换器：从英文首页打开，切换到罗马尼亚语并验证 /ro/ 页面渲染罗马尼亚语
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const opened = await page.evaluate(() => {
      const triggers = document.querySelectorAll('[data-ls-trigger]');
      for (const t of triggers) {
        if (t && (t.getBoundingClientRect().width > 0) && typeof t.click === 'function') { t.click(); return true; }
      }
      return false;
    });
    if (!opened) { switcherOk = false; console.log(`FAIL ${eng.name} 语言切换器无法打开`); }
    await page.waitForTimeout(300);
    const roClicked = await page.evaluate(() => {
      const candidates = document.querySelectorAll('a[href="/ro/"], a[href*="/ro"], [data-lang="ro"], [data-code="ro"]');
      for (const c of candidates) {
        const txt = (c.textContent || '').toLowerCase();
        if (txt.includes('română') || txt.includes('romanian') || c.getAttribute('href') === '/ro/') {
          if (c.getBoundingClientRect().width > 0 && typeof c.click === 'function') { c.click(); return true; }
        }
      }
      return false;
    });
    if (!roClicked) { switcherOk = false; console.log(`FAIL ${eng.name} 未找到罗马尼亚语切换入口`); }
    await page.waitForURL((u) => u.pathname.startsWith('/ro'), { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const final = await page.evaluate((markers) => {
      const text = document.body.innerText;
      return {
        path: location.pathname,
        lang: document.documentElement.lang,
        hasRo: markers.some((m) => text.includes(m)),
      };
    }, RO_MARKERS);
    const switchOk = (final.path.startsWith('/ro/') || final.path === '/ro') && final.lang === 'ro' && final.hasRo;
    if (!switchOk) { switcherOk = false; console.log(`FAIL ${eng.name} 切换结果 → path=${final.path} lang=${final.lang} hasRo=${final.hasRo}`); }
    else console.log(`OK ${eng.name} 语言切换 → ${final.path} (lang=${final.lang}, 罗马尼亚语渲染 ✓)`);
    await page.close();
  } catch (e) {
    switcherOk = false;
    console.log(`FAIL ${eng.name} 切换异常: ${e.message.split('\n')[0]}`);
  }

  await browser.close();
}
console.log(`\nro 多浏览器测试: ${total - fail}/${total} 通过`);
console.log(`语言切换可用性: ${switcherOk ? 'OK' : 'FAIL'}`);
if (fail || !switcherOk) process.exit(1);
console.log('全部通过 OK');
