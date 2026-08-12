// pt-PT 多浏览器冒烟测试：Chromium / Firefox / WebKit（Edge 复用 Chromium 内核）
// 4 视口 × 3 页面引擎，检查 lang / dir / 横向溢出
import { chromium, firefox, webkit } from 'playwright';

const BASE = 'http://localhost:56212';
const PAGES = ['/pt-PT/', '/pt-PT/products/lumi/', '/pt-PT/faq/'];
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
      const ok = r.lang === 'pt-PT' && r.dir === 'ltr' && !overflow;
      if (!ok) {
        fail++;
        console.log(`FAIL ${eng.name} ${vp.w}x${vp.h} ${p} → lang=${r.lang} dir=${r.dir} sw=${r.sw} cw=${r.cw} overflow=${overflow}`);
      }
    }
    await page.close();
  }
  await browser.close();
}
console.log(`\n多浏览器测试: ${total - fail}/${total} 通过 ${fail ? `, ${fail} 失败` : '，全部通过 OK'}`);
process.exit(fail ? 1 : 0);
