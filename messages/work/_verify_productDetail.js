// Verify extract_en_productDetail.json / extract_ar_productDetail.json
// 1) valid JSON (UTF-8 no BOM) 2) identical key tree
const fs = require('fs');

function collectPaths(node, prefix, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectPaths(v, `${prefix}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) collectPaths(node[k], prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.add(prefix);
  }
  return out;
}

for (const f of ['extract_en_productDetail.json', 'extract_ar_productDetail.json']) {
  const buf = fs.readFileSync(__dirname + '/' + f);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) throw new Error(`${f}: has UTF-8 BOM!`);
  JSON.parse(buf.toString('utf8'));
  console.log(`${f}: valid JSON, no BOM (${buf.length} bytes)`);
}

const en = JSON.parse(fs.readFileSync(__dirname + '/extract_en_productDetail.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync(__dirname + '/extract_ar_productDetail.json', 'utf8'));
const enPaths = collectPaths(en.productDetail, '', new Set());
const arPaths = collectPaths(ar.productDetail, '', new Set());

const onlyEn = [...enPaths].filter((p) => !arPaths.has(p));
const onlyAr = [...arPaths].filter((p) => !enPaths.has(p));
if (onlyEn.length || onlyAr.length) {
  console.error('KEY TREE MISMATCH!');
  if (onlyEn.length) console.error('only in EN:', onlyEn);
  if (onlyAr.length) console.error('only in AR:', onlyAr);
  process.exit(1);
}
console.log(`Key tree identical: ${enPaths.size} leaf values match between EN and AR.`);
console.log('VERIFY PASSED');
