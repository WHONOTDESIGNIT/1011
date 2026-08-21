/* 检查各 extract 分片：en/ar 对齐、是否已合并进 en.json */
const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';
const en = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync(base + 'ar.json', 'utf8'));
const tr = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));

const leaves = (o, p = '') => Object.entries(o).reduce((a, [k, v]) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return a.concat(leaves(v, p + k + '.'));
  return a.concat([p + k]);
}, []);
const get = (o, key) => key.split('.').reduce((c, p) => (c && typeof c === 'object' ? c[p] : undefined), o);

const names = ['aboutPages', 'auxPages', 'clientPage', 'develoContent', 'develoCore', 'develoSocial', 'teamPage', 'productDetail'];
for (const n of names) {
  const ep = `work/extract_en_${n}.json`;
  const ap = `work/extract_ar_${n}.json`;
  if (!fs.existsSync(base + ep)) { console.log(`[${n}] NO EN EXTRACT`); continue; }
  const enX = JSON.parse(fs.readFileSync(base + ep, 'utf8'));
  const arX = fs.existsSync(base + ap) ? JSON.parse(fs.readFileSync(base + ap, 'utf8')) : null;
  const enLeaves = leaves(enX);
  const arLeaves = arX ? leaves(arX) : [];
  const missingInAr = enLeaves.filter((k) => !arLeaves.includes(k));
  const top = Object.keys(enX)[0] || '?';
  // 是否已合并进 en.json
  const merged = en[top] !== undefined;
  console.log(`[${n}] top=${top} enLeaves=${enLeaves.length} arLeaves=${arLeaves.length} missingInAr=${missingInAr.length} mergedIntoEn=${merged}`);
  if (missingInAr.length && missingInAr.length < 8) console.log('   missingInAr:', JSON.stringify(missingInAr));
}
// tr 缺 347 的验证：列出 tr 缺的顶层命名空间分布
const enLeaves = leaves(en);
const trLeaves = leaves(tr);
const diff = enLeaves.filter((k) => !trLeaves.includes(k));
const topCount = {};
for (const k of diff) topCount[k.split('.')[0]] = (topCount[k.split('.')[0]] || 0) + 1;
console.log('tr missing top namespace distribution:', JSON.stringify(topCount));
