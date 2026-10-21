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

// 标准号：机构前缀 + 编号，例如 IEC 60335-2-113、EN IEC 55014-1、CISPR 11、UN 38.3、ISO 13485
// 编号后只允许".数字"或"-数字"，否则荷兰语的 "IEC 60335-1-testrapport" 会整段吞进来。
const TOKEN = /\b(?:IEC|EN|CISPR|ISO|UN|ANSI|JIS|KS|GB|AS|ASTM|BS|UL)\s?\d+(?:[-.]\d+)*/g;

// 编号兜底：阿拉伯语把 ISO 写成「أيزو」，语法前缀匹配不到，但数字还在。
// 这几个编号是我们对外声明里真正要紧的标准，按数字找，不看前缀拼法。
const TRACKED_NUMBERS = /\b(?:13485|60335|62471|55014|60601|62133|14971|10993)\b(?:[-.]\d+)*/g;

const normalise = (s) => s.toUpperCase().replace(/\s+/g, ' ').replace(/[.,;:)]+$/, '').trim();

function tokensOf(file) {
  const text = readFileSync(file, 'utf8');
  const out = new Set();
  for (const m of text.match(TOKEN) ?? []) {
    const t = normalise(m);
    // 单独一个 "UN 38.3" 之类也要保留；过滤掉编号过短的空壳
    if (/\d/.test(t) && t.length >= 5) out.add(t);
  }
  for (const m of text.match(TRACKED_NUMBERS) ?? []) out.add(`#${m}`);
  return out;
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
  const enTokens = tokensOf(path.join(enDir, file));
  for (const locale of locales) {
    const target = path.join(BLOG, locale, file);
    if (!existsSync(target)) continue;
    compared++;
    const locTokens = tokensOf(target);
    const extras = [...locTokens].filter((t) => !enTokens.has(t));
    // 同一个漂移只报一次：编号已包含在某条前缀命中里时，不再单独报 "#60335-2-113"。
    const prefixed = extras.filter((t) => !t.startsWith('#'));
    for (const token of prefixed) findings.push({ locale, file, token });
    for (const token of extras.filter((t) => t.startsWith('#'))) {
      const num = token.slice(1);
      if (prefixed.some((p) => p.includes(num))) continue;
      findings.push({ locale, file, token });
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
