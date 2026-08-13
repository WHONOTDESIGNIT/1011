// 验证 es 构建产物：标题 / lang / 西语导航命中 / 英文导航残留
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'es');
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

const esNav = ['Productos', 'Servicios', 'Componentes', 'Clientes', 'Blog', 'Nosotros', 'Acerca de', 'Contacto'];
// Blog 是西语通用外来词（RAE 认可），es.json nav.blog 有意保留，不视为英文残留
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
  const esHits = esNav.filter((w) => html.includes(w));
  const enHits = enNav.filter((w) => html.includes(w));
  const ok = lang === 'es' && enHits.length === 0;
  if (!ok) allOk = false;
  console.log(`--- ${rel}`);
  console.log(`  lang=${lang} | title=${title.slice(0, 90)}`);
  console.log(`  ES 导航命中: ${esHits.join(',') || '无'}`);
  console.log(`  EN 导航残留: ${enHits.join(',') || '无'} ${ok ? 'OK' : 'FAIL'}`);
}
console.log(allOk ? '\n全部通过 OK' : '\n存在失败项 FAIL');
process.exit(allOk ? 0 : 1);
