#!/usr/bin/env node
// Standard-number parity across locale message files.
//
// check-claims-parity.mjs covers blog MDX only: 104 English posts x 21 locales. Everything
// else on the site - products, services, about, components, the homepage - lives in
// astro/messages/<locale>.json, and until this script existed none of it was checked.
//
// Same rule as the blog checker: English is the only baseline. A standard number present in
// a locale but absent from the same English key is drift. A number whose family differs
// (ISO vs IEC) on both sides is a mis-citation.
//
// Shares claims-parity.json with the blog checker, so there is one exception mechanism, not
// two. Entries carry `file: "messages:<key path>"`.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES = path.resolve(__dirname, '../messages');
const ALLOWLIST = path.join(__dirname, 'claims-parity.json');

const TRACKED_NUMBERS =
  /(?:\b(ISO|IEC|EN|CISPR|ASTM|ANSI|JIS|KS|GB|UL|BS|أيزو)\s*(?:IEC\s*)?)?\b(13485|60335|62471|55014|60601|62133|14971|10993)\b(?:[-.]\d+)*/g;

const FAMILY_OF = {
  ISO: 'ISO', 'أيزو': 'ISO', IEC: 'IEC', EN: 'IEC', CISPR: 'CISPR', ASTM: 'ASTM',
  ANSI: 'ANSI', JIS: 'JIS', KS: 'KS', GB: 'GB', UL: 'UL', BS: 'BS',
};

// Non-global, so .test() has no lastIndex state. Used only as a cheap pre-filter.
const QUICK_NUMBER = /(13485|60335|62471|55014|60601|62133|14971|10993)/;

const normalise = (s) => s.toUpperCase().replace(/\s+/g, ' ').replace(/[.,;:)]+$/, '').trim();

function standardsOf(text) {
  const found = new Map();
  for (const m of text.matchAll(TRACKED_NUMBERS)) {
    const [, prefix] = m;
    const key = normalise(m[0].slice(prefix ? prefix.length : 0).replace(/^\s*(IEC\s*)?/, ''));
    if (!found.has(key)) found.set(key, new Set());
    if (prefix) found.get(key).add(FAMILY_OF[prefix.toUpperCase()] ?? prefix.toUpperCase());
  }
  return found;
}

function flatten(o, p = '') {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const kk = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, kk));
    else out[kk] = v;
  }
  return out;
}

const en = flatten(JSON.parse(readFileSync(path.join(MESSAGES, 'en.json'), 'utf8')));
const locales = readdirSync(MESSAGES)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

const findings = [];
let compared = 0;
let scanned = 0;

for (const locale of locales) {
  const loc = flatten(JSON.parse(readFileSync(path.join(MESSAGES, `${locale}.json`), 'utf8')));
  for (const [key, enValue] of Object.entries(en)) {
    if (typeof enValue !== 'string') continue;
    const locValue = loc[key];
    if (typeof locValue !== 'string') continue;
    // TRACKED_NUMBERS carries /g, so .test() advances lastIndex and makes this pre-filter
    // stateful: the same input gave 756 compared keys on one run and 168 on the next.
    // Use a fresh non-global copy so the scan is deterministic.
    if (!QUICK_NUMBER.test(enValue) && !QUICK_NUMBER.test(locValue)) continue;
    compared++;
    const enStd = standardsOf(enValue);
    const locStd = standardsOf(locValue);
    for (const [number, families] of locStd) {
      const enFamilies = enStd.get(number);
      if (!enFamilies) { findings.push({ locale, file: `messages:${key}`, token: number }); continue; }
      if (enFamilies.size && families.size) {
        const shared = [...families].some((f) => enFamilies.has(f));
        if (!shared) findings.push({ locale, file: `messages:${key}`, token: `${[...families].sort().join('/')}:${number}` });
      }
    }
  }
  scanned++;
}

const allow = existsSync(ALLOWLIST)
  ? new Set(JSON.parse(readFileSync(ALLOWLIST, 'utf8')).entries.map((e) => `${e.locale}|${e.file}|${e.token}`))
  : new Set();

const unexpected = findings.filter((f) => !allow.has(`${f.locale}|${f.file}|${f.token}`));

console.log(`扫描 ${scanned} 个语种，比对 ${compared} 个含标准编号的键`);
console.log(`译文里多出英文没有的标准号：${findings.length} 处，其中已登记 ${findings.length - unexpected.length} 处`);

if (unexpected.length) {
  console.error(`\n❌ ${unexpected.length} 处未登记的漂移：`);
  const byKey = {};
  for (const f of unexpected) (byKey[`${f.file} → ${f.token}`] ||= []).push(f.locale);
  for (const [k, locs] of Object.entries(byKey).slice(0, 20)) {
    console.error(`  ${k}  (${locs.length} 个语种: ${locs.slice(0, 6).join(', ')}${locs.length > 6 ? '…' : ''})`);
  }
  process.exit(1);
}

console.log('✅ messages 里无未登记的标准号漂移');
