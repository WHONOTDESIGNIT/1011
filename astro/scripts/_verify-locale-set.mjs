// 一次性脚本：核验某一 translationKey 在 22 语种目录下的 MDX 是否齐全且 frontmatter 合规。
//
// 校验项：
//   1) 22 个 locale 目录是否都有 <slug>.mdx
//   2) 必填字段 title / pubDate / author / category / translationKey 是否存在且非空
//   3) translationKey / slug 是否与期望值一致
//   4) description 是否达到最小长度（默认 60）
//   5) heroImage（若声明）对应文件是否存在于 public/
//   6) 正文内链 /path 是否为无 locale 前缀的站内链接，且 /blog/<slug> 目标存在
//   7) 正文是否残留源稿的 Meta 行 / 独立的 H1
//
// 用法：node scripts/_verify-locale-set.mjs <slug>

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO = path.resolve(__dirname, '..');
const BLOG = path.join(ASTRO, 'src/content/blog');
const PUBLIC = path.join(ASTRO, 'public');

const LOCALES = ['ar', 'cs', 'de', 'el', 'en', 'es', 'fa', 'fr', 'he', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'th', 'tr', 'vi'];
const REQUIRED = ['title', 'pubDate', 'author', 'category', 'translationKey'];
const MIN_DESC = 60;

const slug = process.argv[2];
if (!slug) {
  console.error('用法：node scripts/_verify-locale-set.mjs <slug>');
  process.exit(2);
}

function split(file) {
  const raw = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: '', body: raw, ok: false };
  return { fm: m[1], body: raw.slice(m[0].length), ok: true };
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return undefined;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

// 收集全站已有的 blog slug（跨 22 语种，用于内链目标存在性校验）
const allSlugs = new Set();
for (const loc of LOCALES) {
  const dir = path.join(BLOG, loc);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (/\.mdx?$/.test(f)) allSlugs.add(f.replace(/\.mdx?$/, ''));
  }
}

const problems = [];
const linkIssues = [];
let heroChecked = 0;
let heroOk = 0;

for (const loc of LOCALES) {
  const file = path.join(BLOG, loc, `${slug}.mdx`);
  if (!existsSync(file)) {
    problems.push(`${loc}: 文件缺失 → ${path.relative(ASTRO, file)}`);
    continue;
  }
  const { fm, body, ok } = split(file);
  if (!ok) {
    problems.push(`${loc}: 缺少 frontmatter 分隔符（---）`);
    continue;
  }

  for (const key of REQUIRED) {
    const v = fmValue(fm, key);
    if (!v) problems.push(`${loc}: 缺少必填字段 ${key}`);
  }
  for (const key of ['slug', 'translationKey']) {
    const v = fmValue(fm, key);
    if (v && v !== slug) problems.push(`${loc}: ${key} = "${v}"，与期望 "${slug}" 不一致`);
  }

  const desc = fmValue(fm, 'description') ?? '';
  if (desc.length < MIN_DESC) problems.push(`${loc}: description 仅 ${desc.length} 字符（< ${MIN_DESC}）`);

  const hero = fmValue(fm, 'heroImage');
  if (hero) {
    heroChecked++;
    const p = path.join(PUBLIC, hero.replace(/^\//, ''));
    if (existsSync(p)) heroOk++;
    else problems.push(`${loc}: heroImage 文件不存在 → public${hero}`);
  }

  // 正文残留检查
  if (/^\s*\*\*(?:Meta title|Meta description|عنوان|ชื่อ Meta|Titre méta|Meta-Titel)/im.test(body)) {
    problems.push(`${loc}: 正文残留 Meta 行`);
  }
  if (/^#\s+\S/m.test(body)) problems.push(`${loc}: 正文含一级标题 H1`);

  // 内链检查
  for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = m[1];
    if (/^\/(ar|cs|de|el|es|fa|fr|he|id|it|ja|ko|nl|pl|pt-br|pt-pt|ro|ru|th|tr|vi)\//i.test(href)) {
      linkIssues.push(`${loc}: 内链带 locale 前缀 → ${href}`);
      continue;
    }
    const bm = href.match(/^\/blog\/([a-z0-9-]+)$/);
    if (bm && !allSlugs.has(bm[1])) linkIssues.push(`${loc}: 内链死链 → ${href}`);
  }
}

console.log(`slug: ${slug}`);
console.log(`locale 目录：${LOCALES.length}`);
console.log(`文件存在：${LOCALES.filter((l) => existsSync(path.join(BLOG, l, `${slug}.mdx`))).length}`);
console.log(`heroImage 声明：${heroChecked} 处，文件存在 ${heroOk} 处`);
console.log(`frontmatter 问题：${problems.length}`);
for (const p of problems) console.log(`  - ${p}`);
console.log(`内链问题：${linkIssues.length}`);
for (const p of linkIssues) console.log(`  - ${p}`);

process.exit(problems.length + linkIssues.length ? 1 : 0);
