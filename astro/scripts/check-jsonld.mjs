#!/usr/bin/env node
/**
 * check-jsonld.mjs — 结构化数据守卫（防止 JSON-LD 里出现相对 URL / 无时区日期）
 *
 * 背景：2026-09-17 全站体检（3,058 页 / 12,081 个 JSON-LD 块）发现三类非法值：
 *   ① Article.author.image 用了站内相对路径（/images/...）→ Google 要求绝对 URL
 *   ② Organization 缺 url
 *   ③ EducationalOccupationalCredential.dateCreated 无时区
 * 这三类问题都能靠约定避免，但约定会被下一次改动忘掉 —— 所以做成守卫：
 * 构建时扫描 dist 内每页 <head> 的 JSON-LD，发现以下情况即以非零退出码中断构建：
 *   · url / image / logo / thumbnailUrl / contentUrl / item 等字段为相对路径
 *   · datePublished / dateModified / dateCreated / uploadDate 等字段缺少时区
 *   · JSON-LD 解析失败、字段为空/占位符（"" / null / undefined / [object Object]）
 *
 * 用法：
 *   node scripts/check-jsonld.mjs            # 扫描全站（构建链调用）
 *   node scripts/check-jsonld.mjs --limit 200  # 只扫前 N 页（本地快速自查）
 */
import { readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const HEAD_BYTES = 120000;                     // 结构化数据都在 <head>，只读前 120KB
const SKIP_DIRS = new Set(['_astro', 'images', 'fonts', 'videos', '__forms', '.netlify']);
const args = process.argv.slice(2);
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || Infinity;

const URL_FIELDS = new Set(['url', 'image', 'logo', 'thumbnailUrl', 'contentUrl', 'item', '@id', 'sameAs']);
const DATE_FIELDS = new Set(['datePublished', 'dateModified', 'dateCreated', 'uploadDate', 'validFrom', 'priceValidUntil', 'startDate', 'endDate']);
const BAD_VALUES = new Set(['', 'null', 'undefined', 'none', 'n/a', '[object object]', 'nan']);
const ISO_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const issues = [];
let pages = 0;
let blocks = 0;

function walkHtml(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...walkHtml(join(dir, e.name)));
    } else if (e.name.endsWith('.html')) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

function readHead(file) {
  const fd = openSync(file, 'r');
  const buf = Buffer.allocUnsafe(HEAD_BYTES);
  const n = readSync(fd, buf, 0, HEAD_BYTES, 0);
  closeSync(fd);
  let s = buf.subarray(0, n).toString('utf8');
  const cut = s.indexOf('</head>');
  if (cut > 0) s = s.slice(0, cut);
  return s;
}

function check(node, page, pathStr) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => check(v, page, `${pathStr}[${i}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    const here = pathStr ? `${pathStr}.${k}` : k;
    if (typeof v === 'string') {
      if (BAD_VALUES.has(v.trim().toLowerCase())) {
        issues.push({ page, kind: '空值/占位符', detail: `${here} = ${JSON.stringify(v)}` });
      } else if (URL_FIELDS.has(k) && !/^https?:\/\//.test(v) && !v.startsWith('#') && !v.startsWith('mailto:')) {
        issues.push({ page, kind: '相对 URL', detail: `${here} = ${v.slice(0, 60)}` });
      } else if (DATE_FIELDS.has(k) && !ISO_TZ.test(v)) {
        issues.push({ page, kind: '日期缺时区', detail: `${here} = ${v}` });
      }
    } else if (v && typeof v === 'object') {
      check(v, page, here);
    }
  }
}

const files = walkHtml(DIST);
for (const f of files) {
  if (pages >= LIMIT) break;
  pages++;
  const head = readHead(f);
  if (!head.includes('application/ld+json')) continue;
  const rel = relative(DIST, f).replace(/\\/g, '/');
  for (const m of head.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks++;
    try {
      check(JSON.parse(m[1].trim()), rel, '');
    } catch (e) {
      issues.push({ page: rel, kind: 'JSON-LD 解析失败', detail: String(e.message).slice(0, 70) });
    }
  }
}

console.log(`[jsonld-guard] 扫描 ${pages} 页 / ${blocks} 个 JSON-LD 块`);
if (issues.length === 0) {
  console.log('[jsonld-guard] ✓ 无相对 URL、无无时区日期、无空值');
  process.exit(0);
}
const byKind = {};
for (const i of issues) (byKind[i.kind] ||= []).push(i);
for (const [kind, rows] of Object.entries(byKind)) {
  console.error(`  ✗ ${kind}：${rows.length} 处`);
  for (const r of rows.slice(0, 5)) console.error(`      ${r.page} → ${r.detail}`);
}
console.error('[jsonld-guard] 请在生成 JSON-LD 的模板中修正后重新构建。');
process.exit(1);
