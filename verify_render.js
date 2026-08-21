const fs = require('fs');
const d = 'astro/dist/';
let out = '';
// 1. 检查 tr 服务页导航实际文本
const svc = fs.readFileSync(d + 'tr/services/index.html', 'utf8');
out += '=== tr/services nav 相关 ===\n';
for (const t of ['IPL Ürünleri', '>Products<', 'Hizmetler', '>Services<', 'Hakkımızda', '>About<', 'Müşteriler', '>Clients<']) {
  out += t + ' : ' + (svc.includes(t) ? 'FOUND' : 'not') + '\n';
}
// 2. 检查 tr/products 标题
const prd = fs.readFileSync(d + 'tr/products/index.html', 'utf8');
out += '\n=== tr/products ===\n';
const title = (prd.match(/<title>([^<]*)<\/title>/) || [])[1];
out += 'title: ' + title + '\n';
// 3. 检查打包后的 i18n chunk 是否含新 tr.json 数据
out += '\n=== 打包数据检查 ===\n';
const chunksDir = d + '_astro/';
const files = fs.readdirSync(chunksDir).filter((f) => f.endsWith('.js'));
for (const f of files) {
  const c = fs.readFileSync(chunksDir + f, 'utf8');
  if (c.includes('IPL Ürünleri')) { out += f + ': contains IPL Ürünleri (tr nav)\n'; }
  if (c.includes('Profesyonel IPL Cihazları') && f.includes('chunk')) { out += f + ': contains Profesyonel IPL Cihazları\n'; }
}
out += 'total chunks: ' + files.length + '\n';
fs.writeFileSync('verify_render.txt', out);
console.log('written');
