// 合并 40 个 extract_pl_partXX.json → messages/pl.json，并校验与 en.json 键路径完全一致
// 归一化：英文源为 [TODO] 的遗留键（站点未使用）保持与 en.json 完全一致（与既有语言包约定一致）
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'pl.json');
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

const merged = {};
for (let i = 1; i <= PARTS; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(SPLIT_DIR, `extract_pl_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  deepMerge(merged, JSON.parse(fs.readFileSync(file, 'utf8')));
  console.log(`merged part${num}`);
}

function normalizeTodo(obj, enObj) {
  for (const [k, v] of Object.entries(obj)) {
    const ev = enObj && typeof enObj === 'object' ? enObj[k] : undefined;
    if (typeof ev === 'string' && ev.startsWith('[TODO]')) {
      obj[k] = ev;
    } else if (v && typeof v === 'object' && !Array.isArray(v) && ev && typeof ev === 'object' && !Array.isArray(ev)) {
      normalizeTodo(v, ev);
    }
  }
}
normalizeTodo(merged, en);

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
const plPaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const plArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !plPaths.includes(x));
const extra = plPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !plArrays.includes(x));
const extraArr = plArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, pl 叶子: ${plPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, pl 数组键: ${plArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);

function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const todos = collectTodo(merged, []);
const enTodo = collectTodo(en, []);
console.log(`[TODO] 占位符叶子: pl=${todos.length} (en=${enTodo.length})`);

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0 && todos.length === enTodo.length;
console.log(ok ? '\n✅ 校验通过：键路径与数组结构完全一致，TODO 数与 en 对齐' : '\n❌ 校验失败，请检查上述差异');
process.exit(ok ? 0 : 1);
