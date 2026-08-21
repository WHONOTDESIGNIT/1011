// 方案B 构建后转换脚本：foo/index.html → foo.html（等效 build.format: 'file' 产物）
// 在 astro/ 目录运行（由构建链调用）。
//
// 背景：Astro 5.18.1 的 i18n fallback 首页（/tr 等 16 个语言首页）在 build.format: 'file'
// 下无法生成（已知 bug：i18n fallback rewrite 空 body，仅 Astro 6.2+ 修复）。
// 因此保持 directory 构建（fallback 正常），构建后将所有页面目录的 index.html 移动为
// 同目录名的 .html 文件（about/index.html → about.html）。
//
// 重要：Netlify 不会自动把 /about 映射到 about.html（精确匹配静态文件 about，无则匹配
// about/index.html，再无则走 redirects）。因此本脚本转换的同时生成 dist/_redirects。
//
// 精简通配符方案（替代逐页 5276 条规则，避免 396KB 大文件与 Netlify 10k 规则红线）：
//   1. /*/ /:splat 301                 —— 全站尾斜杠统一 301 到无斜杠（单条覆盖所有尾斜杠 URL）
//   2. /name /name.html 200            —— 顶层单段页面精确规则（/about、/pt-BR、/blog 等）
//   3. /dir/:splat /dir/:splat.html 200—— 顶层页面目录通配规则；:splat 匹配任意深度子路径
//      （/blog/:splat → /blog/a/b.html）。白名单方式（仅对真实页面目录生成）确保
//      _astro/fonts/images/videos 等静态资源与 /.netlify/functions/* 不被误伤。
// 未匹配路径（如 /zzz-does-not-exist-12345.txt）不命中任何规则，落入 _redirects 末尾的
// `/* /404.html 404` 兜底返回真 404（软 404 修复的根本保障）。兜底原本定义于
// netlify.toml [[redirects]]，但线上实测该段未生效（平台对未命中规则的路径返回
// text/plain 301 自指循环而非 404），故移入 _redirects 确保生效（_redirects 优先级最高）。
// Netlify 对 rewrite 目标文件查找失败返回 404（"when all of these fail, we end up
// serving a 404 page"）。
// _redirects 优先级高于 netlify.toml。
//
// 保留不动：根 index.html（/ 路径，无尾斜杠标准形式）、404.html、500.html、
// index.backup.html、.netlify/（SSR 函数）、资源目录（_astro/fonts/images/videos）。
// 已校验：Astro 生成 HTML 的 href/src 全部为绝对路径（/xxx），移动文件不影响页面内链接。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

const ROOT_INDEX = path.join(DIST, 'index.html');
const EXCLUDED_DIRS = new Set(['.netlify', '_astro', 'fonts', 'images', 'videos', '__forms']);

// 收集所有目录型页面产物 foo/index.html（递归，排除根 index.html）
function collectIndexHtmls(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectIndexHtmls(full));
    } else if (entry.name === 'index.html' && full !== ROOT_INDEX) {
      result.push(full);
    }
  }
  return result;
}

// 递归删除空目录（从深到浅），返回删除数量
function removeEmptyDirs(dir) {
  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const full = path.join(dir, entry.name);
      removed += removeEmptyDirs(full);
      try {
        if (fs.readdirSync(full).length === 0) {
          fs.rmdirSync(full);
          removed++;
        }
      } catch {
        /* 目录可能已被清理 */
      }
    }
  }
  return removed;
}

console.log('===== 方案B 构建后转换：index.html → .html =====');

const indexFiles = collectIndexHtmls(DIST);
// 深目录优先，保证 foo/bar/index.html 先于 foo/index.html 处理
indexFiles.sort((a, b) => b.length - a.length);

let moved = 0;
let skipped = 0;
for (const file of indexFiles) {
  const dir = path.dirname(file);
  const dirName = path.basename(dir); // 页面目录名（如 about、pt-BR）
  const target = path.join(path.dirname(dir), `${dirName}.html`);
  if (fs.existsSync(target)) {
    skipped++;
    console.log(`  ⚠ 冲突跳过: ${path.relative(DIST, file)}（${path.relative(DIST, target)} 已存在）`);
    continue;
  }
  fs.renameSync(file, target);
  moved++;
  console.log(`  → ${path.relative(DIST, target)}`);
}

const removedDirs = removeEmptyDirs(DIST);
if (removedDirs > 0) {
  console.log(`  🧹 已清理 ${removedDirs} 个空目录`);
}

// 基于 dist 实际产物生成精简 _redirects（白名单通配符方案，取代逐页 5276 条规则）
function buildRedirects(dist) {
  const rules = ['/*/ /:splat 301']; // 尾斜杠统一 301 → 无斜杠（单条覆盖全站尾斜杠 URL）
  const pageDirs = [];
  const topPages = [];
  for (const entry of fs.readdirSync(dist, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue; // 白名单排除静态资源/函数目录
    if (entry.isDirectory()) {
      pageDirs.push(entry.name);
    } else if (
      entry.name.endsWith('.html') &&
      !['404.html', 'index.html', 'index.backup.html'].includes(entry.name)
    ) {
      topPages.push(entry.name);
    }
  }
  // 精确规则在前（更具体优先），目录通配在后
  for (const f of topPages.sort()) {
    const name = f.slice(0, -5);
    rules.push(`/${name} /${name}.html 200`);
  }
  for (const dir of pageDirs.sort()) {
    rules.push(`/${dir}/:splat /${dir}/:splat.html 200`);
  }
  // 兼容旧链接：/en/* 301 到无前缀版本。原定义于 netlify.toml，但线上实测
  // netlify.toml 的 [[redirects]] 未生效（/en/foo 未 301 到 /foo），
  // 且平台对未命中规则的路径返回 text/plain 301 自指循环而非 404。
  // 因此将 /en/* 与 404 兜底一并写入 _redirects（文件优先级最高、必然生效）。
  rules.push('/en/* /:splat 301!');
  // 兜底 404（软 404 修复根本保障）：未命中任何规则/静态文件的路径返回真 404。
  // 末尾追加 !（force）确保强制生效，防止 Netlify shadowing（from 路径命中现有静态
  // 文件时规则被忽略）；规则置于文件末尾（更具体规则在上，宽泛兜底在下）。
  rules.push('/* /404.html 404!');
  return rules;
}

// 生成 _redirects（方案B 必须：Netlify 不自动将 /about 映射到 about.html，需显式 rewrite）
const rules = buildRedirects(DIST);
if (rules.length > 0) {
  const redirectsFile = path.join(DIST, '_redirects');
  fs.writeFileSync(redirectsFile, rules.join('\n') + '\n');
  console.log(`📄 已生成 _redirects（${rules.length} 条规则，通配符压缩方案）`);
}

console.log(`\n转换完成：移动 ${moved} 个页面产物${skipped ? `，跳过冲突 ${skipped} 个` : ''}`);

// 兜底校验：禁止根目录外残留 index.html（若存在说明转换遗漏）
const remaining = collectIndexHtmls(DIST);
if (remaining.length > 0) {
  console.error(`❌ 仍有 ${remaining.length} 个 index.html 未转换：`);
  remaining.forEach((f) => console.error(`  ${path.relative(DIST, f)}`));
  process.exit(1);
}
if (moved === 0 && skipped === 0) {
  console.error('❌ 未发现任何可转换的页面产物（dist 是否为空/异常？）');
  process.exit(1);
}
console.log('✅ 全部页面产物为 .html 格式');
