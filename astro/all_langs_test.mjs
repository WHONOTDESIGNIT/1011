// 全语言 4 引擎测试：Chromium / Edge / Firefox / WebKit(Safari)
// 覆盖 9 种已启用语言（en 根目录 + tr/ar/es/fr/ru/he/pt-PT/nl）× 4 视口 × 关键页面
// 检查：lang / dir（ar/he 应为 rtl）/ 横向溢出 / 关键 flex 容器自适应（页脚网格、导航、卡片网格）
import { chromium, firefox, webkit } from 'playwright';

const BASE = 'http://localhost:4321';
const LOCALES = [
  { prefix: '', code: 'en', dir: 'ltr' },
  { prefix: '/tr', code: 'tr', dir: 'ltr' },
  { prefix: '/ar', code: 'ar', dir: 'rtl' },
  { prefix: '/es', code: 'es', dir: 'ltr' },
  { prefix: '/fr', code: 'fr', dir: 'ltr' },
  { prefix: '/ru', code: 'ru', dir: 'ltr' },
  { prefix: '/he', code: 'he', dir: 'rtl' },
  { prefix: '/pt-PT', code: 'pt-PT', dir: 'ltr' },
  { prefix: '/nl', code: 'nl', dir: 'ltr' },
];
const PAGES = ['/', '/products/lumi/', '/faq/', '/contact/'];
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
const failures = [];
for (const eng of engines) {
  const browser = await eng.launch();
  for (const loc of LOCALES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
      for (const p of PAGES) {
        total++;
        const url = `${BASE}${loc.prefix}${p}`;
        try {
          await page.goto(url, { waitUntil: 'load' });
          await page.waitForTimeout(300);
        } catch (e) {
          fail++;
          failures.push(`${eng.name} ${vp.w}x${vp.h} ${url} → 加载失败: ${e.message.split('\n')[0]}`);
          continue;
        }
        const r = await page.evaluate(() => {
          const cw = document.documentElement.clientWidth;
          const sw = document.documentElement.scrollWidth;
          // 关键 flex 容器检测：.site-footer 网格、产品卡片网格、导航
          const flexChecks = {};
          const targets = {
            footer: '.site-footer',
            nav: '.site-nav',
            productGrid: '.product-grid, .products-grid, [class*="product-grid"]',
          };
          for (const [k, sel] of Object.entries(targets)) {
            const el = document.querySelector(sel);
            if (el) {
              const r = el.getBoundingClientRect();
              flexChecks[k] = { right: Math.round(r.right), cw, overflowRight: r.right > cw + 1 };
            }
          }
          return {
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            sw,
            cw,
            overflow: sw > cw,
            flexChecks,
          };
        });
        const langOk = r.lang === loc.code;
        const dirOk = r.dir === loc.dir;
        const overflowOk = !r.overflow;
        const flexIssues = Object.values(r.flexChecks).filter((f) => f && f.overflowRight);
        const ok = langOk && dirOk && overflowOk && flexIssues.length === 0;
        if (!ok) {
          fail++;
          failures.push(`${eng.name} ${vp.w}x${vp.h} ${url} → lang=${r.lang}(exp ${loc.code}) dir=${r.dir}(exp ${loc.dir}) overflow=${r.overflow} flex=${JSON.stringify(r.flexChecks)}`);
        }
      }
      await page.close();
    }
  }
  await browser.close();
  console.log(`完成引擎: ${eng.name}`);
}
console.log(`\n全语言 4 引擎测试: ${total - fail}/${total} 通过`);
if (failures.length) {
  console.log('失败明细:');
  failures.forEach((f) => console.log('  ' + f));
  process.exit(1);
} else {
  console.log('全部通过 OK');
}
