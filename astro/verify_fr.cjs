// 验证 fr 构建产物：标题 / lang / 法语导航命中 / 英文导航残留
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'fr');
const files = [
  'index.html',
  'services/index.html',
  'products/index.html',
  'about/index.html',
  'contact/index.html',
  'faq/index.html',
  'components/index.html',
  'meet-the-team/index.html',
  'privacy-policy/index.html',
  'catalogue/index.html',
  'blog/index.html',
];

// 法语导航关键词（来自 fr.json nav.*；Services/Clients/Contact/Blog/FAQ 为法英同形词，仍可确认已渲染）
const frNav = ['Produits IPL', 'Composants', 'À propos', 'Clients', 'Blog', 'FAQ', 'Contact'];
// 英文导航残留（有明确法语对应词的英文项；同形词不检测）
const enNav = ['>Products<', '>Components<', '>About<', '>Home<', '>Our Clients<', '>Meet the Team<'];

let allOk = true;
for (const rel of files) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) {
    console.log(`[缺失] ${rel}`);
    allOk = false;
    continue;
  }
  const html = fs.readFileSync(f, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const lang = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1] || '';
  const frHits = frNav.filter((w) => html.includes(w));
  const enHits = enNav.filter((w) => html.includes(w));
  const ok = lang === 'fr' && enHits.length === 0;
  if (!ok) allOk = false;
  console.log(`--- ${rel}`);
  console.log(`  lang=${lang} | title=${title.slice(0, 90)}`);
  console.log(`  FR 导航命中: ${frHits.join(',') || '无'}`);
  console.log(`  EN 导航残留: ${enHits.join(',') || '无'} ${ok ? 'OK' : 'FAIL'}`);
}
console.log(allOk ? '\n全部通过 OK' : '\n存在失败项 FAIL');
process.exit(allOk ? 0 : 1);
