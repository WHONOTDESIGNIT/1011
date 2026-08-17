// 方案B 构建后转换脚本：foo/index.html → foo.html（等效 build.format: 'file' 产物）
// 在 astro/ 目录运行（由 Netlify 构建命令调用）。
//
// 背景：Astro 5.18.1 的 i18n fallback 首页（/tr 等 16 个语言首页）在 build.format: 'file'
// 下无法生成（已知 bug：i18n fallback rewrite 空 body，仅 Astro 6.2+ 修复）。
// 因此保持 directory 构建（fallback 正常），构建后将所有页面目录的 index.html 移动为
// 同目录名的 .html 文件（about/index.html → about.html）。Netlify 对 .html 文件的原生
// 尾斜杠行为为：/about 直接服务、/about/ 301 → /about（Panasonic 风格，无结尾斜杠）。
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

// 递归删除空目录（从深到浅）
function removeEmptyDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const full = path.join(dir, entry.name);
      removeEmptyDirs(full);
      try {
        if (fs.readdirSync(full).length === 0) {
          fs.rmdirSync(full);
          console.log(`  🧹 删除空目录: ${path.relative(DIST, full)}`);
        }
      } catch {
        /* 目录可能已被清理 */
      }
    }
  }
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

removeEmptyDirs(DIST);

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
