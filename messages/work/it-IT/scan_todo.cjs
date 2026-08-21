// 扫描 en 分片中 [TODO] 叶子占比，用于判定真实翻译量
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'split');
for (let i = 12; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(DIR, `extract_en_part${num}.json`);
  if (!fs.existsSync(file)) continue;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const todos = [];
  (function walk(o, prefix) {
    for (const [k, v] of Object.entries(o)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
      else if (typeof v === 'string' && v.startsWith('[TODO]')) todos.push(p);
    }
  })(obj, '');
  console.log(`part${num}: leaves=${JSON.stringify(obj).length} chars, TODO=${todos.length}`);
}
