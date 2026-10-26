#!/usr/bin/env node
// 标题/描述长度守卫：只升不降的棘轮，不是硬红线。
//
// 为什么是棘轮：SERP 截断按像素算，不是按字符；CJK 一个字约等于两个拉丁字母的宽度。
// 存量里有一大批超标页（历史内容），一次性设硬红线等于把部署停住。所以：
//   · 数字由本脚本在同一次构建里量出来，写进 baseline.json，**不手填**
//   · 只允许下降；上升就失败（这才是"新内容不要加重存量问题"）
//   · 阈值按宽度算（CJK 记 2），lang 不同不再需要各自一套阈值
//
// 用法（在 astro/ 下）：
//   npm run check:meta-length            比对当前 dist，超标数上升则失败
//   npm run check:meta-length -- --update  把当前实测数写进 baseline.json

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const BASELINE = path.join(__dirname, 'baseline.json');

const TITLE_MIN = 50; // 宽度单位
const TITLE_MAX = 60;
const DESC_MAX = 160;

const UPDATE = process.argv.includes('--update');

/** 显示宽度：CJK / 全角算 2，其余算 1（近似像素截断） */
function width(s) {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const wide =
      (c >= 0x1100 && c <= 0x115f) || // Hangul Jamo
      (c >= 0x2e80 && c <= 0xa4cf) || // CJK radicals … Yi
      (c >= 0xac00 && c <= 0xd7a3) || // Hangul syllables
      (c >= 0xf900 && c <= 0xfaff) || // CJK compat
      (c >= 0xfe30 && c <= 0xfe6f) || // CJK compat forms
      (c >= 0xff00 && c <= 0xff60) || // fullwidth forms
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd); // CJK ext
    n += wide ? 2 : 1;
  }
  return n;
}

function walkHtml(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

if (!existsSync(DIST)) {
  console.error('❌ 找不到 dist：本检查必须在构建之后运行（build 链里它排在 astro build 之后）');
  process.exit(2);
}

const files = walkHtml(DIST).filter((f) => !/[/\\]404\.html$/.test(f) && !f.includes('__forms'));
let titleOut = 0;
let descOver = 0;
const worst = [];

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const title = (html.match(/<title>(.*?)<\/title>/) ?? [])[1] ?? '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? '';
  const tw = width(title);
  const dw = width(desc);
  if (tw < TITLE_MIN || tw > TITLE_MAX) titleOut++;
  if (dw > DESC_MAX) descOver++;
  if (tw > TITLE_MAX) worst.push([tw, path.relative(DIST, f)]);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const prev = baseline.metaLength ?? null;

if (UPDATE || !prev) {
  baseline.metaLength = { titleOutOfRange: titleOut, descriptionOverLimit: descOver };
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`📌 已写入基线：titleOutOfRange=${titleOut} descriptionOverLimit=${descOver}（页面 ${files.length}）`);
  process.exit(0);
}

const problems = [];
if (titleOut > prev.titleOutOfRange) {
  problems.push(`标题超标 ${titleOut} > 基线 ${prev.titleOutOfRange}（+${titleOut - prev.titleOutOfRange}）`);
}
if (descOver > prev.descriptionOverLimit) {
  problems.push(`描述超标 ${descOver} > 基线 ${prev.descriptionOverLimit}（+${descOver - prev.descriptionOverLimit}）`);
}

const drop = (n, b) => (b - n > 0 ? `，已降 ${b - n}` : '');
if (problems.length) {
  console.error('❌ 标题/描述长度比基线更差：');
  for (const p of problems) console.error('   · ' + p);
  console.error('\n这是棘轮：只允许下降。要么改短新内容，要么在提交信息里说明为什么必须增加。');
  console.error('确认无误后再更新基线：npm run check:meta-length -- --update');
  const worst5 = worst.sort((a, b) => b[0] - a[0]).slice(0, 5);
  for (const [w, p] of worst5) console.error(`   最长 ${w}: ${p}`);
  process.exit(1);
}

console.log(
  `✅ 标题超标 ${titleOut}/${prev.titleOutOfRange}${drop(titleOut, prev.titleOutOfRange)}，` +
    `描述超标 ${descOver}/${prev.descriptionOverLimit}${drop(descOver, prev.descriptionOverLimit)}`
);
