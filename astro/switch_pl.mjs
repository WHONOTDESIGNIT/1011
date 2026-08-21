// 波兰语语言切换实时生效测试
// 覆盖: 切换器含 Polish / 点击后跳 /pl/ 且 localStorage 记录 / 无二次重定向 /pl/pl
import { chromium } from 'playwright';

const BASE = 'http://localhost:4326';
const results = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. 从英文首页打开语言切换器
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.click('[data-ls-trigger]');
await page.waitForSelector('[data-ls-panel].ls--visible');
const optionPl = page.locator('[data-ls-panel].ls--visible [data-ls-option][hreflang="pl"]');
results.push(['切换器含 Polish 选项', (await optionPl.count()) >= 1]);

// 2. 点击 Polish → 应跳转 /pl/ 且 localStorage=pl
await optionPl.first().click();
await page.waitForTimeout(2500);
const urlAfter = new URL(page.url()).pathname;
results.push(['点击后 URL 为 /pl/ 且无 /pl/pl', urlAfter === '/pl/' || urlAfter === '/pl']);
console.log('  实际 URL:', urlAfter);
const stored = await page.evaluate(() => localStorage.getItem('ishine_lang'));
results.push(['localStorage 记录 pl', stored === 'pl']);

// 3. 在 /pl/ 页面刷新不应被重定向到 /pl/pl
await page.reload({ waitUntil: 'networkidle' });
const urlReload = new URL(page.url()).pathname;
console.log('  刷新后 URL:', urlReload);
results.push(['/pl/ 刷新后无二次重定向', urlReload === '/pl/' || urlReload === '/pl']);

// 4. 波兰语页面 html lang 正确
results.push(['/pl/ html lang=pl', (await page.getAttribute('html', 'lang')) === 'pl']);

// 5. 从 /pl/ 切回 English
await page.click('[data-ls-trigger]');
await page.waitForSelector('[data-ls-panel].ls--visible');
await page.locator('[data-ls-panel].ls--visible [data-ls-option][hreflang="en"]').first().click();
await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 });
results.push(['从 pl 切回 en 成功', new URL(page.url()).pathname === '/']);

// 6. 语言切换器面板标题为波兰语（新 context 无偏好干扰）
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE + '/pl/', { waitUntil: 'networkidle' });
const url6 = new URL(page2.url()).pathname;
console.log('  步骤6 URL:', url6);
const panelTitle = await (async () => {
  await page2.locator('[data-ls-trigger]').first().click();
  await page2.waitForSelector('[data-ls-panel].ls--visible');
  return page2.locator('[data-ls-panel].ls--visible .ls-title').innerText();
})().catch(() => '');
console.log('  面板标题:', JSON.stringify(panelTitle));
results.push(['切换器面板为波兰语', panelTitle.includes('Wybierz język') || panelTitle.includes('Język')]);
await ctx2.close();

await browser.close();
console.table(results.map(([name, ok]) => ({ name, ok: ok ? '✅' : '❌' })));
const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\n✅ 语言切换测试通过' : `\n❌ ${failed.length} 项失败`);
process.exit(failed.length ? 1 : 0);
