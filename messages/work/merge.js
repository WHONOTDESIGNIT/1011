const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';

const en = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));
const ar = JSON.parse(JSON.stringify(en)); // deep copy en as the skeleton

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        target[k] = {};
      }
      deepMerge(target[k], sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

for (const f of ['a', 'b1', 'b2', 'c', 'd', 'e']) {
  const part = JSON.parse(fs.readFileSync(base + 'work/ar_part_' + f + '.json', 'utf8'));
  deepMerge(ar, part);
}

fs.writeFileSync(base + 'ar.json', JSON.stringify(ar, null, 2), 'utf8');
console.log('ar.json written. Top keys:', Object.keys(ar).length);

// quick validation of parsed output
const check = JSON.parse(fs.readFileSync(base + 'ar.json', 'utf8'));
console.log('re-parse OK, size:', fs.statSync(base + 'ar.json').size);
