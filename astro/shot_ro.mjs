// 截图：ro 首页 桌面/移动端 + faq 页，保存至 messages/work/ro/screenshots
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const OUT = path.join('messages', 'work', 'ro', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [name, vp, url] of [
  ['ro_home_desktop', { width: 1920, height: 1080 }, 'http://localhost:4321/ro/'],
  ['ro_home_mobile', { width: 375, height: 667 }, 'http://localhost:4321/ro/'],
  ['ro_faq_desktop', { width: 1920, height: 1080 }, 'http://localhost:4321/ro/faq/'],
  ['ro_products_mobile', { width: 375, height: 667 }, 'http://localhost:4321/ro/products/lumi/'],
]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log('saved', name);
  await page.close();
}
await browser.close();
