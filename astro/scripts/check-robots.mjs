#!/usr/bin/env node
/**
 * check-robots.mjs — AI 爬虫授权守护脚本（长效监控规则）
 *
 * 每次构建/部署时执行，校验生产 robots.txt 中以下「受保护」AI 爬虫必须保持 Allow: /：
 *   - GPTBot        （OpenAI / ChatGPT）
 *   - ClaudeBot     （Anthropic / Claude）
 *   - PerplexityBot （Perplexity）
 *
 * 一旦发现任一受保护爬虫被误删授权段、或被 Disallow: / 全局拦截，
 * 脚本以非零退出码终止构建，从而阻止误操作上线（fail-safe 防护）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROBOTS_PATH = join(ROOT, 'public', 'robots.txt');

const PROTECTED = [
  { name: 'GPTBot', label: 'OpenAI / ChatGPT' },
  { name: 'ClaudeBot', label: 'Anthropic / Claude' },
  { name: 'PerplexityBot', label: 'Perplexity' },
];

/**
 * 解析 robots.txt 的 User-agent 分组。
 * 返回 Map<userAgent, { allow: string[], disallow: string[] }>
 */
function parseRobots(text) {
  const groups = new Map();
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const ua = line.match(/^User-agent:\s*(.+)$/i);
    if (ua) {
      const key = ua[1].trim().toLowerCase();
      current = { allow: [], disallow: [] };
      groups.set(key, current);
      continue;
    }
    const allow = line.match(/^Allow:\s*(.+)$/i);
    if (allow && current) {
      current.allow.push(allow[1].trim());
      continue;
    }
    const disallow = line.match(/^Disallow:\s*(.+)$/i);
    if (disallow && current) {
      current.disallow.push(disallow[1].trim());
    }
  }
  return groups;
}

/** 判断某 UA 分组是否被全局拦截（Disallow: / 且无 Allow: / 覆盖） */
function isGloballyBlocked(group) {
  if (!group) return true; // 无授权段视为不安全（宁缺毋滥，阻止上线提醒人工确认）
  const blocksRoot = group.disallow.includes('/');
  const allowsRoot = group.allow.includes('/');
  return blocksRoot && !allowsRoot;
}

let robots;
try {
  robots = readFileSync(ROBOTS_PATH, 'utf8');
} catch {
  console.error(`[robots-guard] 无法读取 robots.txt：${ROBOTS_PATH}`);
  process.exit(1);
}

const groups = parseRobots(robots);
let failed = false;

console.log('[robots-guard] 校验受保护 AI 爬虫授权...');
for (const { name, label } of PROTECTED) {
  const group = groups.get(name.toLowerCase());
  const blocked = isGloballyBlocked(group);
  const hasAllow = group && group.allow.includes('/');
  if (blocked || !group || !hasAllow) {
    failed = true;
    console.error(`  ✗ ${name} (${label})：授权缺失或存在 Disallow: /，构建已中止！`);
  } else {
    console.log(`  ✓ ${name} (${label})：Allow: / 授权正常`);
  }
}

if (failed) {
  console.error('[robots-guard] 检测到受保护 AI 爬虫被误拦截，请在 public/robots.txt 中恢复其 Allow: / 授权后重新构建。');
  process.exit(1);
}
console.log('[robots-guard] 全部受保护 AI 爬虫授权正常，构建继续。');
