const fs = require('fs');
const tr = JSON.parse(fs.readFileSync('messages/tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
let out = '';
// nav 命名空间前若干值对比
for (const ns of ['nav', 'footer', 'productsPage', 'products']) {
  out += '=== ' + ns + ' ===\n';
  if (!tr[ns]) { out += 'tr missing\n'; continue; }
  const sample = [];
  (function walk(o, depth, path) {
    if (depth > 2 || sample.length >= 12) return;
    if (typeof o === 'string') { sample.push(path + ' = ' + o); return; }
    if (o && typeof o === 'object') for (const k in o) walk(o[k], depth + 1, path ? path + '.' + k : k);
  })(tr[ns], 0, '');
  out += sample.join('\n') + '\n';
}
// productsPage 标题键
const pt = tr.productsPage || {};
out += '=== productsPage.title ===\n' + JSON.stringify(pt.title || pt.pageTitle || pt.hero || '(none)') + '\n';
out += '=== products.productsPage(若存在) ===\n';
const pp = tr.products?.productsPage;
out += pp ? JSON.stringify(pp).slice(0, 300) : '(none)\n';
fs.writeFileSync('verify_nav.txt', out);
console.log('written');
