// 校验 sitemap.xml：9 语言 × 51 核心页是否齐全，统计各语言 URL 数
const fs = require('fs');
const xml = fs.readFileSync('dist/sitemap.xml', 'utf8');
const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].replace('https://iplmanufacturer.com', ''));
console.log('sitemap URL 总数:', locs.length);

const LANGS = ['', 'tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl'];
// 51 核心页（sitemap staticPaths）
const CORE = ['', '/about', '/about/brand-story', '/about/company-profile', '/about/manufacturing-capabilities', '/about/quality-control', '/services', '/services/oem-odm', '/services/product-design', '/services/production-assembly', '/services/packaging-logistics', '/services/no-moq', '/services/logo-printing', '/services/box-custom', '/services/user-manual-guide-custom', '/services/dropshipping', '/services/private-label', '/services/build-a-new-ipl', '/services/find-a-technology-partner', '/services/maintain-or-fix-ipl-project', '/products', '/products/venus', '/products/lumi', '/products/lumi-2', '/products/hestia', '/products/alpha', '/products/hebe', '/products/emerald', '/products/themis', '/products/eirene', '/products/euno', '/products/wooden', '/products/helix', '/components', '/components/lamp-cartridges', '/components/optical-filters', '/components/cooling-system', '/components/power-supply', '/clients', '/clients/costco-canada-ipl', '/clients/happyskinco-ipl', '/clients/ku2-ipl', '/clients/roseskin-ipl', '/catalogue', '/ipl-hair-removal-is-safe', '/faq', '/contact', '/meet-the-team', '/marketplace', '/privacy-policy', '/blog'];
console.log('核心页数:', CORE.length);

let ok = true;
for (const l of LANGS) {
  const prefix = l === '' ? '' : '/' + l;
  const missing = CORE.filter((c) => !locs.includes(prefix + c));
  const blogs = locs.filter((x) => x.startsWith(prefix + '/blog/') && x !== prefix + '/blog');
  const langUrls = locs.filter((x) => l === '' ? (!x.includes('/') || x.startsWith('/blog/')) : x.startsWith(prefix + '/'));
  console.log(`${l || 'en'}: 核心 ${CORE.length - missing.length}/${CORE.length}, 博客 ${blogs.length} 篇, 语言 URL 合计 ${langUrls.length}${missing.length ? ' 缺: ' + missing.join(',') : ' ✓'}`);
  if (missing.length) ok = false;
}
// 额外检查：是否有 9 语言之外的前缀
const others = locs.filter((x) => LANGS.every((l) => !(x === '/' + l || x.startsWith('/' + l + '/'))));
console.log('\n语言前缀之外的 URL:', others.length, others.slice(0, 10));
console.log(ok ? '\n✅ sitemap 覆盖 9 语言 × 51 核心页完整' : '\n❌ 存在缺失');
