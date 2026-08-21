// 验证 ro 构建产物：lang / dir(ltr) / 罗马尼亚语导航命中 / 英文导航残留 / 变音符
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'ro');
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

// 罗马尼亚语导航标签（取自 ro.json nav.*）
const roNav = ['Produse IPL', 'Servicii', 'Componente', 'Clienți', 'Blog', 'Despre noi', 'Întrebări frecvente', 'Contact'];
const enNav = ['>Products<', '>Services<', '>Components<', '>Clients<', '>About<'];

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
  const dir = (html.match(/<html[^>]*dir="([^"]*)"/) || [])[1] || '';
  const roHits = roNav.filter((w) => html.includes(w));
  const enHits = enNav.filter((w) => html.includes(w));
  // 变音符存在性：ș ț ă â î
  const diacritics = ['ș', 'ț', 'ă', 'â', 'î'].filter((c) => html.includes(c));
  const ok = lang === 'ro' && dir === 'ltr' && enHits.length === 0;
  if (!ok) allOk = false;
  console.log(`--- ${rel}`);
  console.log(`  lang=${lang} | dir=${dir} | title=${title.slice(0, 90)}`);
  console.log(`  RO 导航命中: ${roHits.join(',') || '无'}`);
  console.log(`  EN 导航残留: ${enHits.join(',') || '无'} ${ok ? 'OK' : 'FAIL'}`);
  console.log(`  变音符命中: ${diacritics.join('') || '无'} (期望 șțăâî)`);
}
console.log(allOk ? '\n全部通过 OK' : '\n存在失败项 FAIL');
process.exit(allOk ? 0 : 1);
