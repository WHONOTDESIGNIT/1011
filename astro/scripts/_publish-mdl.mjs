// 一次性脚本：把 blog-0903 的 22 份 do-you-need-canada-mdl-ipl-device 源稿转为可构建 MDX。
// 源稿格式 =「H1 + **Meta title:** 行 + **Meta description:** 行 + 正文」，无 frontmatter。
// 处理：H1→title、Meta description→description，两条 Meta 行从正文删除，
//       补齐 pubDate/author/category/heroImage/slug/translationKey/url。
// 用法：node scripts/_publish-mdl.mjs [--dry] [--verify]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const VERIFY = process.argv.includes('--verify');

const SRC_DIR = 'blog-0903';
const BLOG_DIR = 'src/content/blog';
const SLUG = 'do-you-need-canada-mdl-ipl-device';
const TRANSLATION_KEY = SLUG;
const HERO = `/images/blog/blog-${SLUG}.webp`;
const HERO_ABS = join('public', HERO.replace(/^\//, ''));
const PUB_DATE = '2026-09-04';
const AUTHOR = 'iShine Team';
const CATEGORY = 'Regulatory';

/** locale → 源文件名（en 用 _SOURCE.md，其余为 IPL-MDL-<locale>.md） */
const LOCALE_SUFFIXES = [
  'ar', 'cs', 'de', 'el', 'es', 'fa', 'fr', 'he', 'id', 'it', 'ja',
  'ko', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'th', 'tr', 'vi',
];
const SOURCES = { en: '_SOURCE.md' };
for (const s of LOCALE_SUFFIXES) SOURCES[s] = `IPL-MDL-${s}.md`;

const yamlStr = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** 解析单份源稿 */
function parseSource(src) {
  const lines = src.split(/\r?\n/);

  const titleLine = lines.find((l) => /^#\s+\S/.test(l));
  if (!titleLine) throw new Error('H1 缺失');
  const title = titleLine.replace(/^#\s+/, '').trim();

  // 取正文开头的两条 `**<标签>:** <值>` 行（本地化标签：Meta title / عنوان الميتا / ชื่อ Meta …）
  const metas = [];
  const body = [];
  let titleSeen = false;
  for (const l of lines) {
    if (!titleSeen && l === titleLine) {
      titleSeen = true;
      continue;
    }
    const m = l.match(/^\*\*(.+?)\s*:\*\*\s*(.*)$/);
    if (m && metas.length < 2) {
      metas.push(m[2].trim());
      continue;
    }
    body.push(l);
  }
  if (metas.length < 2) throw new Error(`Meta 行不足（${metas.length}）`);
  const description = metas[1];
  if (description.length < 60) throw new Error(`description 异常（${description.length} 字符）`);

  while (body.length && body[0].trim() === '') body.shift();
  return { title, description, body };
}

/** 生成 MDX 全文 */
function buildMdx(parsed) {
  const head = [
    '---',
    `title: ${yamlStr(parsed.title)}`,
    `description: ${yamlStr(parsed.description)}`,
    `pubDate: "${PUB_DATE}"`,
    `author: ${yamlStr(AUTHOR)}`,
    `category: ${yamlStr(CATEGORY)}`,
    `heroImage: ${yamlStr(HERO)}`,
    `slug: ${yamlStr(SLUG)}`,
    `translationKey: ${yamlStr(TRANSLATION_KEY)}`,
    `url: https://iplmanufacturer.com/blog/${SLUG}`,
    '---',
    '',
  ];
  const bodyText = parsed.body.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  return head.join('\n') + '\n' + bodyText + '\n';
}

// ---------------------------------------------------------------- verify

function verifyAll() {
  const problems = [];
  const links = new Map();
  let checked = 0;
  for (const locale of Object.keys(SOURCES)) {
    const f = join(BLOG_DIR, locale, `${SLUG}.mdx`);
    if (!existsSync(f)) {
      problems.push(`${locale}: 文件缺失`);
      continue;
    }
    checked++;
    const src = readFileSync(f, 'utf8');
    const required = [
      '---',
      `slug: "${SLUG}"`,
      `translationKey: "${TRANSLATION_KEY}"`,
      `heroImage: "${HERO}"`,
      'category: "Regulatory"',
      `url: https://iplmanufacturer.com/blog/${SLUG}`,
      `pubDate: "${PUB_DATE}"`,
      'description:',
      'title:',
      'author:',
    ];
    for (const r of required) {
      if (!src.includes(r)) problems.push(`${locale}: 缺少 ${r}`);
    }
    if (/\*\*[^*\n]+:\*\*/.test(src.split(/^---$/m).slice(2).join('---'))) {
      problems.push(`${locale}: 正文仍残留 **标签:** Meta 行`);
    }
    for (const m of src.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      links.set(m[1], (links.get(m[1]) || 0) + 1);
    }
    for (const m of src.matchAll(
      /\]\((\/(?:ar|cs|de|el|es|fa|fr|he|id|it|ja|ko|nl|pl|pt-BR|pt-PT|ro|ru|th|tr|vi)\/)/g,
    )) {
      problems.push(`${locale}: 存在 locale 前缀内链 ${m[1]}`);
    }
  }
  console.log(`files checked: ${checked}`);
  console.log(`problems: ${problems.length ? '' : 'none'}`);
  problems.forEach((p) => console.log(`  ! ${p}`));
  console.log(
    `internal links: ${links.size ? [...links].map(([k, v]) => `${k} x${v}`).join(', ') : 'none'}`,
  );
  console.log(`heroImage 存在: ${existsSync(HERO_ABS)}`);
  return problems.length;
}

// ---------------------------------------------------------------- main

if (VERIFY) {
  process.exit(verifyAll() ? 1 : 0);
}

let written = 0;
for (const [locale, file] of Object.entries(SOURCES)) {
  const srcFile = join(SRC_DIR, file);
  if (!existsSync(srcFile)) {
    console.log(`MISSING  ${srcFile}`);
    continue;
  }
  let parsed;
  try {
    parsed = parseSource(readFileSync(srcFile, 'utf8'));
  } catch (e) {
    console.log(`ERROR    ${srcFile}: ${e.message}`);
    continue;
  }
  if (DRY) {
    console.log(`--- ${file} -> ${locale}`);
    console.log(`    title: ${parsed.title}`);
    console.log(`    desc : ${parsed.description}`);
    console.log(`    body : ${parsed.body.length} 行 / 首行 ${JSON.stringify(parsed.body[0]).slice(0, 60)}`);
    continue;
  }
  const outFile = join(BLOG_DIR, locale, `${SLUG}.mdx`);
  writeFileSync(outFile, buildMdx(parsed), 'utf8');
  console.log(`WRITTEN  ${outFile}`);
  written++;
}

if (!DRY) {
  console.log(`\nlocales: ${Object.keys(SOURCES).length}  written: ${written}`);
  console.log(`heroImage 存在: ${existsSync(HERO_ABS)}`);
}
