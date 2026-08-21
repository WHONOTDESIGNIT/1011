// 定位 fr 构建产物中的可疑英文功能词上下文
const fs = require('fs');
const path = require('path');

const cases = [
  ['products/index.html', ['best']],
  ['products/lumi/index.html', ['best']],
  ['catalogue/index.html', ['best', 'for']],
  ['privacy-policy/index.html', ['do', 'not']],
  ['services/product-design/index.html', [' and ']],
];

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

for (const [rel, words] of cases) {
  const fp = path.join('D:/1011-main/1011-main/1011-main/astro/dist/fr', rel);
  const html = fs.readFileSync(fp, 'utf8');
  const text = textOf(html);
  console.log(`=== ${rel}`);
  for (const w of words) {
    let idx = text.toLowerCase().indexOf(w.trim());
    if (idx < 0) { console.log(`  [${w}] 未在纯文本中找到`); continue; }
    while (idx >= 0) {
      console.log(`  [${w}] …${text.slice(Math.max(0, idx - 60), idx + 60)}…`);
      idx = text.toLowerCase().indexOf(w.trim(), idx + 1);
    }
  }
}
