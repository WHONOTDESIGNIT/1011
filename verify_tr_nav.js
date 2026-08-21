// 扫描所有 tr/*/index.html，检查导航/页脚常见英文残留词
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'astro', 'dist');
const trDir = path.join(dist, 'tr');
if (!fs.existsSync(trDir)) { console.log('tr 目录不存在'); process.exit(0); }

const navWords = ['>Products<', '>Services<', '>About<', '>Resources<', '>Work<', '>Get in touch<', '>Menu<',
  '>Global Shipping<', '>Private Label<', '>ChatGPT Top Collection<', '>Learn<', '>Contact<',
  '>Ready to start<', '>Meet Best IPL<', '>Manufacturing Services<', '>Behind the projects<',
  '>Get my audit<', '>Get a free instant IPL audit<', '>All Products<', '>IPL Catalogue<',
  '>View all Services<', '>Free IPL Device Audit<', '>IPL Safety<', '>FAQ & Help<'];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'tr' || e.name === 'ar' || e.name === 'en') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
}

const files = [];
walk(trDir, files);
console.log(`扫描 ${files.length} 个 tr 页面`);

let badTotal = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const hits = navWords.filter((w) => s.includes(w));
  if (hits.length) {
    badTotal++;
    console.log(`\n${path.relative(dist, f)}:`);
    for (const h of hits) console.log(`  ${h}`);
  }
}
console.log(`\n含英文残留页面: ${badTotal}/${files.length}`);
