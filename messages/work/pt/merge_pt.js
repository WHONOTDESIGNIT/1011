// 合并 40 个 extract_pt_partXX.json → messages/pt-PT.json，并校验与 en.json 键路径完全一致
// 附：葡萄牙语标点规范化——移除 ? ! : ; 前的多余空格（葡萄牙语规范：标点前不加空格，紧跟单词）
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'pt-PT.json');
const SPLIT_DIR = path.join(__dirname, 'split');
const PARTS = 40;

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

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

// 葡萄牙语标点规范化：' ?' / ' !' / ' :' / ' ;' → 标点前移除空格
function normalizePunct(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      normalizePunct(v);
    } else if (typeof v === 'string') {
      obj[k] = v.replace(/ (\?|!|:|;)/g, '$1');
    }
  }
}

const merged = {};
for (let i = 1; i <= PARTS; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(SPLIT_DIR, `extract_pt_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  const block = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(merged, block);
  console.log(`merged part${num}`);
}

normalizePunct(merged);

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`已写入 ${OUT}，顶层键: ${Object.keys(merged).join(',')}`);

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
const ptPaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const ptArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !ptPaths.includes(x));
const extra = ptPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !ptArrays.includes(x));
const extraArr = ptArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, pt-PT 叶子: ${ptPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, pt-PT 数组键: ${ptArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);

function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const todos = collectTodo(merged, []);
console.log(`[TODO] 占位符叶子: ${todos.length}${todos.length ? ' → ' + todos.slice(0, 8).join(',') + (todos.length > 8 ? '…' : '') : ''}`);

let engLeaves = 0;
for (const p of ptPaths) {
  const parts = p.split('.');
  let cur = merged;
  for (const part of parts) cur = cur[part];
  if (typeof cur === 'string' && /\b(the|your|our|with|for|from|this|that|what|why|how|are|were|will)\b/.test(cur) && cur.length > 12) {
    engLeaves++;
    console.log('可疑英文残留:', p, '=', cur.slice(0, 80));
  }
}
console.log(`可疑英文残留叶子: ${engLeaves}`);

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0;
console.log(ok ? '\n✅ 校验通过：键路径与数组结构完全一致' : '\n❌ 校验失败，请检查上述差异');
process.exit(ok ? 0 : 1);
