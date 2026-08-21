// 韩语表单/错误场景补充测试：/ko/contact/ 表单标签、占位符、提交按钮、无 TODO 泄漏、无英文残留
import { chromium } from 'playwright';

const BASE = 'http://localhost:4326';
const results = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + '/ko/contact/', { waitUntil: 'networkidle' });

// 1. 表单标签为韩语
const labelText = await page.locator('form label').allInnerTexts();
const koLabelHit = labelText.some((t) => /메일|이메일|회사명|전화번호|프로젝트|이름|성명|필수/.test(t));
results.push(['表单标签为韩语', koLabelHit]);
console.log('  labels:', JSON.stringify(labelText.slice(0, 8)));

// 2. 提交按钮为韩语
const submitText = await page.locator('form button[type="submit"]').first().innerText().catch(() => '');
results.push(['提交按钮为韩语', /제출|보내기|문의/.test(submitText)]);
console.log('  submit:', JSON.stringify(submitText));

// 3. 无 [TODO] 占位符泄漏
const bodyText = (await page.locator('body').innerText()) || '';
results.push(['无 [TODO] 占位符泄漏', !bodyText.includes('[TODO]')]);

// 4. 无乱码
results.push(['无乱码', !/(Â|Ã|â€|ï¿½|�)/.test(bodyText)]);

// 5. 联系页无英文导航残留
const englishLeak = /(Home|Products|Services|About Us|Contact Us|Privacy Policy|Get in Touch|Send Message|Full Name)/.test(bodyText);
results.push(['无英文导航残留', !englishLeak]);

await ctx.close();
await browser.close();
console.table(results.map(([name, ok]) => ({ name, ok: ok ? '✅' : '❌' })));
const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\n✅ 韩语表单/错误场景测试通过' : `\n❌ ${failed.length} 项失败`);
process.exit(failed.length ? 1 : 0);
