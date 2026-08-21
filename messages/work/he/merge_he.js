// 合并 40 个 extract_he_partXX.json → messages/he.json，并校验与 en.json 键路径完全一致
// 附：希伯来语标点规范化——移除 ? ! : ; 前的多余空格（希伯来语规范：标点前不加空格，紧跟单词）
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'he.json');
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

// 希伯来语标点规范化：' ?' / ' !' / ' :' / ' ;' → '?' / '!' / ':' / ';'（标点前移除空格）
// 仅处理「空格+标点」；URL/时间冒号（https://、9:30）前无空格，不受影响
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
  const file = path.join(SPLIT_DIR, `extract_he_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  const block = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(merged, block);
  console.log(`merged part${num}`);
}

// 统一希伯来语标点风格（标点前无空格）
normalizePunct(merged);

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
const hePaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const heArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !hePaths.includes(x));
const extra = hePaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !heArrays.includes(x));
const extraArr = heArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, he 叶子: ${hePaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, he 数组键: ${heArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);
if (missingArr.length) console.log('missing 数组示例:', missingArr.slice(0, 10));

// 残留 [TODO] 占位符统计（允许保留）
function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const todos = collectTodo(merged, []);
console.log(`[TODO] 占位符叶子: ${todos.length}${todos.length ? ' → ' + todos.slice(0, 8).join(',') + (todos.length > 8 ? '…' : '') : ''}`);

// 与 en 比较：值仍为纯英文句子的残留（启发式：含 ' the ' / ' your ' 且长度>12）
let engLeaves = 0;
for (const p of hePaths) {
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
