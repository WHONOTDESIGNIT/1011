// nl 荷兰语多浏览器测试：Chromium / Edge / Firefox / WebKit(Safari)
// 4 视口 × 3 页面，检查：
// 1) lang=nl / dir=ltr
// 2) 无横向溢出
// 3) 语言切换器包含荷兰语（Nederlands），可跳转至 /nl/ 并渲染荷兰语内容
import { chromium, firefox, webkit } from 'playwright';

const BASE = 'http://localhost:4321';
const PAGES = ['/nl/', '/nl/products/lumi/', '/nl/faq/'];
const VIEWPORTS = [
  { w: 1920, h: 1080 },
  { w: 1366, h: 768 },
  { w: 375, h: 667 },
  { w: 390, h: 844 },
];

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
      const r = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      const overflow = r.sw > r.cw;
      const ok = r.lang === 'nl' && r.dir === 'ltr' && !overflow;
      if (!ok) {
        fail++;
        console.log(`FAIL ${eng.name} ${vp.w}x${vp.h} ${p} → lang=${r.lang} dir=${r.dir} sw=${r.sw} cw=${r.cw} overflow=${overflow}`);
      }
    }
    await page.close();
  }

  // 语言切换器：从英文首页打开，切换到荷兰语并验证 /nl/ 页面渲染荷兰语
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    // 打开语言切换器（header 可见实例优先）
    const opened = await page.evaluate(() => {
      const triggers = document.querySelectorAll('[data-ls-trigger]');
      for (const t of triggers) {
        if (t && (t.getBoundingClientRect().width > 0) && typeof t.click === 'function') { t.click(); return true; }
      }
      return false;
    });
    if (!opened) { switcherOk = false; console.log(`FAIL ${eng.name} 语言切换器无法打开`); }
    await page.waitForTimeout(300);
    // 找荷兰语入口并点击
    const nlClicked = await page.evaluate(() => {
      const candidates = document.querySelectorAll('a[href="/nl/"], a[href*="/nl"], [data-lang="nl"], [data-code="nl"]');
      for (const c of candidates) {
        const txt = (c.textContent || '').toLowerCase();
        if (txt.includes('nederlands') || txt.includes('dutch') || c.getAttribute('href') === '/nl/') {
          if (c.getBoundingClientRect().width > 0 && typeof c.click === 'function') { c.click(); return true; }
        }
      }
      return false;
    });
    if (!nlClicked) { switcherOk = false; console.log(`FAIL ${eng.name} 未找到荷兰语切换入口`); }
    // 等待导航完成（点击触发整页跳转）
    await page.waitForURL((u) => u.pathname.startsWith('/nl'), { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const final = await page.evaluate(() => ({
      path: location.pathname,
      lang: document.documentElement.lang,
      hasDutch: (document.body.innerText || '').includes('Producten'),
    }));
    const switchOk = (final.path.startsWith('/nl/') || final.path === '/nl') && final.lang === 'nl' && final.hasDutch;
    if (!switchOk) { switcherOk = false; console.log(`FAIL ${eng.name} 切换结果 → path=${final.path} lang=${final.lang} hasDutch=${final.hasDutch}`); }
    else console.log(`OK ${eng.name} 语言切换 → ${final.path} (lang=${final.lang}, 荷兰语渲染 ✓)`);
    await page.close();
  } catch (e) {
    switcherOk = false;
    console.log(`FAIL ${eng.name} 切换异常: ${e.message.split('\n')[0]}`);
  }

  await browser.close();
}
console.log(`\nnl 多浏览器测试: ${total - fail}/${total} 通过`);
console.log(`语言切换可用性: ${switcherOk ? 'OK' : 'FAIL'}`);
if (fail || !switcherOk) process.exit(1);
console.log('全部通过 OK');
