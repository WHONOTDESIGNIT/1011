#!/usr/bin/env node
/**
 * check-site-urls.mjs — site-urls.txt 规范守卫
 *
 * 背景：全站 URL 规范是 trailingSlash:'never'（由 astro.config.mjs + flatten-html.mjs 保证），
 * 但 site-urls.txt 是构建生成、随提交进仓库的清单，过去没有守卫 —— 一旦生成逻辑变动或人工编辑，
 * 就可能混入带尾斜杠 / 大写语种段 / /en/ 前缀的 URL，而这份清单是给外部（抓取与索引）看的。
 *
 * 校验四条：
 *   1. 子路径不得以 / 结尾（裸域名 "/" 除外）
 *   2. 语种段必须小写（pt-BR → pt-br、pt-PT → pt-pt）
 *   3. 不得含 /en/ 前缀（英文服务在根路径，/en/ 会 100% 404）
 *   4. 必须是绝对 https URL，且不得重复
 *
 * 用法：node scripts/check-site-urls.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ⚠️ 关键：site-urls.txt 在【仓库根目录】，而 npm script 的 cwd 是 astro/，
// 且脚本可能从任意 cwd 被调用 —— 因此按脚本自身位置解析，而不是用相对路径。
const HERE = dirname(fileURLToPath(import.meta.url));       // astro/scripts
const FILE = join(HERE, '..', '..', 'site-urls.txt');       // 仓库根/site-urls.txt

let raw;
try {
  raw = readFileSync(FILE, 'utf8');
} catch {
  console.error(`[site-urls] 无法读取 ${FILE}`);
  process.exit(1);
}

const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
const seen = new Map();
const issues = [];

for (const url of lines) {
  let u;
  try {
    u = new URL(url);
  } catch {
    issues.push(`非绝对 URL：${url}`);
    continue;
  }
  if (u.protocol !== 'https:') issues.push(`非 https：${url}`);
  if (u.pathname !== '/' && u.pathname.endsWith('/')) issues.push(`尾斜杠：${url}`);
  if (u.pathname.startsWith('/en/')) issues.push(`含 /en/ 前缀（英文在根路径）：${url}`);
  for (const seg of u.pathname.split('/')) {
    if (/^[a-z]{2}-[A-Z]{2}$/.test(seg)) issues.push(`大写语种段 ${seg}：${url}`);
  }
  if (seen.has(url)) {
    issues.push(`重复 URL（首次见第 ${seen.get(url)} 行）：${url}`);
  } else {
    seen.set(url, lines.indexOf(url) + 1);
  }
}

if (issues.length) {
  console.error(`[site-urls] ✗ ${issues.length} 处不合规：`);
  for (const i of issues.slice(0, 20)) console.error(`   ${i}`);
  if (issues.length > 20) console.error(`   … 另有 ${issues.length - 20} 处`);
  process.exit(1);
}
console.log(`[site-urls] ✓ ${lines.length} 条 URL 全部合规（无尾斜杠 / 无大写语种段 / 无 /en/ 前缀 / 无重复）`);
