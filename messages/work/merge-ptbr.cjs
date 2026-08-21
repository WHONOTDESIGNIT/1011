const fs = require('fs');
const dir = 'd:/1011-main/1011-main/1011-main/messages/work/pt-br-chunks/';
const outDir = 'd:/1011-main/1011-main/1011-main/messages/';

const frags = fs.readdirSync(dir).filter(f => /^c\d/.test(f) && !f.startsWith('src-'));
const out = {};
function merge(dst, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      if (!dst[k] || typeof dst[k] !== 'object' || Array.isArray(dst[k])) dst[k] = {};
      merge(dst[k], src[k]);
    } else {
      dst[k] = src[k];
    }
  }
  return dst;
}
for (const f of frags) {
  merge(out, JSON.parse(fs.readFileSync(dir + f, 'utf8')));
}
const en = JSON.parse(fs.readFileSync(outDir + 'en.json', 'utf8'));
function check(a, b, prefix, errors) {
  for (const k of Object.keys(a)) if (!(k in b)) errors.push('MISSING in merged: ' + prefix + k);
  for (const k of Object.keys(b)) {
    if (!(k in a)) errors.push('EXTRA key: ' + prefix + k);
    else if (typeof a[k] !== typeof b[k]) errors.push('TYPE MISMATCH: ' + prefix + k);
    else if (a[k] && b[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) check(a[k], b[k], prefix + k + '.', errors);
    else if (Array.isArray(a[k]) && a[k].length !== b[k].length) errors.push('ARRAY LENGTH ' + prefix + k + ': ' + a[k].length + ' vs ' + b[k].length);
  }
}
const errors = [];
check(out, en, '', errors);
console.log('fragments merged:', frags.length);
console.log('top-level keys:', Object.keys(out).length);
console.log('structure errors:', errors.length);
if (errors.length > 0) {
  console.log(errors.slice(0, 50).join('\n'));
  process.exit(1);
}
fs.writeFileSync(outDir + 'pt-BR.json', JSON.stringify(out, null, 2));
console.log('written messages/pt-BR.json, size KB:', (fs.statSync(outDir + 'pt-BR.json').size / 1024).toFixed(1));
