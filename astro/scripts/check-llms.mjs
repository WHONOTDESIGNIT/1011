#!/usr/bin/env node
/**
 * check-llms.mjs — llms.txt 链接健康守护脚本
 *
 * 每次构建/部署时执行，校验 public/llms.txt 中全部站内链接：
 *   1. 不得包含 /en/ 前缀（英文站以根路径提供服务，/en/ 会 100% 404，
 *      AI 爬虫跟随会浪费抓取预算并留下"站点损坏"印象）
 *   2. 落地 URL 一律无结尾斜杠（根路径 https://iplmanufacturer.com 除外，
 *      与全站 trailingSlash: 'never' 规范一致）
 *   3. 链接指向的路径必须存在于构建产物 dist/ 中（防新增死链回归）
 *
 * 任一校验失败则以非零退出码终止构建（fail-safe 防护）。
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LLMS_PATH = join(ROOT, 'public', 'llms.txt');
const DIST_PATH = join(ROOT, 'dist');

const SITE_ORIGIN = 'https://iplmanufacturer.com';
// 允许不校验文件存在的例外路径（如 sitemap.xml、robots.txt、根路径、图片等公共资源）
const ALWAYS_OK_PATHS = new Set(['', '/', '/sitemap.xml', '/robots.txt', '/favicon.ico', '/favicon.png']);

let llms;
try {
  llms = readFileSync(LLMS_PATH, 'utf8');
} catch {
  console.error(`[llms-check] 无法读取 llms.txt：${LLMS_PATH}`);
  process.exit(1);
}

const links = [...llms.matchAll(/https:\/\/iplmanufacturer\.com[^\s)]*[^\s).]/g)].map((m) => m[0]);
if (links.length === 0) {
  console.error('[llms-check] 未在 llms.txt 中找到任何站内链接，请检查文件内容。');
  process.exit(1);
}

let failed = false;
const seen = new Set();

for (const link of links) {
  const path = link.replace(SITE_ORIGIN, '');
  const key = path;

  // 1) /en/ 前缀检查
  if (path.startsWith('/en/')) {
    failed = true;
    console.error(`  ✗ 链接含 /en/ 前缀（应为根路径）：${link}`);
  }

  // 2) 结尾斜杠检查（根路径除外）
  if (path.length > 1 && path.endsWith('/')) {
    failed = true;
    console.error(`  ✗ 链接结尾带斜杠（落地 URL 一律无尾斜杠）：${link}`);
  }

  // 3) 构建产物存在性检查（仅首次遇到该路径时校验一次）
  if (!seen.has(key)) {
    seen.add(key);
    const rel = path.startsWith('/') ? path.slice(1) : path;
    if (!ALWAYS_OK_PATHS.has(path) && !existsSync(join(DIST_PATH, rel))) {
      // 兼容 .html 扁平化产物：/about → about.html 或 about/index.html
      const flat = join(DIST_PATH, `${rel}.html`);
      if (!existsSync(flat)) {
        failed = true;
        console.error(`  ✗ 链接指向构建产物中不存在的页面：${link}`);
      }
    }
  }
}

if (failed) {
  console.error(`[llms-check] 检测到 ${links.length} 条链接中存在错误，请在 public/llms.txt 中修复后重新构建。`);
  process.exit(1);
}
console.log(`[llms-check] ✓ llms.txt 全部 ${links.length} 条站内链接通过校验（无 /en/ 前缀、无尾斜杠、产物存在）。`);
