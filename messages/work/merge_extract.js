/* 合并 8 个 extract 分片：extract_en_* → en.json，extract_ar_* → ar.json；
   tr.json 用 en 结构补齐（占位符/英文占位，后续由 subagent 翻译真实内容） */
const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) target[k] = {};
      deepMerge(target[k], sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

const leaves = (o, p = '') => Object.entries(o).reduce((a, [k, v]) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return a.concat(leaves(v, p + k + '.'));
  return a.concat([p + k]);
}, []);

const names = ['aboutPages', 'auxPages', 'clientPage', 'develoContent', 'develoCore', 'develoSocial', 'teamPage', 'productDetail'];
const en = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync(base + 'ar.json', 'utf8'));

let totalEn = 0, totalAr = 0;
for (const n of names) {
  const enX = JSON.parse(fs.readFileSync(base + `work/extract_en_${n}.json`, 'utf8'));
  const arX = JSON.parse(fs.readFileSync(base + `work/extract_ar_${n}.json`, 'utf8'));
  // 结构校验：ar 叶子必须与 en 完全一致
  const eL = leaves(enX), aL = leaves(arX);
  const miss = eL.filter((k) => !aL.includes(k));
  if (miss.length) throw new Error(`[${n}] ar missing ${miss.length}: ${miss.slice(0, 5)}`);
  deepMerge(en, enX);
  deepMerge(ar, arX);
  totalEn += eL.length;
  totalAr += aL.length;
  console.log(`[${n}] merged ${eL.length} leaves`);
}
fs.writeFileSync(base + 'en.json', JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(base + 'ar.json', JSON.stringify(ar, null, 2), 'utf8');

// tr.json：用 en 补齐缺失结构（保留 tr 已有翻译）
const tr = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));
deepMerge(tr, en);
fs.writeFileSync(base + 'tr.json', JSON.stringify(tr, null, 2), 'utf8');

// 复验
const e2 = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));
const a2 = JSON.parse(fs.readFileSync(base + 'ar.json', 'utf8'));
const t2 = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));
const eL = leaves(e2), aL = leaves(a2), tL = leaves(t2);
console.log('FINAL en:', eL.length, 'ar:', aL.length, 'tr:', tL.length);
console.log('en-ar diff:', eL.filter((k) => !aL.includes(k)).length, 'ar-en diff:', aL.filter((k) => !eL.includes(k)).length);
console.log('en-tr diff:', eL.filter((k) => !tL.includes(k)).length);
