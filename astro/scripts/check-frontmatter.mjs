#!/usr/bin/env node
/**
 * frontmatter 守卫：拦截「键被插进折叠块内部」和一切无法解析的 frontmatter，
 * 避免 Content Collection 同步失败导致 `astro build` 整体中断。
 *
 * 背景：citable summary 同步曾把 `citableSummary` 插到 `description: >-` 与折叠正文之间，
 *   description: >-
 *   citableSummary: "..."     ← 错位，折叠块被截断
 *     <description 折叠块正文>
 * YAML 随后报 bad indentation of a mapping entry，构建中断。同类错位在剩余语种同步时会复现。
 *
 * 用法：
 *   node scripts/check-frontmatter.mjs          # 只读检查（构建链第一步）；有问题 exit 1
 *   node scripts/check-frontmatter.mjs --fix    # 就地修复错位键
 *   node scripts/check-frontmatter.mjs <root>   # 指定扫描根目录（自测用）
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const positional = args.find((a) => !a.startsWith('--'));
const BLOG = resolve(positional ?? fileURLToPath(new URL('../src/content/blog', import.meta.url)));

/** 折叠/块标量开头：description: >-  description: |  description: >2- 等 */
const BLOCK_OPEN = /^([A-Za-z_][\w-]*):[ \t]*[>|][-+\d]*[ \t]*$/;
/** 顶层键行（缩进 0） */
const TOP_KEY = /^[A-Za-z_][\w-]*:/;
/** 缩进行：仍是块标量内容，或在它内部的空行 */
const INDENTED = /^[ \t]/;

const fmOf = (src) => src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
const why = (e) => String(e.message).split('\n')[0];

/**
 * 定位并挪出被插进折叠块内部的键。
 * 返回 { repaired: 新文本, moved: [...] } / { repaired: null }（无需修复）/ { error: 原因 }
 */
function repair(src) {
  const m = fmOf(src);
  if (!m) return { error: '无 frontmatter 分隔符' };

  const lines = m[2].split('\n');
  const open = lines.findIndex((l) => BLOCK_OPEN.test(l));
  if (open === -1) return { repaired: null };

  // 折叠块正文必须紧跟缩进行；若下一行就是同级 key，说明有键被插了进来
  let k = open + 1;
  const moved = [];
  while (k < lines.length && TOP_KEY.test(lines[k])) moved.push(lines[k++]);
  if (moved.length === 0) return { repaired: null };

  // 折叠块延续到下一个同级 key（空行属于块内内容，不作为结束条件）
  while (k < lines.length && (lines[k].trim() === '' || INDENTED.test(lines[k]))) k++;
  if (!lines.slice(open + 1 + moved.length, k).some((l) => INDENTED.test(l))) {
    return { error: `折叠块 ${lines[open]} 正文为空，需人工确认` };
  }

  const merged = [
    ...lines.slice(0, open + 1),
    ...lines.slice(open + 1 + moved.length, k),
    ...moved,
    ...lines.slice(k),
  ].join('\n');

  return { repaired: src.replace(m[2], merged), moved };
}

let scanned = 0;
let fixed = 0;
const displaced = [];
const problems = [];

for (const loc of readdirSync(BLOG, { withFileTypes: true })) {
  if (!loc.isDirectory()) continue;
  for (const f of readdirSync(join(BLOG, loc.name))) {
    if (!f.endsWith('.mdx')) continue;
    scanned++;
    const file = join(BLOG, loc.name, f);
    const src = readFileSync(file, 'utf8');
    const { repaired, moved, error } = repair(src);

    if (error) {
      problems.push(`${loc.name}/${f}: ${error}`);
      continue;
    }

    if (!repaired) {
      // 无错位：仍要求 frontmatter 本身可解析（重复键等会在此暴露）
      try {
        yaml.load(fmOf(src)[2]);
      } catch (e) {
        problems.push(`${loc.name}/${f}: frontmatter 无法解析 → ${why(e)}`);
      }
      continue;
    }

    // 插入后置校验：修复结果必须能被 YAML 解析器接受，否则不落盘
    try {
      yaml.load(fmOf(repaired)[2]);
    } catch (e) {
      problems.push(`${loc.name}/${f}: 修复后仍无法解析 → ${why(e)}`);
      continue;
    }

    const keys = moved.map((l) => l.split(':')[0]).join(', ');
    if (!FIX) {
      displaced.push(`${loc.name}/${f}: 折叠块内错位键 ${keys}`);
      continue;
    }
    writeFileSync(file, repaired);
    fixed++;
    console.log(`  ✓ 修复 ${loc.name}/${f}（挪出 ${moved.length} 个键：${keys}）`);
  }
}

for (const d of displaced) console.log(`  ✗ ${d}`);
for (const p of problems) console.log(`  ✗ ${p}`);

console.log(
  `\n[frontmatter] 扫描 ${scanned} 篇；${FIX ? `修复 ${fixed} 篇` : `待修复 ${displaced.length} 篇`}；无法自动处理 ${problems.length} 篇。`
);

if (problems.length > 0 || displaced.length > 0) {
  if (!FIX || problems.length > 0) {
    if (displaced.length > 0) {
      console.log('  提示：运行 `node scripts/check-frontmatter.mjs --fix` 可自动修复错位键');
    }
    if (problems.length > 0) console.log('  提示：以上条目需人工介入，--fix 无法处理');
    process.exit(1);
  }
}
