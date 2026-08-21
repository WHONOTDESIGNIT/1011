// 拆 en.json 为 40 个小单元（按叶子路径深拆，保留顶层命名空间），供波斯语翻译派发
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT_DIR = path.join(__dirname, 'split');
const PARTS = 40;

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

function collectLeaves(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) collectLeaves(v, p, out);
    else out.push(p);
  }
  return out;
}
const leaves = collectLeaves(en, '', []);
const total = leaves.length;
const per = Math.ceil(total / PARTS);
console.log(`总叶子: ${total}, 每块: ${per}, 块数: ${Math.ceil(total / per)}`);

const chunks = [];
for (let i = 0; i < total; i += per) chunks.push(leaves.slice(i, i + per));

function buildNested(paths) {
  const root = {};
  for (const p of paths) {
    const parts = p.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!cur[part] || typeof cur[part] !== 'object') cur[part] = {};
      cur = cur[part];
    }
    cur[parts[parts.length - 1]] = getVal(en, p);
  }
  return root;
}
function getVal(obj, key) {
  return key.split('.').reduce((c, p) => (c && typeof c === 'object' ? c[p] : undefined), obj);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
chunks.forEach((chunk, i) => {
  const num = String(i + 1).padStart(2, '0');
  const block = buildNested(chunk);
  fs.writeFileSync(path.join(OUT_DIR, `extract_en_part${num}.json`), JSON.stringify(block, null, 2));
});
console.log(`\n已输出 ${chunks.length} 块到 ${OUT_DIR}`);
