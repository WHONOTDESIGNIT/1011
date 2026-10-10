// 一次性脚本：把 blog-0903 的 21 份 cooling-ipl-hair-remover-buying-guide 源稿转为可构建 MDX。
// 源稿格式 =「Publishing Metadata 表 + --- + 文章正文 + 文末 FAQ 段」。
// 处理：H1→title、Metadata 表第 4 行→description、第 1/2 行→primary/secondary_keywords、
//       文末 FAQ 段抽成 frontmatter faqs 并从正文删除，补齐 pubDate/author/category/heroImage/slug/translationKey/url。
// 用法：node scripts/_publish-cooling.mjs [--dry] [--verify]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const VERIFY = process.argv.includes('--verify');

const SRC_DIR = 'blog-0903';
const BLOG_DIR = 'src/content/blog';
const SLUG = 'cooling-ipl-hair-remover-buying-guide';
const TRANSLATION_KEY = SLUG;
const HERO = `/images/blog/blog-${SLUG}.webp`;
const PUB_DATE = '2026-08-31';
const AUTHOR = 'iShine Quality Team';
const CATEGORY = 'Buying Guide';

/** 源文件后缀 → locale 目录名
 *  .pt-pt → pt-PT（区域稿）；.pt → pt-BR（通用稿）
 *  .es → es（通用稿）；.es-es 为区域变体稿，目标语种目录无对应 locale，跳过 */
const LOCALES = {
  ar: 'ar',
  cs: 'cs',
  de: 'de',
  el: 'el',
  es: 'es',
  fa: 'fa',
  fr: 'fr',
  he: 'he',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  nl: 'nl',
  pl: 'pl',
  'pt-pt': 'pt-PT',
  pt: 'pt-BR',
  ro: 'ro',
  ru: 'ru',
  th: 'th',
  tr: 'tr',
  vi: 'vi',
};

const yamlStr = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** 拆分 markdown 表格行 → 单元格数组 */
function cells(line) {
  return line
    .replace(/^\|\s*/, '')
    .replace(/\s*\|\s*$/, '')
    .split(/\s*\|\s*/);
}

/** 解析单份源稿 */
function parseSource(src) {
  const lines = src.split(/\r?\n/);

  let sep = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      sep = i;
      break;
    }
  }
  if (sep < 0) throw new Error('找不到 "---" 分隔线');

  const notes = lines.slice(0, sep);
  const body = lines.slice(sep + 1);
  while (body.length && body[0].trim() === '') body.shift();

  const rows = notes.filter((l) => l.startsWith('| '));
  if (rows.length < 5) throw new Error('Publishing Metadata 表缺失');

  const titleLine = body.find((l) => /^#\s+\S/.test(l));
  if (!titleLine) throw new Error('正文 H1 缺失');

  const title = titleLine.replace(/^#\s+/, '').trim();
  const primary = cells(rows[1])[1].trim();
  const secondary = cells(rows[2])[1]
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const description = cells(rows[4])[1].trim();
  if (description.length < 60) throw new Error(`description 异常（${description.length} 字符）`);

  // 文末 FAQ 段：某个 ## 标题的下一非空行是纯粗体行（**问题**）
  let faqStart = -1;
  let faqEnd = body.length;
  for (let i = 0; i < body.length; i++) {
    if (!/^##\s+/.test(body[i])) continue;
    let j = i + 1;
    while (j < body.length && body[j].trim() === '') j++;
    if (j < body.length && /^\*\*.+\*\*$/.test(body[j].trim())) {
      faqStart = i;
      break;
    }
  }
  const faqs = [];
  if (faqStart >= 0) {
    for (let k = faqStart + 1; k < body.length; k++) {
      if (/^##\s+/.test(body[k])) {
        faqEnd = k;
        break;
      }
    }
    let cur = null;
    for (const raw of body.slice(faqStart + 1, faqEnd)) {
      const t = raw.trim();
      const m = t.match(/^\*\*(.+)\*\*$/);
      if (m) {
        if (cur) faqs.push(cur);
        cur = { question: m[1].trim(), parts: [] };
      } else if (cur && t) {
        cur.parts.push(t);
      }
    }
    if (cur) faqs.push(cur);
    faqs.forEach((f) => {
      f.answer = f.parts.join(' ').replace(/\s+/g, ' ').trim();
      delete f.parts;
    });
  }

  const cleanBody =
    faqStart >= 0
      ? [...body.slice(0, faqStart), ...body.slice(faqEnd)]
      : body;

  return { title, description, primary, secondary, faqs, body: cleanBody };
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
    `primary_keyword: ${yamlStr(parsed.primary)}`,
    'secondary_keywords:',
    ...parsed.secondary.map((k) => `  - ${yamlStr(k)}`),
    `url: https://iplmanufacturer.com/blog/${SLUG}`,
  ];
  if (parsed.faqs.length) {
    head.push('faqs:');
    for (const f of parsed.faqs) {
      head.push(`  - question: ${yamlStr(f.question)}`);
      head.push(`    answer: ${yamlStr(f.answer)}`);
    }
  }
  head.push('---', '');

  const bodyText = parsed.body.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  return head.join('\n') + '\n' + bodyText + '\n';
}

// ---------------------------------------------------------------- verify

function verifyAll() {
  const problems = [];
  const links = new Map();
  let checked = 0;
  for (const [suffix, locale] of Object.entries(LOCALES)) {
    const f = join(BLOG_DIR, locale, `${SLUG}.mdx`);
    if (!existsSync(f)) {
      problems.push(`${locale}: 文件缺失`);
      continue;
    }
    checked++;
    const src = readFileSync(f, 'utf8');
    const required = [
      `slug: "${SLUG}"`,
      `translationKey: "${TRANSLATION_KEY}"`,
      `heroImage: "${HERO}"`,
      'category: "Buying Guide"',
      `url: https://iplmanufacturer.com/blog/${SLUG}`,
      'pubDate: "2026-08-31"',
      'faqs:',
      'primary_keyword:',
      'secondary_keywords:',
    ];
    for (const r of required) {
      if (!src.includes(r)) problems.push(`${locale}: 缺少 ${r}`);
    }
    const faqCount = (src.match(/^  - question:/gm) || []).length;
    if (faqCount !== 5) problems.push(`${locale}: faqs 条目 ${faqCount} 条（应为 5）`);
    const body = src.split(/^---$/m).slice(2).join('---');
    if (/^##\s+/m.test(body) && /^\*\*.+\*\*$/m.test(body.split(/^##\s+/m).pop() || '')) {
      problems.push(`${locale}: 正文仍残留 FAQ 粗体问答`);
    }
    for (const m of src.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      links.set(m[1], (links.get(m[1]) || 0) + 1);
    }
    for (const m of src.matchAll(/\]\((\/(?:ar|cs|de|el|es|fa|fr|he|id|it|ja|ko|nl|pl|pt-BR|pt-PT|ro|ru|th|tr|vi)\/)/g)) {
      problems.push(`${locale}: 存在 locale 前缀内链 ${m[1]}`);
    }
  }
  console.log(`files checked: ${checked}`);
  console.log(`problems: ${problems.length ? '' : 'none'}`);
  problems.forEach((p) => console.log(`  ! ${p}`));
  console.log(`internal links: ${links.size ? [...links].map(([k, v]) => `${k} x${v}`).join(', ') : 'none'}`);
  return problems.length;
}

// ---------------------------------------------------------------- main

if (VERIFY) {
  process.exit(verifyAll() ? 1 : 0);
}

const skipped = ['.es-es'];
let written = 0;
for (const [suffix, locale] of Object.entries(LOCALES)) {
  const srcFile = join(SRC_DIR, `${SLUG}.${suffix}.md`);
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
    console.log(`--- ${suffix} -> ${locale}`);
    console.log(`    title: ${parsed.title}`);
    console.log(`    desc : ${parsed.description}`);
    console.log(`    kw   : ${parsed.primary} | ${parsed.secondary.length} secondary`);
    console.log(`    faqs : ${parsed.faqs.length}`);
    console.log(`    body : ${parsed.body.length} 行`);
    if (parsed.faqs[0]) console.log(`    q1   : ${parsed.faqs[0].question}`);
    continue;
  }
  const outFile = join(BLOG_DIR, locale, `${SLUG}.mdx`);
  writeFileSync(outFile, buildMdx(parsed), 'utf8');
  console.log(`WRITTEN  ${outFile}`);
  written++;
}

if (!DRY) {
  console.log(`\nlocales: ${Object.keys(LOCALES).length}  written: ${written}  skipped: ${skipped.join(', ')}`);
  console.log(`heroImage 存在: ${existsSync(join('public', HERO.replace(/^\//, '')))}`);
}
