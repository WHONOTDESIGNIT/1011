// 一次性脚本：将 pt-PT 替换为 pt-BR
// 覆盖 astro/src 代码文件（排除 config/i18n.ts，单独处理）与 astro/ 根测试脚本
const fs = require('fs');
const path = require('path');

const ASTRO_DIR = 'd:/1011-main/1011-main/1011-main/astro';
const CODE_EXTS = new Set(['.astro', '.ts', '.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', 'content']);
const SKIP_FILES = new Set([
  path.join(ASTRO_DIR, 'src', 'config', 'i18n.ts'),
  path.join(ASTRO_DIR, 'pages_summary.txt'),
]);

const changed = [];

function walk(dir, isRoot) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, false);
    } else {
      const ext = path.extname(entry.name);
      if (isRoot && !CODE_EXTS.has(ext)) continue; // 根目录仅处理脚本
      if (!CODE_EXTS.has(ext) && ext !== '.mjs') continue;
      if (SKIP_FILES.has(full)) continue;
      let src;
      try {
        src = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (!src.includes('pt-PT')) continue;
      const out = src.split('pt-PT').join('pt-BR');
      fs.writeFileSync(full, out, 'utf8');
      changed.push(full);
    }
  }
}

walk(path.join(ASTRO_DIR, 'src'), false);
walk(ASTRO_DIR, true);

console.log('changed files:', changed.length);
changed.forEach((f) => console.log(' -', f.replace(ASTRO_DIR + '/', '')));
