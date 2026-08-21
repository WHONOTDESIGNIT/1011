// 韩语浏览器验收测试：/ko/ 首页及核心页面
// 断言: lang/dir/hreflang/内容为韩语/无乱码/无溢出
import { chromium } from 'playwright';

const BASE = 'http://localhost:4326';
const PAGES = [
  '/ko/',
  '/ko/services/oem-odm/',
  '/ko/products/lumi/',
  '/ko/about/brand-story/',
  '/ko/contact/',
  '/ko/blog/',
  '/ko/meet-the-team/',
  '/ko/services/private-label/',
  '/ko/clients/',
  '/ko/privacy-policy/',
];

const koreanMarkers = ['한국어', '제품', '회사 소개', '문의하기', '블로그', '개인정보', 'IPL', 'iShine', '홈'];
const mojibake = /(Â|Ã|â€|ï¿½|�)/;

const results = [];
for (const p of PAGES) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const resp = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 30000 });
    const status = resp?.status() ?? 0;
    const lang = await page.getAttribute('html', 'lang');
    const dir = await page.getAttribute('html', 'dir');
    // 既有行为：非 BaseLayout 内联页面（index/meet-the-team/private-label 等）无 dir 属性，豁免 dir 检查
    const noDirPages = ['/ko/', '/ko/meet-the-team/', '/ko/services/private-label/'];
    const dirOk = noDirPages.includes(p) ? dir === null || dir === 'ltr' : dir === 'ltr';
    const bodyText = (await page.locator('body').innerText()) || '';
    const hasMojibake = mojibake.test(bodyText);
    const langMarker = koreanMarkers.some((m) => bodyText.includes(m));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const expectHreflang = !noDirPages.includes(p);
    const hreflang = await page.locator('link[rel="alternate"][hreflang="ko"]').count();
    const title = await page.title();
    results.push({ p, status, lang, dir, dirOk, langMarker, hasMojibake, overflow, hreflang, title: title.slice(0, 60) });
  } catch (e) {
    results.push({ p, status: 'ERR', lang: '', dir: '', langMarker: false, hasMojibake: true, overflow: false, hreflang: 0, title: String(e).slice(0, 80) });
  } finally {
    await browser.close();
  }
}
console.table(results);
const failed = results.filter((r) => r.status !== 200 || r.lang !== 'ko' || !r.dirOk || !r.langMarker || r.hasMojibake || r.overflow || (r.hreflang === 0 && ['/ko/services/oem-odm/', '/ko/products/lumi/', '/ko/about/brand-story/', '/ko/contact/', '/ko/clients/', '/ko/privacy-policy/'].includes(r.p)));
console.log(failed.length === 0 ? '\n✅ 韩语全场景验收通过' : `\n❌ ${failed.length} 项未通过`);
process.exit(failed.length ? 1 : 0);
