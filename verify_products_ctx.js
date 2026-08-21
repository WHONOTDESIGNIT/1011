const fs = require('fs');
const html = fs.readFileSync('astro/dist/tr/services/index.html', 'utf8');
let out = '';
// 找出 Products 出现的上下文（前后各80字符）
let idx = 0;
let count = 0;
while ((idx = html.indexOf('Products', idx)) !== -1 && count < 8) {
  const start = Math.max(0, idx - 80);
  const end = Math.min(html.length, idx + 80);
  out += '--- 第' + (count + 1) + '次 ---\n' + html.slice(start, end) + '\n\n';
  idx += 8;
  count++;
}
out += '总出现次数: ' + (html.match(/Products/g) || []).length + '\n';
// 同样检查 Home 首页
const home = fs.readFileSync('astro/dist/tr/index.html', 'utf8');
out += '\n===== tr/index.html Products 出现次数 = ' + (home.match(/Products/g) || []).length + ' =====\n';
idx = 0; count = 0;
while ((idx = home.indexOf('Products', idx)) !== -1 && count < 4) {
  const start = Math.max(0, idx - 80);
  const end = Math.min(home.length, idx + 80);
  out += '--- home 第' + (count + 1) + '次 ---\n' + home.slice(start, end) + '\n\n';
  idx += 8;
  count++;
}
fs.writeFileSync('verify_products_ctx.txt', out);
console.log('written');
