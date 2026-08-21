// 调试: /pl/ 首页语言切换器面板内容
import { chromium } from 'playwright';
const BASE = 'http://localhost:4326';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + '/pl/', { waitUntil: 'networkidle' });
console.log('URL:', page.url());
const triggerCount = await page.locator('[data-ls-trigger]').count();
console.log('triggers:', triggerCount);
await page.locator('[data-ls-trigger]').first().click();
await page.waitForSelector('[data-ls-panel].ls--visible');
const text = await page.locator('[data-ls-panel].ls--visible').innerText();
console.log('PANEL TEXT:\n' + text.slice(0, 300));
await browser.close();
