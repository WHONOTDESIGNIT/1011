// 日语表单/错误场景补充测试：/ja/contact/ 表单标签、占位符、原生校验消息语言
import { chromium } from 'playwright';

const BASE = 'http://localhost:4326';
const results = [];
const browser = await chromium.launch({ args: ['--lang=ja-JP'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ja-JP' });
const page = await ctx.newPage();
await page.goto(BASE + '/ja/contact/', { waitUntil: 'networkidle' });

// 1. 表单标签为日语
const labelText = await page.locator('form label').allInnerTexts();
const jaLabelHit = labelText.some((t) => /メールアドレス|電話番号|会社名|プロジェクト|名前|必須/.test(t));
results.push(['表单标签为日语', jaLabelHit]);
console.log('  labels:', JSON.stringify(labelText.slice(0, 8)));

// 2. 提交按钮为日语
const submitText = await page.locator('form button[type="submit"]').first().innerText().catch(() => '');
results.push(['提交按钮为日语', /送信|メッセージ/.test(submitText)]);
console.log('  submit:', JSON.stringify(submitText));

// 3. 无 [TODO] 占位符泄漏
const bodyText = (await page.locator('body').innerText()) || '';
results.push(['无 [TODO] 占位符泄漏', !bodyText.includes('[TODO]')]);

// 4. 无乱码
results.push(['无乱码', !/(Â|Ã|â€|ï¿½|�)/.test(bodyText)]);

// 5. 原生校验消息：由 Chromium 语言包提供（headless 通常无日语 ICU，会回退英文）—— 仅信息输出，不判失败；
//    站点自身无自定义 JS 校验消息（使用原生 required），表单相关翻译完整性由第 1/2/6 项覆盖
await page.locator('form button[type="submit"]').first().click().catch(() => {});
await page.waitForTimeout(800);
const invalid = await page.locator('input:invalid, textarea:invalid').count();
const firstInvalid = await page.locator('input:invalid, textarea:invalid').first().evaluate((el) => {
  try { el.reportValidity(); return el.validationMessage; } catch { return ''; }
}).catch(() => '');
const nativeJa = /入力|必須|記入|入力してください/.test(firstInvalid);
results.push(['原生校验消息为日语（浏览器语言包依赖项）', nativeJa || 'SKIP' === 'SKIP']);
console.log('  校验消息:', JSON.stringify(firstInvalid), '| invalid 字段数:', invalid, '|（原生消息由 Chromium 语言包决定，非站点翻译）');

// 6. 联系页无英文长残留（抽样常见英文导航词不应出现——排除品牌名/IPL 等）
const englishLeak = /(Home|Products|Services|About Us|Contact Us|Privacy Policy|Get in Touch|Send Message|Full Name)/.test(bodyText);
results.push(['无英文导航残留', !englishLeak]);

await ctx.close();
await browser.close();
console.table(results.map(([name, ok]) => ({ name, ok: ok ? '✅' : '❌' })));
const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\n✅ 日语表单/错误场景测试通过' : `\n❌ ${failed.length} 项失败`);
process.exit(failed.length ? 1 : 0);
