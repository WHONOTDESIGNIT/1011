#!/usr/bin/env node
// 标准号跨语种一致性守卫。
//
// 起因：英文源把 IEC 60335-2-113 全量改成 EN IEC 60335-2-23（并删掉部分引用），
// 21 个语种的译文没有跟，站上仍有 357 处旧编号；而旧译文对 2-113 的描述是准确的，
// 机械替换会得到"编号对、描述错"。这类漂移人眼看不见，只能靠机器比对。
//
// 规则：以英文为唯一基准。某语种出现了英文里没有的标准号 = 译文漂移，报出来。
// 允许列表 claims-parity.json 记录"已知待翻译"的条目；修掉一批就删一批，
// 不能靠放宽规则让它变绿。

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG = path.resolve(__dirname, '../src/content/blog');
const ALLOWLIST = path.join(__dirname, 'claims-parity.json');
const WRITE_ALLOWLIST = process.argv.includes('--write-allowlist');

// 标准号按【编号】比较，同时比较它的【族】：英文写 "14-2"、译文写 "a CISPR 14-2" 是同一件事，
// 所以前缀"有/没有"不算差异；但把 ISO 10993 写成 IEC 10993、把 CISPR 14 写成 IEC 14
// 是不同的标准，必须报出来。族只在前缀两边都存在且不同时才判错。
const TRACKED_NUMBERS = /(?:\b(ISO|IEC|EN|CISPR|ASTM|ANSI|JIS|KS|GB|UL|BS|أيزو)\s*(?:IEC\s*)?)?\b(13485|60335|62471|55014|60601|62133|14971|10993)\b(?:[-.]\d+)*/g;

// 前缀 → 族：EN 与 أيزو 都是 IEC/ISO 体系的本地写法，归到最近的族
const FAMILY_OF = {
  ISO: 'ISO',
  'أيزو': 'ISO',
  IEC: 'IEC',
  EN: 'IEC',
  CISPR: 'CISPR',
  ASTM: 'ASTM',
  ANSI: 'ANSI',
  JIS: 'JIS',
  KS: 'KS',
  GB: 'GB',
  UL: 'UL',
  BS: 'BS',
};

const normalise = (s) => s.toUpperCase().replace(/\s+/g, ' ').replace(/[.,;:)]+$/, '').trim();

/** 返回 Map<编号, Set<族>>；"没写前缀"表示该处不指定族 */
function standardsOf(file) {
  const text = readFileSync(file, 'utf8');
  const found = new Map();
  for (const m of text.matchAll(TRACKED_NUMBERS)) {
    const [, prefix, number] = m;
    const key = normalise(m[0].slice(prefix ? prefix.length : 0).replace(/^\s*(IEC\s*)?/, ''));
    if (!found.has(key)) found.set(key, new Set());
    if (prefix) found.get(key).add(FAMILY_OF[prefix.toUpperCase()] ?? prefix.toUpperCase());
  }
  return found;
}

const locales = readdirSync(BLOG, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((l) => l !== 'en');

const enDir = path.join(BLOG, 'en');
const enFiles = readdirSync(enDir).filter((f) => f.endsWith('.mdx'));

const findings = []; // { locale, file, token }
let compared = 0;

for (const file of enFiles) {
  const enStandards = standardsOf(path.join(enDir, file));
  for (const locale of locales) {
    const target = path.join(BLOG, locale, file);
    if (!existsSync(target)) continue;
    compared++;
    const locStandards = standardsOf(target);
    for (const [number, families] of locStandards) {
      const enFamilies = enStandards.get(number);
      if (!enFamilies) {
        // 整条编号在英文里不存在：沿用原来的判定
        findings.push({ locale, file, token: number });
        continue;
      }
      // 编号两边都有；只有当两边都写了前缀、且族毫无交集时，才算错标了标准
      if (enFamilies.size && families.size) {
        const shared = [...families].some((f) => enFamilies.has(f));
        if (!shared) findings.push({ locale, file, token: `${[...families].sort().join('/')}:${number}` });
      }
    }
  }
}

const allow = existsSync(ALLOWLIST)
  ? new Set(JSON.parse(readFileSync(ALLOWLIST, 'utf8')).entries.map((e) => `${e.locale}|${e.file}|${e.token}`))
  : new Set();

if (WRITE_ALLOWLIST) {
  const entries = findings
    .map((f) => ({ locale: f.locale, file: f.file, token: f.token }))
    .sort((a, b) => (a.file + a.locale + a.token).localeCompare(b.file + b.locale + b.token));
  writeFileSync(
    ALLOWLIST,
    JSON.stringify(
      {
        note: 'Known translation drift: a standard number present in a locale but absent from the English source. Shrink this list as the posts are retranslated; never add to it to silence the check.',
        entries,
      },
      null,
      2
    ) + '\n'
  );
  console.log(`已写入允许列表：${entries.length} 条（${new Set(entries.map((e) => e.file)).size} 个文件）`);
  process.exit(0);
}

const unexpected = findings.filter((f) => !allow.has(`${f.locale}|${f.file}|${f.token}`));
const stale = [...allow].filter(
  (k) => !findings.some((f) => `${f.locale}|${f.file}|${f.token}` === k)
);

console.log(`比对 ${compared} 个本地化文件（${enFiles.length} 篇英文 × ${locales.length} 语种）`);
console.log(`译文里多出英文没有的标准号：${findings.length} 处，其中已登记 ${findings.length - unexpected.length} 处`);

if (unexpected.length) {
  console.error(`\n❌ ${unexpected.length} 处未登记的漂移：`);
  const byFile = {};
  for (const f of unexpected) (byFile[`${f.file} → ${f.token}`] = byFile[`${f.file} → ${f.token}`] || []).push(f.locale);
  for (const [key, locs] of Object.entries(byFile).slice(0, 20)) {
    console.error(`  ${key}  (${locs.length} 个语种: ${locs.slice(0, 6).join(', ')}${locs.length > 6 ? '…' : ''})`);
  }
  console.error('\n处理：按英文段重译这些句子（编号替换会得到"编号对、描述错"）；');
  console.error('确实要长期保留的，加进 claims-parity.json 并写明原因。');
  process.exit(1);
}

if (stale.length) {
  console.log(`\n提示：允许列表里有 ${stale.length} 条已不存在（译文已修好），可以删掉让列表保持真实。`);
}
console.log('✅ 无未登记的标准号漂移');
