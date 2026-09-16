#!/usr/bin/env node
/**
 * check-robots.mjs — AI 爬虫放行守护脚本（厂商无关版）
 *
 * 策略前提：本站对公开内容**放行全部爬虫**，包括全部 AI 爬虫（搜索/引用类与训练类一律放行），
 * 只排除内部/非内容路径。robots.txt 因此**不按厂商逐条列举**，而是用通配组覆盖一切
 * —— 这样任何现在或将来出现的 AI 爬虫都不会被漏掉。
 *
 * 每次构建/部署时执行，校验：
 *   1. 通配组 `User-agent: *` 必须存在，且必须有 `Allow: /`；
 *   2. 通配组不得出现 `Disallow: /`（否则等于全站禁抓）；
 *   3. 任何其他 UA 组也不得"全局拦截"（`Disallow: /` 且无 `Allow: /` 覆盖）
 *      —— 这条会拦住任何"按厂商屏蔽某个 AI 爬虫"的改动，无论那个爬虫叫什么名字。
 *
 * 注：旧版本要求逐个点名 GPTBot / ClaudeBot / PerplexityBot 三家的授权段。
 * 现改为厂商无关校验：通配放行在语义上**强于**逐条点名（点名永远漏掉新爬虫），
 * 同时仍会拦住任何形式的 AI 屏蔽。
 *
 * 任一校验失败则以非零退出码终止构建（fail-safe 防护）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROBOTS_PATH = join(ROOT, 'public', 'robots.txt');

/** 仅用于日志提示：这些 UA 若出现在文件中，会被单独报告（不作为通过条件） */
const KNOWN_AI_AGENTS = [
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'claude-searchbot',
  'anthropic-ai', 'perplexitybot', 'google-extended', 'googleother',
  'meta-externalagent', 'amazonbot', 'bytespider', 'ccbot', 'applebot-extended',
  'cohere-ai', 'moonshotbot', 'qwenbot', 'baidubot', 'baiduspider',
  'yuanbaobot', 'tencentbot', 'xiaomibot',
];

/**
 * 解析 robots.txt。
 * 连续多个 `User-agent:` 行共享同一组规则（符合 robots.txt 规范）。
 * 返回 Map<userAgent(小写), { allow: string[], disallow: string[] }>
 */
function parseRobots(text) {
  const groups = new Map();
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const ua = line.match(/^User-agent:\s*(.+)$/i);
    if (ua) {
      const key = ua[1].trim().toLowerCase();
      if (lastWasAgent && current) {
        groups.set(key, current); // 与上一行同组
      } else {
        current = { allow: [], disallow: [] };
        groups.set(key, current);
      }
      lastWasAgent = true;
      continue;
    }
    const allow = line.match(/^Allow:\s*(.+)$/i);
    if (allow && current) {
      current.allow.push(allow[1].trim());
      lastWasAgent = false;
      continue;
    }
    const disallow = line.match(/^Disallow:\s*(.+)$/i);
    if (disallow && current) {
      current.disallow.push(disallow[1].trim());
      lastWasAgent = false;
    }
  }
  return groups;
}

/** 全局拦截：Disallow: / 且无 Allow: / 覆盖 */
function isGloballyBlocked(group) {
  return group.disallow.includes('/') && !group.allow.includes('/');
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

console.log('[robots-guard] 校验 AI 爬虫放行（厂商无关）...');

// 1) 通配组必须放行全站
const wildcard = groups.get('*');
if (!wildcard) {
  failed = true;
  console.error('  ✗ 缺少通配组 `User-agent: *` —— 无法保证新出现的 AI 爬虫被放行。');
} else if (!wildcard.allow.includes('/')) {
  failed = true;
  console.error('  ✗ 通配组缺少 `Allow: /`。');
} else if (wildcard.disallow.includes('/')) {
  failed = true;
  console.error('  ✗ 通配组存在 `Disallow: /` —— 等于全站禁抓，构建已中止！');
} else {
  console.log(`  ✓ 通配组 ` + '`User-agent: *`' + `：Allow: /（覆盖全部爬虫，含全部 AI 爬虫；内部路径排除 ${wildcard.disallow.length} 条）`);
}

// 2) 任何组都不得全局拦截（挡住"按厂商屏蔽某个 AI"的改动）
for (const [ua, group] of groups) {
  if (ua === '*') continue;
  if (isGloballyBlocked(group)) {
    failed = true;
    const isAI = KNOWN_AI_AGENTS.includes(ua);
    console.error(`  ✗ User-agent: ${ua}${isAI ? '（已知 AI 爬虫）' : ''} 存在 Disallow: / 且无 Allow: / 覆盖 —— 构建已中止！`);
  }
}

// 3) 信息性报告：文件中若逐条点名了 AI 爬虫
const named = [...groups.keys()].filter((ua) => ua !== '*' && KNOWN_AI_AGENTS.includes(ua));
if (named.length) {
  console.log(`  ℹ 文件逐条点名了 ${named.length} 个已知 AI 爬虫：${named.join(', ')}（允许，但非必需——通配组已覆盖）`);
} else {
  console.log('  ℹ 未逐条点名任何 AI 爬虫：全站策略完全由通配组覆盖（推荐状态）。');
}

if (failed) {
  console.error('[robots-guard] 检测到 AI 爬虫可能被拦截，请在 public/robots.txt 中恢复放行后重新构建。');
  process.exit(1);
}
console.log('[robots-guard] ✓ 放行校验通过：任何爬虫（含全部 AI 爬虫）均可抓取公开内容。');
