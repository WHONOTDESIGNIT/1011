// 校验 pt-PT.json 与 en.json 对齐 + 统计 it 分片（结果写入文件）
const fs = require('fs');
const path = require('path');

const MSG = path.join(__dirname, 'messages');
const WORK = path.join(MSG, 'work', 'it', 'split');
const OUT_FILE = path.join(sitemap.xml, '_pt_it_report.txt');
const lines = [];
const log = (s) => lines.push(s);

function collectPaths(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) collectPaths(v, p, out);
    else out.push(p);
  }
  return out;
}
function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const asciiOnly = (s) => /^[A-Za-z0-9 .\-_&'"/%:;(),+@#!?=\[\]{}€$£¥°™®©±<>|]{2,}$/.test(s);

const en = JSON.parse(fs.readFileSync(path.join(MSG, 'en.json'), 'utf8'));
const pt = JSON.parse(fs.readFileSync(path.join(MSG, 'pt-PT.json'), 'utf8'));

const enPaths = collectPaths(en, '', []).sort();
const ptPaths = collectPaths(pt, '', []).sort();
const missing = enPaths.filter((x) => !ptPaths.includes(x));
const extra = ptPaths.filter((x) => !enPaths.includes(x));
log('=== pt-PT.json 校验 ===');
log(`en 叶子: ${enPaths.length}, pt-PT 叶子: ${ptPaths.length}`);
log(`missing: ${missing.length}, extra: ${extra.length}`);
if (missing.length) log('missing 示例: ' + missing.slice(0, 10).join(' | '));
if (extra.length) log('extra 示例: ' + extra.slice(0, 10).join(' | '));
log(`en [TODO]: ${collectTodo(en, []).length}, pt-PT [TODO]: ${collectTodo(pt, []).length}`);

let residual = [];
(function walk(o, prefix) {
  for (const [k, v] of Object.entries(o)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
    else if (typeof v === 'string' && v.length > 12 && !v.startsWith('[TODO]') && !/^[\d\s.,:;%€$£¥°™®©±<>()\[\]{}'"\/\-_+&]+$/.test(v) && asciiOnly(v)) {
      residual.push(`${p} => ${v.slice(0, 60)}`);
    }
  }
})(pt, '');
log(`疑似残留英文(纯ASCII长文本): ${residual.length}`);
residual.slice(0, 15).forEach((x) => log('  ' + x));

log('=== it 分片 ===');
let missingParts = [];
for (let i = 1; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const f = path.join(WORK, `extract_it_part${num}.json`);
  if (!fs.existsSync(f)) missingParts.push(`part${num}`);
}
log(`it/split 缺失分片: ${missingParts.length ? missingParts.join(', ') : '无'}`);
log('=== part20 缺失的英文源内容大小 ===');
const enPart20 = path.join(WORK, 'extract_en_part20.json');
if (fs.existsSync(enPart20)) {
  log(`extract_en_part20.json 存在, ${fs.statSync(enPart20).size} 字节`);
}

fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
