#!/usr/bin/env node
/**
 * check-llms-specs.mjs — llms.txt 与产品页参数一致性守卫
 *
 * 背景：llms.txt 曾被写入一份与产品页不符的参数（10 个型号中 8 个的 J/cm²、闪数、
 * 窗口、波长都不同，Euno 净重写成 280 g 而产品页是 275 g）。两份口径分叉会让 AI
 * 复述出与产品页互相打脸的参数。2026-09-17 老板裁定：**以站点产品页（messages/*.json）
 * 为准**；2026-09-21 老板进一步裁定全站 Fitzpatrick 口径统一（见下面第 2 条）。
 *
 * 本守卫在构建时比对两者，任何不一致即以非零退出码中断构建：
 *   1. 每个型号的 J/cm²、闪数、cm²、波长必须与 messages/en.json 的 productDetail 一致
 *   2. Fitzpatrick 口径必须为全站统一口径：I–IV 为标准档，V 仅最低能量档位 + 先做
 *      斑贴测试，VI 不适用；不得再出现「I–V 适用」的旧写法
 *
 * 用法：node scripts/check-llms-specs.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASTRO = join(HERE, '..');
const LLMS = join(ASTRO, 'public', 'llms.txt');
const MSG = join(ASTRO, '..', 'messages', 'en.json');

const PRODUCTS = {
  'Lumi 2 IPL': 'lumi-2',
  'Sapphire IPL': 'venus',
  'Hestia IPL': 'hestia',
  'Alpha IPL': 'alpha',
  'Emerald IPL': 'emerald',
  'Hebe IPL': 'hebe',
  'Themis IPL': 'themis',
  'Eirene IPL': 'eirene',
  'Euno IPL': 'euno',
  'Golden Luxury IPL (Wooden)': 'wooden',
};

const dash = (s) => String(s).replace(/[-–—]/g, '–').replace(/\s+/g, ' ').trim();
const num = (s) => String(s).replace(/[\s,]/g, '').replace(/[-–—]/g, '–');

function pick(text) {
  const g = (re) => { const m = text.match(re); return m ? m[1] : null; };
  return {
    energy: g(/([\d.]+(?:[–\-][\d.]+)?)\s*J\/cm²/),
    flashes: g(/([\d,]+)\s*flashes/),
    window: g(/([\d.]+)\s*cm²/),
    wave: g(/(\d{3,4}[–\-]\d{3,4})\s*nm/),
  };
}

const llms = readFileSync(LLMS, 'utf8');
const msg = JSON.parse(readFileSync(MSG, 'utf8')).productDetail;
const problems = [];

for (const [display, slug] of Object.entries(PRODUCTS)) {
  const line = llms.split('\n').find((l) => l.startsWith(`- [${display}](`));
  if (!line) { problems.push(`${display}：llms.txt 中找不到该型号行`); continue; }
  const sp = msg[slug]?.specs;
  if (!sp) { problems.push(`${slug}：messages/en.json 缺少 productDetail.${slug}.specs`); continue; }
  const want = {
    energy: dash(sp.energy.value.replace(/\s*J\/cm²/, '')),
    flashes: num(sp.lamp.value.replace(/^Delivers\s+/i, '').replace(/\s*flashes/, '')),
    window: dash(sp.window.value.replace(/\s*cm²/, '')),
    wave: dash(sp.wavelength.value.replace(/\s*nm/, '')),
  };
  const got = {
    energy: dash(pick(line).energy ?? ''),
    flashes: num(pick(line).flashes ?? ''),
    window: dash(pick(line).window ?? ''),
    wave: dash(pick(line).wave ?? ''),
  };
  for (const k of ['energy', 'flashes', 'window', 'wave']) {
    if (num(got[k]) !== num(want[k])) {
      problems.push(`${display}（${slug}）${k}：llms.txt「${got[k]}」≠ 产品页「${want[k]}」`);
    }
  }
}

// Fitzpatrick 口径（2026-09-21 全站统一）：I–IV 标准档；V 仅最低档位 + 斑贴；VI 不适用
if (/Fitzpatrick I–V/.test(llms)) {
  problems.push('llms.txt 仍出现「Fitzpatrick I–V」（应为 I–IV 标准档；V 仅最低档位 + 斑贴；VI 不适用）');
}
if (!/Fitzpatrick I–IV/.test(llms)) {
  problems.push('llms.txt 未出现「Fitzpatrick I–IV」（标准档范围应写明 I–IV）');
}

if (problems.length) {
  console.error(`[llms-specs] ✗ ${problems.length} 处与产品页不一致：`);
  for (const p of problems) console.error(`   ${p}`);
  console.error('[llms-specs] 以产品页（messages/en.json）为准修正 llms.txt 后重新构建。');
  process.exit(1);
}
console.log(`[llms-specs] ✓ ${Object.keys(PRODUCTS).length} 个型号参数与产品页一致；Fitzpatrick 口径为 I–IV（V 仅最低档位 + 斑贴，VI 不适用）`);
