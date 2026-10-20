#!/usr/bin/env node
/**
 * check-llms-coverage.mjs — llms.txt 覆盖度与引用有效性守卫
 *
 * 为什么需要它：
 *   check-llms.mjs 只保证「llms.txt 里写出来的链接是活的」，不保证「该写的没漏」。
 *   2026-10-20 审计发现 Blog 段当时只有一条 /blog 链接，76 篇正文一篇未列，而没有任何
 *   守卫报警 —— 缺口是靠人肉发现的。本脚本把这件事变成构建失败。
 *
 * 两条规则：
 *   1. 引用有效性：llms.txt 中出现的每一个 /blog/<slug> 必须能在
 *      src/content/blog/en 的 slug 集合里找到。防「llms.txt 写了一个不存在的文章」。
 *      （check-llms.mjs 校验的是 dist 产物，需要完整构建；本条只看内容源，dist 为空也能跑。）
 *   2. 商业内容覆盖：category 属于 PRIORITY_CATEGORIES 的英文文章，必须出现在 llms.txt。
 *      llms.txt 是**策展索引**，不要求全量收录，所以只对采购决策链上的类目强制覆盖；
 *      消费科普类允许不进。
 *
 * 判定为失败的两种情况都以非零退出码中断构建。
 *
 * 用法：node scripts/check-llms-coverage.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LLMS = join(ROOT, 'public', 'llms.txt');
const BLOG_EN = join(ROOT, 'src', 'content', 'blog', 'en');

// 只强制覆盖采购决策链上的类目。新增类目时先想清楚它是否属于「会被 AI 引用的商业内容」。
const PRIORITY_CATEGORIES = new Set(['Sourcing', 'OEM/ODM', 'Regulatory', 'B2B']);

const llms = readFileSync(LLMS, 'utf8');
const listed = new Set(
  [...llms.matchAll(/iplmanufacturer\.com\/blog\/([a-z0-9-]+)/g)].map((m) => m[1]),
);

// 读内容集合：slug 与 category 都从 frontmatter 取，文件名不作为 slug 依据
// （站内存在 slug 与文件名不一致的情况，例如 22-ugly-truth-about-... 的 slug 是
//  ugly-truth-ipl-manufacturers-energy-adapter-fda）。
const posts = new Map();
for (const file of readdirSync(BLOG_EN)) {
  if (!file.endsWith('.mdx')) continue;
  const text = readFileSync(join(BLOG_EN, file), 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const slug = (fm[1].match(/^slug:\s*"?([^"\n]+)"?/m) || [])[1] || file.replace(/\.mdx$/, '');
  const category = ((fm[1].match(/^category:\s*"?([^"\n]+)"?/m) || [])[1] || '').trim();
  posts.set(slug.trim(), category);
}

const problems = [];

// 规则 1：llms.txt 引用的 slug 必须真实存在
for (const slug of listed) {
  if (!posts.has(slug)) {
    problems.push(`llms.txt 引用了不存在的文章：/blog/${slug}`);
  }
}

// 规则 2：优先类目必须被收录
const missing = [];
for (const [slug, category] of posts) {
  if (PRIORITY_CATEGORIES.has(category) && !listed.has(slug)) {
    missing.push(`/blog/${slug}  [${category}]`);
  }
}
for (const m of missing.sort()) {
  problems.push(`优先类目文章未收录进 llms.txt：${m}`);
}

if (problems.length) {
  console.error(`[llms-coverage] ✗ ${problems.length} 处问题：`);
  for (const p of problems) console.error(`   ${p}`);
  console.error('');
  console.error('[llms-coverage] 处理方式：');
  console.error('   · 引用了不存在的文章 → 修正 llms.txt 里的 slug');
  console.error('   · 优先类目未收录 → 把该文章加进 llms.txt 对应分组');
  console.error('   · 若该文章确实不该进索引，调整它的 category（而不是放宽本守卫）');
  process.exit(1);
}

console.log(
  `[llms-coverage] ✓ llms.txt 引用 ${listed.size} 篇全部存在；` +
    `优先类目（${[...PRIORITY_CATEGORIES].join(' / ')}）覆盖完整`,
);
