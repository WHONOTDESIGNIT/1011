import fs from 'node:fs';

const srcPath = 'D:/1011-main/1011-main/1011-main/messages/work/nl/split/extract_en_part40.json';
const outPath = 'D:/1011-main/1011-main/1011-main/messages/work/nl/split/extract_nl_part40.json';

const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const out = JSON.parse(fs.readFileSync(outPath, 'utf8'));

// 1. collect key paths (for arrays, use index) and leaf values
function collect(node, path, leaves, shapes) {
  if (node === null || typeof node !== 'object') {
    leaves.push({ path: path.join('.'), value: String(node) });
    return;
  }
  if (Array.isArray(node)) {
    shapes.push({ path: path.join('.'), kind: 'array', len: node.length });
    node.forEach((item, i) => collect(item, [...path, `[${i}]`], leaves, shapes));
    return;
  }
  shapes.push({ path: path.join('.'), kind: 'object', keys: Object.keys(node) });
  for (const k of Object.keys(node)) {
    collect(node[k], [...path, k], leaves, shapes);
  }
}

const srcLeaves = [], srcShapes = [];
const outLeaves = [], outShapes = [];
collect(src, [], srcLeaves, srcShapes);
collect(out, [], outLeaves, outShapes);

// 2. compare shapes (key structure + array lengths) exactly
const srcShapeStr = JSON.stringify(srcShapes);
const outShapeStr = JSON.stringify(outShapes);
const shapeMatch = srcShapeStr === outShapeStr;
if (!shapeMatch) {
  console.log('KEY PATH MISMATCH:');
  for (let i = 0; i < Math.max(srcShapes.length, outShapes.length); i++) {
    const a = JSON.stringify(srcShapes[i]);
    const b = JSON.stringify(outShapes[i]);
    if (a !== b) {
      console.log('  src :', a);
      console.log('  out :', b);
      break;
    }
  }
}

// 3. compare leaf paths
const srcLeafPaths = srcLeaves.map(l => l.path);
const outLeafPaths = outLeaves.map(l => l.path);
const missing = srcLeafPaths.filter(p => !outLeafPaths.includes(p));
const extra = outLeafPaths.filter(p => !srcLeafPaths.includes(p));

// 4. counts
const totalLeaves = outLeaves.length;
const todoLeaves = outLeaves.filter(l => String(l.value).startsWith('[TODO]')).length;

// 5. English residue check: leaves unchanged between src and out
const srcByPath = new Map(srcLeaves.map(l => [l.path, l.value]));
const unchanged = outLeaves.filter(l => srcByPath.get(l.path) === l.value);

// 6. English-word heuristic: tokens common in English but not Dutch
const enTokens = /\b(the|and|for|with|your|our|from|how|what|why|this|that|are|you|we|is|of|to|in|on|a\b|an\b|should|would|could|will|can|make|using|create|improve|learn|guide|tips|best|top|new|site|store|business|their|was|were|has|have|been|delivers|flashes|support|single|quartz|lamp|levels|settings|energy|skin|tone|sensor|device|warranty|weight|units|tracking|design|results|output|high|efficiency|white|black|beige|teal|smart|app|control|plan|track|monitor|available|data|driven|scheduling|progress|multi|color|question|answer|compare|models|cooling|cool|ice|feeling|professional|treatment|portable|design|natural|inspired|top|selling|removal|chills|intensity|requests|delivers|flash|battery|connected)\b/gi;
const residue = [];
for (const l of outLeaves) {
  const v = String(l.value);
  if (/^\[TODO\]/.test(v)) continue; // skip TODO markers
  const hits = v.match(enTokens);
  if (hits && hits.length > 0 && /[a-z]/.test(v)) {
    residue.push({ path: l.path, value: v, hits });
  }
}

console.log('=== VALIDATION RESULT (part 40) ===');
console.log('JSON valid          :', true);
console.log('Leaf count (out)    :', totalLeaves);
console.log('Leaf count (src)    :', srcLeaves.length);
console.log('[TODO] preserved    :', todoLeaves);
console.log('Key structure match :', shapeMatch ? 'YES' : 'NO');
console.log('Missing leaf paths  :', missing.length, missing.slice(0, 5));
console.log('Extra leaf paths    :', extra.length, extra.slice(0, 5));
console.log('Unchanged leaves    :', unchanged.length);
if (unchanged.length > 0) {
  console.log('--- unchanged (kept verbatim) ---');
  for (const u of unchanged) console.log('  ', u.path, '=>', JSON.stringify(u.value));
}
console.log('English-token hits  :', residue.length);
if (residue.length > 0) {
  console.log('--- english residue candidates ---');
  for (const r of residue) console.log('  ', r.path, '=>', JSON.stringify(r.value));
}
