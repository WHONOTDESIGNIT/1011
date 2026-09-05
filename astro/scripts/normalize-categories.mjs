// 一次性归一博客 frontmatter `category`：历史变体 → BLOG_CATEGORIES 规范词。
// 默认 dry-run（只统计不写文件）；加 --apply 才真正改写。
// 只读脚本 + 有损替换边界：仅当某行匹配 `category:` 且其值命中 MAPPING 或非规范值时改写。
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const blogRoot = path.resolve(process.cwd(), 'src/content/blog');

const CANONICAL = [
  'Safety', 'Technology', 'Market', 'Marketing', 'Manufacturing', 'Regulatory', 'Education',
  'Buying Guide', 'OEM/ODM', 'Science', 'Sustainability', 'Business', 'Research', 'Innovation',
  'Components', 'Sourcing', 'B2B', 'Industry Insights', 'Brand Building',
];
const VALID = new Set(CANONICAL);

// 历史变体 → 规范词（大小写/同义别名）
const MAPPING = {
  SAFETY: 'Safety',
  TECHNOLOGY: 'Technology',
  MARKET: 'Market',
  'Regulation & Compliance': 'Regulatory',
  GUIDE: 'Education',
  EDUCATION: 'Education',
  SOURCING: 'Sourcing',
};

function collectMdx(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMdx(full));
    else if (entry.isFile() && entry.name.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const CATEGORY_LINE = /^(\s*category\s*:\s*["']?)([^"'\n]+?)(["']?)\s*$/m;

function main() {
  const files = collectMdx(blogRoot);
  const counts = new Map(); // 原值 → { count, localeSet }
  const perLocale = new Map();
  let changedFiles = 0;

  for (const file of files) {
    const rel = path.relative(blogRoot, file).split(path.sep);
    const locale = rel[0];
    const src = fs.readFileSync(file, 'utf8');
    const m = CATEGORY_LINE.exec(src);
    if (!m) {
      console.error(`!! 未找到 category 行: ${path.relative(blogRoot, file)}`);
      continue;
    }
    const raw = m[2].trim();
    if (!perLocale.has(locale)) perLocale.set(locale, new Map());
    const lc = perLocale.get(locale);
    lc.set(raw, (lc.get(raw) || 0) + 1);
    const rec = counts.get(raw) || { count: 0, files: [] };
    rec.count += 1;
    rec.files.push(path.relative(blogRoot, file));
    counts.set(raw, rec);
  }

  // 汇总：规范 / 待映射 / 未知
  const unchanged = new Map(), toMap = new Map(), unknown = new Map();
  for (const [raw, rec] of counts) {
    if (MAPPING[raw]) toMap.set(raw, rec);
    else if (VALID.has(raw)) unchanged.set(raw, rec);
    else unknown.set(raw, rec);
  }

  console.log(`\n扫描 ${files.length} 个 mdx（${perLocale.size} 个语言目录）`);
  console.log(`\n== 规范值（保持不变）==`);
  for (const [raw, rec] of [...unchanged].sort((a, b) => b[1].count - a[1].count))
    console.log(`  ${String(rec.count).padStart(4)}  ${raw}`);

  console.log(`\n== 将归一（变体 → 规范）==`);
  for (const [raw, rec] of [...toMap].sort((a, b) => b[1].count - a[1].count))
    console.log(`  ${String(rec.count).padStart(4)}  ${raw}  ->  ${MAPPING[raw]}`);

  if (unknown.size) {
    console.log(`\n!! 未知值（不在规范也不在映射，需补充映射）==`);
    for (const [raw, rec] of unknown) {
      console.log(`  ${String(rec.count).padStart(4)}  ${JSON.stringify(raw)}  e.g. ${rec.files.slice(0, 3).join(', ')}`);
    }
    if (!APPLY) { console.log('\n未执行改写（存在未知值，先补 MAPPING）。'); return; }
  }

  const mappedTotal = [...toMap.values()].reduce((s, r) => s + r.count, 0);
  console.log(`\n合计将改写 ${mappedTotal} 处 / ${files.length} 篇`);

  if (!APPLY) {
    console.log('\n[dry-run] 未写入任何文件。加 --apply 执行改写。');
    return;
  }

  // 执行改写
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const next = src.replace(CATEGORY_LINE, (line, pre, val, post) => {
      const target = MAPPING[val.trim()];
      return target ? `${pre}${target}${post}` : line;
    });
    if (next !== src) {
      fs.writeFileSync(file, next);
      changedFiles++;
    }
  }
  console.log(`已改写 ${changedFiles} 个文件。`);
}

main();
