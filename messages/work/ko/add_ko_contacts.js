// 为所有 .astro 页面内联脚本的 LANGS 数组加入 'ko'，并为 locale 推断链加入 /ko/ 分支
// 与 add_ja_contacts.js 完全同模式，追加到 ja 之后
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', '..', 'astro', 'src');

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.astro')) files.push(p);
  }
}
walk(SRC);

let langsChanged = 0;
let chainChanged = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  const langsNew = content.replace(
    /var LANGS = \['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl', 'pl', 'ja'\];/g,
    "var LANGS = ['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl', 'pl', 'ja', 'ko'];"
  );
  if (langsNew !== content) {
    content = langsNew;
    langsChanged++;
    changed = true;
  }

  // 推断链：startsWith('/ja') ? 'ja' : startsWith('/pl') → 在最前面插入 /ko/
  const chainNew = content.replace(
    /Astro\.url\.pathname\.startsWith\('\/ja'\) \? 'ja' : Astro\.url\.pathname\.startsWith\('\/pl'\)/g,
    "Astro.url.pathname.startsWith('/ko') ? 'ko' : Astro.url.pathname.startsWith('/ja') ? 'ja' : Astro.url.pathname.startsWith('/pl')"
  );
  if (chainNew !== content) {
    content = chainNew;
    chainChanged++;
    changed = true;
  }

  if (changed) fs.writeFileSync(f, content, 'utf8');
}

console.log(`LANGS 数组修改: ${langsChanged} 个文件`);
console.log(`推断链修改: ${chainChanged} 个文件`);
