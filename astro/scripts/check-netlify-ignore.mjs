#!/usr/bin/env node
/**
 * check-netlify-ignore.mjs — 防回归：ignore 命令必须在任意 cwd 下给出同样的判断
 *
 * 背景（2026-10-21）：`ignore` 是在 **base 目录**（astro/）里执行的，但命令里的 pathspec
 * 是按仓库根写的。结果从 astro/ 看过去 `astro` / `netlify.toml` 都不存在，只有
 * `messages` 侥幸命中 astro/messages —— 于是只有改语言包时才会构建，改 astro/src、
 * astro/public 的提交被静默跳过（部署记录显示 Canceled build due to no content change）。
 *
 * 本检查取"最近一次改动 astro/ 的提交"作为区间，分别在仓库根与 astro/ 下执行
 * netlify.toml 里解析出来的 ignore 命令，断言两边都返回 exit 1（= 需要构建）。
 * 老写法在 astro/ 下会返回 0，从而在这里失败。
 *
 * 用法：npm run check:netlify-ignore     （CI 里需要完整历史：fetch-depth: 0）
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASTRO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = resolve(ASTRO, '..');

function git(args, cwd = ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** 从 netlify.toml 取出 ignore 的字符串值（基础字符串，处理 \" 转义） */
function readIgnoreCommand() {
  const toml = readFileSync(resolve(ROOT, 'netlify.toml'), 'utf8');
  const m = toml.match(/^\s*ignore\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/m);
  if (!m) throw new Error('netlify.toml has no ignore = "..." line');
  return m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function runIgnored(command, cwd, cached, commit) {
  try {
    execFileSync('bash', ['-c', command], {
      cwd,
      env: { ...process.env, CACHED_COMMIT_REF: cached, COMMIT_REF: commit },
      stdio: 'ignore',
    });
    return 0; // 0 = 无变化 → 跳过构建
  } catch (err) {
    return typeof err.status === 'number' ? err.status : 1;
  }
}

const command = readIgnoreCommand();
// 探针：最近一次只改动 astro/src、且没有同时动 astro/messages 的提交。
// 用 astro/ 整体会让"搬家 messages"那类提交命中，反而测不出旧 pathspec 的问题；
// 也不用 pathspec 魔法（Windows 上 :(exclude) 的表现不稳），直接看 name-only 列表。
function pickProbe() {
  const candidates = git(['log', '-n', '40', '--format=%H', '--', 'astro/src']).split('\n').filter(Boolean);
  for (const sha of candidates) {
    const files = git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
    if (files.some((f) => f.startsWith('astro/messages/'))) continue; // 跳过高噪音的搬家提交
    if (files.some((f) => f.startsWith('astro/src/'))) return sha;
  }
  return '';
}

const lastAstroCommit = pickProbe();
if (!lastAstroCommit) {
  console.log('check-netlify-ignore: 找不到合适的探针提交，跳过');
  process.exit(0);
}
const parent = git(['rev-parse', `${lastAstroCommit}^`]);

console.log(`ignore: ${command}`);
console.log(`区间: ${parent.slice(0, 7)}..${lastAstroCommit.slice(0, 7)} (最近一次只动 astro/src 的提交)`);

const fromRoot = runIgnored(command, ROOT, parent, lastAstroCommit);
const fromBase = runIgnored(command, ASTRO, parent, lastAstroCommit);

console.log(`  从仓库根执行 : exit ${fromRoot}   ${fromRoot === 1 ? 'OK (构建)' : 'FAIL (应为 1)'}`);
console.log(`  从 astro/ 执行: exit ${fromBase}   ${fromBase === 1 ? 'OK (构建)' : 'FAIL (应为 1)'}`);

if (fromRoot === 1 && fromBase === 1) {
  console.log('check-netlify-ignore: 通过 —— ignore 与 cwd 无关');
  process.exit(0);
}
console.error('check-netlify-ignore: 失败 —— 改 astro/ 的提交在某个 cwd 下被判定为"无内容变化"，会在 Netlify 上被静默跳过');
process.exit(1);
