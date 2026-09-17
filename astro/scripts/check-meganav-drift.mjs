#!/usr/bin/env node
/**
 * 导航防漂移守卫
 *
 * 背景：全站 header 的导航标记被复制到了 7 个文件里（SiteHeader + 首页 + 4 个 services 页 + 团队页），
 * 而且它们已经漂移过：服务大链接顺序不同、快捷链接的 CSS 类不同、About 菜单条目集合不同、
 * Resources 卡片配图有无不同、团队页用的是另一套 i18n 键。这类漂移不会报错，只会让不同页面的导航
 * 长得不一样 —— 之前是靠人肉比对才发现的。
 *
 * 本守卫把 7 份导航的「指纹」记录下来（忽略空白），任何一份发生非预期变化就让构建失败，
 * 并指出变了什么（键集合增减、体量变化）。若改动是有意的，跑 `--update` 重新记录即可。
 *
 * 用法：
 *   node scripts/check-meganav-drift.mjs            校验（构建链里跑）
 *   node scripts/check-meganav-drift.mjs --update   重新记录基线（有意改动导航后）
 *   node scripts/check-meganav-drift.mjs --verbose  打印每份导航的指纹
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '..', 'src');
const BASELINE = path.join(HERE, 'meganav-baseline.json');

const UPDATE = process.argv.includes('--update');
const VERBOSE = process.argv.includes('--verbose');

const FILES = [
  'components/SiteHeader.astro',
  'pages/index.astro',
  'pages/meet-the-team.astro',
  'pages/services/private-label.astro',
  'pages/services/build-a-new-ipl.astro',
  'pages/services/find-a-technology-partner.astro',
  'pages/services/maintain-or-fix-ipl-project.astro',
];

/** 取出 <nav class="header-nav desktop-nav"> … </nav> */
function navBlock(src) {
  const m = /<nav\b[^>]*class="[^"]*header-nav[^"]*"[^>]*>/.exec(src);
  if (!m) return null;
  let depth = 0;
  const re = /<nav\b|<\/nav>/g;
  re.lastIndex = m.index;
  let mm;
  while ((mm = re.exec(src))) {
    if (mm[0] === '</nav>') { depth--; if (depth === 0) return src.slice(m.index, re.lastIndex); }
    else depth++;
  }
  return null;
}

/** 指纹：保留 i18n 键与 href，压掉空白 —— 只看结构与键，不看缩进 */
function fingerprint(block) {
  const norm = block.replace(/\s+/g, ' ').trim();
  return {
    md5: crypto.createHash('md5').update(norm).digest('hex').slice(0, 16),
    bytes: Buffer.byteLength(block),
    lines: block.split('\n').length,
    keys: [...new Set([...block.matchAll(/t\(locale,\s*'([^']+)'\)/g)].map((m) => m[1]))].sort(),
    hrefs: [...new Set([...block.matchAll(/(?:href|loc)\(\s*"([^"]+)"/g)].map((m) => m[1]))].sort(),
  };
}

const current = {};
for (const rel of FILES) {
  const p = path.join(SRC, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(p)) { console.error(`[meganav-guard] 找不到文件：${rel}`); process.exit(1); }
  const block = navBlock(fs.readFileSync(p, 'utf8'));
  if (!block) { console.error(`[meganav-guard] ${rel} 里找不到 <nav class="header-nav desktop-nav"> 块`); process.exit(1); }
  current[rel] = fingerprint(block);
}

if (UPDATE || !fs.existsSync(BASELINE)) {
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n', 'utf8');
  console.log(`[meganav-guard] 已记录 ${Object.keys(current).length} 份导航的指纹 → scripts/meganav-baseline.json`);
  process.exit(0);
}

const saved = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const problems = [];
const added = Object.keys(current).filter((k) => !saved[k]);
const removed = Object.keys(saved).filter((k) => !current[k]);
if (added.length) problems.push(`新增了带导航的文件（未在基线里）：${added.join(', ')}`);
if (removed.length) problems.push(`基线里的文件消失了：${removed.join(', ')}`);

for (const rel of Object.keys(current)) {
  const a = saved[rel], b = current[rel];
  if (!a) continue;
  if (a.md5 === b.md5) { if (VERBOSE) console.log(`  ✓ ${rel}  ${b.bytes} B / ${b.keys.length} 键`); continue; }
  const detail = [];
  if (a.bytes !== b.bytes) detail.push(`体量 ${a.bytes} → ${b.bytes} B`);
  const gained = b.keys.filter((k) => !a.keys.includes(k));
  const lost = a.keys.filter((k) => !b.keys.includes(k));
  if (gained.length) detail.push(`新增键 ${gained.slice(0, 5).join(', ')}${gained.length > 5 ? ` 等 ${gained.length} 个` : ''}`);
  if (lost.length) detail.push(`删除键 ${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ` 等 ${lost.length} 个` : ''}`);
  const gh = b.hrefs.filter((h) => !a.hrefs.includes(h));
  const lh = a.hrefs.filter((h) => !b.hrefs.includes(h));
  if (gh.length) detail.push(`新增链接 ${gh.slice(0, 4).join(', ')}${gh.length > 4 ? ` 等 ${gh.length} 个` : ''}`);
  if (lh.length) detail.push(`删除链接 ${lh.slice(0, 4).join(', ')}${lh.length > 4 ? ` 等 ${lh.length} 个` : ''}`);
  problems.push(`${rel}：${detail.join('；') || '结构与键都相同但字节不同（可能只是顺序或属性变化）'}`);
}

if (problems.length) {
  console.error('[meganav-guard] ✗ 导航标记与基线不一致：');
  for (const p of problems) console.error('  · ' + p);
  console.error('\n  这 7 份导航是复制关系，改动一份通常要同步其余几份。');
  console.error('  若改动是有意的，请确认已同步全部相关文件，然后重新记录基线：');
  console.error('    node scripts/check-meganav-drift.mjs --update');
  process.exit(1);
}

console.log(`[meganav-guard] ✓ ${Object.keys(current).length} 份导航标记与基线一致（未发生非预期漂移）`);
