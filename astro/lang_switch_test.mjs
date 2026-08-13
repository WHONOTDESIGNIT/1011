// 语言切换端到端验证：打开 /pt-BR/ 首页 → 打开语言切换器 → 点 English → 验证 localStorage + URL 变化
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

// 1. 访问 pt-BR 首页，确认切换器存在且 pt-BR 高亮
await page.goto('http://localhost:56212/pt-BR/', { waitUntil: 'load' });
const triggerLabel = await page.textContent('[data-ls-trigger] .ls-trigger-label');
console.log('pt-BR 页切换器当前语言:', triggerLabel);

// 2. 打开切换器（header 版可见实例）
const clicked = await page.evaluate(() => {
  const triggers = [...document.querySelectorAll('[data-ls-trigger]')];
  const vis = triggers.find((t) => { const r = t.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  if (vis) { vis.click(); return true; }
  return false;
});
if (!clicked) throw new Error('无可见的切换器触发器');
await page.waitForSelector('.ls-panel.ls--visible');

// 3. 检查可选语言数（应为 8：en/tr/ar/es/fr/ru/he/pt-BR）
const enabled = await page.evaluate(() => [...document.querySelectorAll('[data-ls-option]')].map((a) => a.getAttribute('hreflang')));
console.log('可选语言:', JSON.stringify(enabled));

// 4. 点击 English 链接，验证 localStorage 持久化 + 跳转到 /
const clickEn = await page.evaluate(() => {
  const opts = [...document.querySelectorAll('[data-ls-option][hreflang="en"]')];
  const vis = opts.find((t) => { const r = t.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  if (vis) { vis.click(); return true; }
  return false;
});
if (!clickEn) throw new Error('未找到可见的 English 选项');
await page.waitForTimeout(800);
const stored = await page.evaluate(() => localStorage.getItem('ishine_lang'));
console.log('点击 English 后 localStorage.ishine_lang =', stored);
console.log('当前 URL:', page.url());

await browser.close();
