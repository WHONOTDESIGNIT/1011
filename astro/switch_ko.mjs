// 韩语语言切换实时生效测试
// 覆盖: 切换器含 한국어 / 点击后跳 /ko/ 且 localStorage 记录 / 无二次重定向 /ko/ko
import { chromium } from 'playwright';

const BASE = 'http://localhost:4326';
const results = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. 从英文首页打开语言切换器
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.click('[data-ls-trigger]');
await page.waitForSelector('[data-ls-panel].ls--visible');
const optionKo = page.locator('[data-ls-panel].ls--visible [data-ls-option][hreflang="ko"]');
results.push(['切换器含 한국어 选项', (await optionKo.count()) >= 1]);

// 2. 点击 한국어 → 应跳转 /ko/ 且 localStorage=ko
await optionKo.first().click();
await page.waitForTimeout(2500);
const urlAfter = new URL(page.url()).pathname;
results.push(['点击后 URL 为 /ko/ 且无 /ko/ko', urlAfter === '/ko/' || urlAfter === '/ko']);
console.log('  实际 URL:', urlAfter);
const stored = await page.evaluate(() => localStorage.getItem('ishine_lang'));
results.push(['localStorage 记录 ko', stored === 'ko']);

// 3. 在 /ko/ 页面刷新不应被重定向到 /ko/ko
await page.reload({ waitUntil: 'networkidle' });
const urlReload = new URL(page.url()).pathname;
console.log('  刷新后 URL:', urlReload);
results.push(['/ko/ 刷新后无二次重定向', urlReload === '/ko/' || urlReload === '/ko']);

// 4. 韩语页面 html lang 正确
results.push(['/ko/ html lang=ko', (await page.getAttribute('html', 'lang')) === 'ko']);

// 5. 从 /ko/ 切回 English
await page.click('[data-ls-trigger]');
await page.waitForSelector('[data-ls-panel].ls--visible');
await page.locator('[data-ls-panel].ls--visible [data-ls-option][hreflang="en"]').first().click();
await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 });
results.push(['从 ko 切回 en 成功', new URL(page.url()).pathname === '/']);

// 6. 语言切换器面板标题为韩语（新 context 无偏好干扰）
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE + '/ko/', { waitUntil: 'networkidle' });
const url6 = new URL(page2.url()).pathname;
console.log('  步骤6 URL:', url6);
const panelTitle = await (async () => {
  await page2.locator('[data-ls-trigger]').first().click();
  await page2.waitForSelector('[data-ls-panel].ls--visible');
  return page2.locator('[data-ls-panel].ls--visible .ls-title').innerText();
})().catch(() => '');
console.log('  面板标题:', JSON.stringify(panelTitle));
results.push(['切换器面板为韩语', panelTitle.includes('언어 선택') || panelTitle.includes('언어')]);
await ctx2.close();

await browser.close();
console.table(results.map(([name, ok]) => ({ name, ok: ok ? '✅' : '❌' })));
const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\n✅ 语言切换测试通过' : `\n❌ ${failed.length} 项失败`);
process.exit(failed.length ? 1 : 0);
