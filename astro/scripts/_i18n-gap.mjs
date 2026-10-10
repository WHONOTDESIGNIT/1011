// 一次性脚本：扫描 22 语种的翻译缺口（会由 t() 回退到 en 的部分）。
//
// 两条独立链路：
//   1) messages/<locale>.json —— 驱动所有静态页（about/contact/services/products/faq/careers/...）
//      i18n.ts 的 t() 在 key 缺失时逐 key 回退到 en。
//   2) src/content/blog/<locale>/*.mdx —— 博客；某语言缺该 translationKey 时，
//      [slug].astro 按 i18n fallback 渲染英文原文（URL 不变）。
//
// 用法：node scripts/_i18n-gap.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const MSG = path.join(ROOT, 'messages');
const BLOG = path.resolve(__dirname, '../src/content/blog');

const EN = 'en';
const LOCALES = ['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];

function loadJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// 递归收集叶子 key（数组整体视为叶子）
function leaves(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, key, out);
    else out.add(key);
  }
  return out;
}

function get(obj, key) {
  return key.split('.').reduce((acc, p) => (acc && typeof acc === 'object' ? acc[p] : undefined), obj);
}

// ── 1. messages 缺口 ──────────────────────────────────────
const enMsgs = loadJson(path.join(MSG, `${EN}.json`));
const enLeaves = [...leaves(enMsgs)];
const enSet = new Set(enLeaves);

const perLocale = {};
for (const loc of LOCALES) {
  const file = path.join(MSG, `${loc}.json`);
  if (!existsSync(file)) {
    perLocale[loc] = { missing: enLeaves.length, total: enLeaves.length, keys: enLeaves, extra: 0 };
    continue;
  }
  const msgs = loadJson(file);
  const own = leaves(msgs);
  const missing = enLeaves.filter((k) => !own.has(k));
  const extra = [...own].filter((k) => !enSet.has(k));
  perLocale[loc] = { missing: missing.length, total: enLeaves.length, keys: missing, extra: extra.length };
}

console.log('='.repeat(78));
console.log('1) messages/<locale>.json 对 en 的缺口（t() 会逐 key 回退到 en）');
console.log('='.repeat(78));
console.log(`en 叶子 key 总数：${enLeaves.length}\n`);
console.log('locale   缺失key   完整率   多余key(不在en里)');
for (const loc of LOCALES) {
  const s = perLocale[loc];
  const pct = (((s.total - s.missing) / s.total) * 100).toFixed(1);
  console.log(`${loc.padEnd(8)} ${String(s.missing).padStart(6)}   ${pct.padStart(5)}%   ${String(s.extra).padStart(6)}`);
}

// 按 namespace（第一段）聚合，列出该 namespace 下有多少 key 在哪些 locale 缺失
const byNs = new Map();
for (const key of enLeaves) {
  const ns = key.split('.')[0];
  if (!byNs.has(ns)) byNs.set(ns, []);
  byNs.get(ns).push(key);
}

console.log('\n' + '='.repeat(78));
console.log('2) 按页面命名空间看缺口（只列有缺口的 namespace）');
console.log('='.repeat(78));
const nsRows = [];
for (const [ns, keys] of byNs) {
  const affected = {};
  for (const loc of LOCALES) {
    const miss = keys.filter((k) => perLocale[loc].keys.includes(k)).length;
    if (miss) affected[loc] = miss;
  }
  const n = Object.keys(affected).length;
  if (n) nsRows.push({ ns, total: keys.length, locales: n, affected });
}
nsRows.sort((a, b) => b.locales - a.locales || b.total - a.total);
for (const r of nsRows) {
  const detail = Object.entries(r.affected).map(([l, c]) => `${l}:${c}`).join(' ');
  console.log(`\n[${r.ns}]  en 共 ${r.total} key，${r.locales}/21 语言缺失`);
  console.log(`  ${detail}`);
}
const completeNs = [...byNs.keys()].filter((ns) => !nsRows.some((r) => r.ns === ns));
console.log(`\n全语言完整（无缺口）的 namespace：${completeNs.length} 个`);
console.log('  ' + completeNs.join(', '));

// 2b. 缺口 namespace 逐层下钻（21 语言缺口高度一致，用 tr 作代表）
console.log('\n' + '='.repeat(78));
console.log('2b) 缺口 namespace 下钻（以 tr 为代表；21 语言缺口数一致）');
console.log('='.repeat(78));
for (const r of nsRows) {
  const miss = perLocale.tr.keys.filter((k) => k.startsWith(`${r.ns}.`));
  const bySub = new Map();
  for (const k of miss) {
    const sub = k.split('.').slice(0, 2).join('.');
    if (!bySub.has(sub)) bySub.set(sub, []);
    bySub.get(sub).push(k);
  }
  console.log(`\n[${r.ns}] 缺 ${miss.length} key，分 ${bySub.size} 个子组`);
  for (const [sub, keys] of [...bySub.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (keys.length === 1) console.log(`  ${sub}  →  ${keys[0].replace(`${sub}.`, '')}`);
    else console.log(`  ${sub}  (${keys.length} key)`);
  }
}

// ── 2. blog 覆盖度 ────────────────────────────────────────
const blogLocales = readdirSync(BLOG, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

function keysOf(loc) {
  const dir = path.join(BLOG, loc);
  const set = new Map(); // translationKey -> 文件名
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.mdx') && !f.endsWith('.md')) continue;
    const raw = readFileSync(path.join(dir, f), 'utf8');
    const m = raw.match(/^translationKey:\s*["']?([^"'\n]+)["']?/m);
    const slug = raw.match(/^slug:\s*["']?([^"'\n]+)["']?/m);
    const key = (m ? m[1].trim() : slug ? slug[1].trim() : f.replace(/\.mdx?$/, ''));
    set.set(key, f);
  }
  return set;
}

const enBlog = keysOf(EN);
console.log('\n' + '='.repeat(78));
console.log('3) 博客：各语言缺少的 translationKey（按 i18n fallback 渲染英文原文）');
console.log('='.repeat(78));
console.log(`en 文章数：${enBlog.size}\n`);

const blogMissing = {};
for (const loc of blogLocales.filter((l) => l !== EN)) {
  const own = keysOf(loc);
  const dir = loc.toLowerCase() === 'en' ? EN : loc;
  const miss = [...enBlog.keys()].filter((k) => !own.has(k));
  blogMissing[loc] = { have: own.size, miss };
  console.log(`${loc.padEnd(8)} 本地化 ${String(own.size).padStart(3)}/${enBlog.size}   缺 ${String(miss.length).padStart(3)}`);
}

// 汇总「有多少语言缺同一篇」
const perArticle = [];
for (const [k, f] of enBlog) {
  const absent = blogLocales.filter((l) => l !== EN && blogMissing[l].miss.includes(k));
  if (absent.length) perArticle.push({ key: k, file: f, absent: absent.length, locales: absent });
}
perArticle.sort((a, b) => b.absent - a.absent || a.key.localeCompare(b.key));
console.log(`\n有缺口的文章共 ${perArticle.length} / ${enBlog.size} 篇（按缺口语言数排序）`);
for (const a of perArticle) {
  console.log(`\n  ${a.key}  (缺 ${a.absent}/21)`);
  console.log(`    ${a.locales.join(' ')}`);
}

// 反查：缺失为 0 的语言
const full = blogLocales.filter((l) => l !== EN && blogMissing[l].miss.length === 0);
console.log(`\n博客 22/22 齐全的语言：${full.length ? full.join(', ') : '（无）'}`);
