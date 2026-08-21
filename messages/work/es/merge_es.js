// 合并 40 个 extract_es_partXX.json → messages/es.json，并校验与 en.json 键路径完全一致
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'es.json');
const SPLIT_DIR = path.join(__dirname, 'split');
const PARTS = 40;

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

// 深合并：b 合并进 a（同键对象递归，叶子覆盖）
function deepMerge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!a[k] || typeof a[k] !== 'object' || Array.isArray(a[k])) a[k] = {};
      deepMerge(a[k], v);
    } else {
      a[k] = v;
    }
  }
  return a;
}

const merged = {};
for (let i = 1; i <= PARTS; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(SPLIT_DIR, `extract_es_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  const block = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(merged, block);
  console.log(`merged part${num}`);
}

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`已写入 ${OUT}，顶层键: ${Object.keys(merged).join(',')}`);

// 校验：键路径与叶子数与 en.json 完全一致
function collectPaths(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) collectPaths(v, p, out);
    else out.push(p);
  }
  return out;
}
function collectArrays(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out.push(p);
    if (v && typeof v === 'object') collectArrays(v, p, out);
  }
  return out;
}

const enPaths = collectPaths(en, '', []).sort();
const esPaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const esArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !esPaths.includes(x));
const extra = esPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !esArrays.includes(x));
const extraArr = esArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, es 叶子: ${esPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, es 数组键: ${esArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);
if (missingArr.length) console.log('missing 数组示例:', missingArr.slice(0, 10));

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0;
console.log(ok ? '\n✅ 校验通过：键路径与数组结构完全一致' : '\n❌ 校验失败，请检查上述差异');
process.exit(ok ? 0 : 1);
