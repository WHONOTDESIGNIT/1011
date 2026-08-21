// 打印 en 与 cs 分片的差异（用于抽查）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPLIT = path.join(__dirname, 'split');
const num = process.argv[2] || '02';

const cs = JSON.parse(fs.readFileSync(path.join(SPLIT, `extract_cs_part${num}.json`), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(SPLIT, `extract_en_part${num}.json`), 'utf8'));

function diff(a, b, prefix, out) {
  for (const [k, v] of Object.entries(a)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const bv = b?.[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      diff(v, bv, p, out);
    } else if (bv !== v) {
      out.push(`${p}: en=${JSON.stringify(bv)} | cs=${JSON.stringify(v)}`);
    }
  }
  return out;
}
const out = diff(cs, en, '', []);
console.log(`part${num} 差异 ${out.length} 条:`);
out.forEach((l) => console.log('  ' + l));
