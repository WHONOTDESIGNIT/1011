// 22 个页面/布局的语言偏好持久化脚本 LANGS 数组统一加入 'ro'
// 缺失会导致：切到 /ro 后被脚本误判为偏好不一致，二次重定向到 /ro/ro（404）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..', 'astro', 'src');
const OLD = "var LANGS = ['tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl'];";
const NEW = "var LANGS = ['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl'];";
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : path.join(d, e.name)
  );
}
let changed = 0;
for (const f of walk(ROOT)) {
  if (!/\.astro$/.test(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(OLD)) {
    fs.writeFileSync(f, s.split(OLD).join(NEW), 'utf8');
    changed++;
    console.log('[已更新]', path.relative(ROOT, f));
  }
}
console.log(`\n共更新 ${changed} 个文件`);
