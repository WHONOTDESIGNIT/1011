// 为所有 .astro 页面内联脚本的 LANGS 数组加入 'ja'，并为 locale 推断链加入 /ja/ 分支
// 与 pl 的 add_pl_langs_array.js / add_pl_locale_chain.js 完全同模式
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
    /var LANGS = \['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl', 'pl'\];/g,
    "var LANGS = ['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl', 'pl', 'ja'];"
  );
  if (langsNew !== content) {
    content = langsNew;
    langsChanged++;
    changed = true;
  }

  // 推断链：startsWith('/pl') ? 'pl' : startsWith('/nl') ? 'nl' : 'en' → 在最前面插入 /ja/
  const chainNew = content.replace(
    /Astro\.url\.pathname\.startsWith\('\/pl'\) \? 'pl' : Astro\.url\.pathname\.startsWith\('\/nl'\)/g,
    "Astro.url.pathname.startsWith('/ja') ? 'ja' : Astro.url.pathname.startsWith('/pl') ? 'pl' : Astro.url.pathname.startsWith('/nl')"
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
