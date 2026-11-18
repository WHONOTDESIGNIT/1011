#!/usr/bin/env node
/**
 * check-brand-facts-consistency.mjs
 *
 * 目的：防止「同一事实、多种写法」再次漂移（见 docs/facts-conflict-register）。
 * 只做静态文本断言，不联网、不改文件。
 *
 * 裁决基线（2026-11-18）：
 *   - 法律实体：Shenzhen iShine Technology Co., Ltd.
 *   - 厂房面积：1,500 m²
 *   - 成立：2021（法律实体）；团队 home-use IPL 工作可回溯到 2018
 *   - MOQ：500 units；首阶段试单 100 units
 *   - 认证：ISO 13485 / MDSAP 已于 2026-04-03 到期，不得写成现行资质
 *   - MDR：无自有证书，正在推进，不得写「持有」或「唯一」
 *
 * 用法：node scripts/check-brand-facts-consistency.mjs [--warn-only]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const WARN_ONLY = process.argv.includes('--warn-only');

const RULES = [
  {
    id: 'entity-company-limited',
    re: /\bCOMPANY LIMITED\b/,
    why: '实体写法未采用 Shenzhen iShine Technology Co., Ltd.',
    level: 'error',
  },
  {
    id: 'entity-ltd-short',
    re: /\biShine Technology Ltd\b(?!\.)/,
    why: '实体写法应为 Shenzhen iShine Technology Co., Ltd.',
    level: 'error',
  },
  {
    id: 'facility-10000',
    re: /10,?000\s*(m²|m2|mÂ²|sqm|square\s*met)/i,
    why: '面积基线为 1,500 m²',
    level: 'error',
  },
  {
    id: 'capacity-50000-month',
    // 只针对 50,000/月 这一条具体产能口径；排除金额（$50,000 广告预算）。
    re: /(?<![\w$])50,?000\s*(units?|devices?|pcs)?\s*(per|\/|a)\s*month\b/i,
    disallowIfLineMatches: /\$|spending|budget|ad spend|revenue/i,
    why: '月产能口径未获公开授权',
    level: 'error',
  },
  {
    id: 'exclusive-mdr',
    re: /only\s+one\s+company|唯一持证|the\s+only\s+.{0,30}certificate/i,
    why: '排他性认证声明（无支撑）',
    level: 'error',
  },
  {
    id: 'iso-current-claim',
    // 只拦截「关于我方」的现行资质声明；关键词举例（如 "ISO 13485 certified ..." 作为搜索词）
    // 不点名 iShine / we / our 时不算断言。
    re: /(?<![\w-])(iShine|we|our)\b.{0,80}ISO\s*13485[\s-]*(certified|compliant)|ISO\s*13485[\s-]*(certified|compliant).{0,80}(iShine|we|our)\b/i,
    why: 'ISO 13485 已于 2026-04-03 到期，不得写成我方现行资质',
    level: 'error',
  },
  {
    id: 'mdr-holds',
    // 只拦截「我方主语 + 持有 MDR 证书」的肯定句。
    // 行业陈述（"only a handful of manufacturers hold..."）与他方主语不算。
    re: /(?<![\w-])(iShine|we|our)\b[^.]{0,25}\b(holds?|have held|has held|hold)\b[^.]{0,25}\bMDR[\s-]?(certificate|certified)\b/i,
    disallowIfLineMatches: /\b(manufacturers?|companies|brands?|competitors?|do not|does not|never|no own|not yet)\b/i,
    why: 'MDR 无自有证书，只能写「推进中」',
    level: 'error',
  },
  {
    id: 'moq-200-trial',
    re: /200[\s-]?unit\s+(first\s+)?trial|trial\s+order\s+of\s+200/i,
    why: '试单基线已改为 100 units',
    level: 'error',
  },
  {
    id: 'moq-from-1-unit',
    re: /logo\s+(marking\s+)?from\s+1\s+unit/i,
    why: '与「MOQ 500 / 试单 100」政策冲突，需改写',
    level: 'warn',
  },
];

const TARGETS = [
  { dir: 'messages', ext: '.json' },
  { dir: 'src/content/blog/en', ext: '.mdx' },
  { dir: 'src/pages', ext: '.astro' },
];

function walk(dir, ext, out = []) {
  let ents;
  try {
    ents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const errors = [];
const warns = [];

for (const t of TARGETS) {
  const base = join(ROOT, t.dir);
  for (const file of walk(base, t.ext)) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const rule of RULES) {
        if (!rule.re.test(line)) continue;
        if (rule.disallowIfLineMatches && rule.disallowIfLineMatches.test(line)) continue;
        const hit = {
          file: relative(ROOT, file),
          line: i + 1,
          rule: rule.id,
          why: rule.why,
          sample: line.trim().slice(0, 120),
        };
        (rule.level === 'error' ? errors : warns).push(hit);
      }
    }
  }
}

const byRule = new Map();
for (const e of [...errors, ...warns]) {
  byRule.set(e.rule, (byRule.get(e.rule) ?? 0) + 1);
}

console.log('\n[brand-facts] 扫描目录：' + TARGETS.map((t) => t.dir).join(', '));
if (byRule.size === 0) {
  console.log('[brand-facts] 未发现冲突写法 ✓');
} else {
  for (const [rule, n] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule}: ${n}`);
  }
}

for (const e of errors.slice(0, 40)) {
  console.log(`\n  ERROR ${e.file}:${e.line}  [${e.rule}]`);
  console.log(`        ${e.why}`);
  console.log(`        > ${e.sample}`);
}
if (errors.length > 40) console.log(`\n  ... 其余 ${errors.length - 40} 条略`);

for (const w of warns.slice(0, 10)) {
  console.log(`\n  WARN  ${w.file}:${w.line}  [${w.rule}]  ${w.sample}`);
}

console.log(`\n[brand-facts] error=${errors.length} warn=${warns.length}`);
if (errors.length > 0 && !WARN_ONLY) {
  console.log('[brand-facts] 结论：存在未裁决的事实冲突，构建应失败。\n');
  process.exit(1);
}
console.log('[brand-facts] 结论：通过。\n');
