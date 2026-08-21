// 修复 catalogue 页面列标题 bug：clientPage.catalogue.bestFor 是对象节点，被 t() 误当字符串渲染出 key 名。
// 方案：在 5 个语言 messages 中新增叶子 clientPage.catalogue.bestForTitle（bestFor 对象前），页面改为引用该叶子。
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/1011-main/1011-main/1011-main/messages';

const labels = {
  'en.json': 'Best for',
  'tr.json': 'En uygun',
  'ar.json': 'الأفضل لـ',
  'es.json': 'Mejor para',
  'fr.json': 'Idéal pour',
};

for (const [file, label] of Object.entries(labels)) {
  const fp = path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const cat = data.clientPage && data.clientPage.catalogue;
  if (!cat) { console.log(`✗ ${file}: 无 clientPage.catalogue`); process.exit(1); }
  if (cat.bestForTitle) { console.log(`• ${file}: bestForTitle 已存在，跳过`); continue; }
  // 在 bestFor 对象前插入 bestForTitle（重建键序）
  const next = {};
  for (const k of Object.keys(cat)) {
    if (k === 'bestFor') next.bestForTitle = label;
    next[k] = cat[k];
  }
  data.clientPage.catalogue = next;
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ ${file}: bestForTitle = ${label}`);
}

// 校验
for (const file of Object.keys(labels)) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const v = data.clientPage.catalogue.bestForTitle;
  if (typeof v !== 'string' || !v) { console.log(`✗ ${file}: bestForTitle 缺失`); process.exit(1); }
}
console.log('✅ 5 个语言文件 bestForTitle 全部就位');
