const fs = require('fs');
const d = 'astro/dist/';
// 检查 tr 首页和服务页是否渲染土耳其语
const checks = [
  ['tr/index.html', 'TR HOME'],
  ['tr/services/index.html', 'TR SERVICES'],
  ['tr/about/index.html', 'TR ABOUT'],
  ['tr/products/index.html', 'TR PRODUCTS'],
  ['tr/blog/index.html', 'TR BLOG'],
];
let out = '';
for (const [p, label] of checks) {
  if (!fs.existsSync(d + p)) { out += label + ': MISSING\n'; continue; }
  const html = fs.readFileSync(d + p, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  // 抽取可见文本里的英文残留检查：匹配常见英文词
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const enPattern = /\b(Home|About Us|Products|Services|Contact|Our|Learn More|Get Started|View All|Blog|Contact Us|Privacy Policy|Terms)\b/g;
  const matches = bodyText.match(enPattern) || [];
  const uniq = [...new Set(matches)];
  out += label + ': title=' + title + ' | 英文词=' + JSON.stringify(uniq) + '\n';
}
fs.writeFileSync('verify_tr_pages.txt', out);
console.log('written');
