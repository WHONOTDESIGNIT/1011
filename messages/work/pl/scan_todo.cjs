// 扫描 en 分片中 [TODO] 叶子占比，用于判定真实翻译量
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'split');
for (let i = 1; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(DIR, `extract_en_part${num}.json`);
  if (!fs.existsSync(file)) continue;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  let todos = 0, leaves = 0;
  (function walk(o, prefix) {
    for (const [k, v] of Object.entries(o)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
      else { leaves++; if (typeof v === 'string' && v.startsWith('[TODO]')) todos++; }
    }
  })(obj, '');
  console.log(`part${num}: leaves=${leaves}, TODO=${todos}`);
}
