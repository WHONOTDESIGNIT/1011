#!/usr/bin/env node
// Standard-number parity across the BUILT site.
//
// check-claims-parity.mjs reads blog MDX. check-claims-messages.mjs reads messages JSON.
// Neither sees text that a template writes itself, and that is exactly where a wrong
// standard number hurts most: it lands on every page of that template at once.
//
// This scans dist/ and compares each localized page against its English counterpart:
// dist/de/services/oem-odm.html is checked against dist/services/oem-odm.html. A number
// present in the localized page but absent from the English page is drift.
//
// Rule is one-directional on purpose, same as the other two checkers: additions are caught,
// omissions are not.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.CLAIMS_DIST_DIR || path.resolve(__dirname, '../dist');

const LOCALES = ['ar','cs','de','el','es','fa','fr','he','id','it','ja','ko','nl','pl','pt-BR','pt-PT','ro','ru','th','tr','vi'];
const TOP = new Set(LOCALES);

const TRACKED = /(?:\b(ISO|IEC|EN|CISPR|ASTM|ANSI|JIS|KS|GB|UL|BS)\s*(?:IEC\s*)?)?\b(13485|60335|62471|55014|60601|62133|14971|10993)\b(?:[-.]\d+)*/g;
const QUICK = /(13485|60335|62471|55014|60601|62133|14971|10993)/;
const FAMILY_OF = { ISO: 'ISO', IEC: 'IEC', EN: 'IEC', CISPR: 'CISPR', ASTM: 'ASTM', ANSI: 'ANSI', JIS: 'JIS', KS: 'KS', GB: 'GB', UL: 'UL', BS: 'BS' };
const normalise = (s) => s.toUpperCase().replace(/\s+/g, ' ').replace(/[.,;:)]+$/, '').trim();

function standardsOf(html) {
  const found = new Map();
  for (const m of html.matchAll(TRACKED)) {
    const [, prefix] = m;
    const key = normalise(m[0].slice(prefix ? prefix.length : 0).replace(/^\s*(IEC\s*)?/, ''));
    if (!found.has(key)) found.set(key, new Set());
    if (prefix) found.get(key).add(FAMILY_OF[prefix.toUpperCase()] ?? prefix.toUpperCase());
  }
  return found;
}

/** visible text only: the guard should compare what a reader can see */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

if (!existsSync(DIST)) {
  console.error('❌ dist/ 不存在，先在 astro build 之后运行');
  process.exit(1);
}

const findings = [];
let compared = 0;
const cache = new Map();
const read = (p) => { if (!cache.has(p)) cache.set(p, readFileSync(p, 'utf8')); return cache.get(p); };

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '_astro' || e.name === '.netlify' || e.name === 'images') continue;
      walk(full);
    } else if (e.name.endsWith('.html')) {
      yieldFile(full);
    }
  }
}

function yieldFile(file) {
  const rel = path.relative(DIST, file).split(path.sep);
  if (!TOP.has(rel[0])) return;                      // English page or non-locale path
  const locale = rel[0];
  const enRel = ['dist', ...rel.slice(1)].join(path.sep);
  const enFile = path.join(path.dirname(DIST), enRel);
  if (!existsSync(enFile)) return;
  const locText = visibleText(read(file));
  if (!QUICK.test(locText)) return;
  const enText = visibleText(read(enFile));
  compared++;
  const enStd = standardsOf(enText);
  for (const [number, families] of standardsOf(locText)) {
    const enFamilies = enStd.get(number);
    if (!enFamilies) { findings.push({ locale, page: rel.slice(1).join('/'), token: number }); continue; }
    if (enFamilies.size && families.size && ![...families].some((f) => enFamilies.has(f))) {
      findings.push({ locale, page: rel.slice(1).join('/'), token: `${[...families].sort().join('/')}:${number}` });
    }
  }
}

walk(DIST);

// Same allowlist as the other two checkers. Entry files are source names (.mdx), so match on
// the basename: ar / iec-62133-2-cell-safety.mdx covers ar/blog/iec-62133-2-cell-safety.html.
const ALLOWLIST = path.resolve(__dirname, 'claims-parity.json');
const allow = existsSync(ALLOWLIST)
  ? JSON.parse(readFileSync(ALLOWLIST, 'utf8')).entries.map((e) => ({
      locale: e.locale,
      stem: path.basename(e.file).replace(/\.(mdx|json|html)$/, ''),
      token: e.token,
    }))
  : [];
const isAllowed = (f) => {
  const stem = f.page.replace(/\.html$/, '').split('/').pop();
  return allow.some((a) => a.locale === f.locale && a.token === f.token && a.stem === stem);
};
const unexpected = findings.filter((f) => !isAllowed(f));

console.log(`dist 扫描：比对 ${compared} 个本地化页面`);
if (!compared) console.log('  (没有可比对的本地化页面)');
console.log(`译文里多出英文没有的标准号：${findings.length} 处，其中已登记 ${findings.length - unexpected.length} 处`);

if (unexpected.length) {
  console.error(`\n❌ ${unexpected.length} 处未登记的漂移：`);
  for (const f of unexpected.slice(0, 20)) console.error(`  ${f.locale}/${f.page} → ${f.token}`);
  process.exit(1);
}

console.log('✅ dist 里无未登记的标准号漂移');
