// 批量补 nl：全 src 目录扫描替换 locale 推导链 + var LANGS 数组（递归遍历所有源文件）
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/1011-main/1011-main/1011-main/astro/src';

// 1) locale 推导：pt-PT 分支后插入 nl 分支
const LOCALE_OLD = "Astro.url.pathname.startsWith('/pt-PT') ? 'pt-PT' : 'en'";
const LOCALE_NEW = "Astro.url.pathname.startsWith('/pt-PT') ? 'pt-PT' : Astro.url.pathname.startsWith('/nl') ? 'nl' : 'en'";

// 2) LANGS 数组
const LANGS_OLD = "var LANGS = ['tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-PT'];";
const LANGS_NEW = "var LANGS = ['tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-PT', 'nl'];";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(astro|ts|tsx|mjs|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

let ok = true;
let hitLocale = 0;
let hitLangs = 0;
for (const fp of walk(ROOT)) {
  let s = fs.readFileSync(fp, 'utf8');
  let changed = false;
  if (s.includes(LOCALE_OLD)) {
    const n = s.split(LOCALE_OLD).length - 1;
    s = s.split(LOCALE_OLD).join(LOCALE_NEW);
    hitLocale += n;
    changed = true;
  }
  if (s.includes(LANGS_OLD)) {
    const n = s.split(LANGS_OLD).length - 1;
    s = s.split(LANGS_OLD).join(LANGS_NEW);
    hitLangs += n;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(fp, s);
    console.log(`✓ ${path.relative(ROOT, fp)}`);
  }
}
console.log(`locale 推导补 nl: ${hitLocale} 处；LANGS 数组补 nl: ${hitLangs} 处`);

// 兜底扫描：是否还有遗漏的旧模式
const { execSync } = require('child_process');
try {
  const r = execSync(`findstr /s /n /c:"startsWith('/pt-PT') ? 'pt-PT' : 'en'" /c:"['tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-PT']" "${ROOT}\\*.astro" "${ROOT}\\*.ts" "${ROOT}\\*.tsx"`, { encoding: 'utf8' });
  console.log('\n⚠️ 仍有遗漏:\n' + r);
  ok = false;
} catch (e) {
  console.log('\n✅ 全目录扫描：无遗漏的旧 locale 推导 / LANGS 数组');
}
process.exit(ok ? 0 : 1);
