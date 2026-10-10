// Compile every adapter-locale MDX file with the same compiler Astro uses, to catch MDX-body
// syntax errors that scripts/check-frontmatter.mjs cannot see (it only parses frontmatter).
// Run from the repo: node astro/scripts/_mdx-probe.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

// remark-frontmatter is not a direct dependency; the frontmatter block is already validated by
// scripts/check-frontmatter.mjs, so strip it and compile the body (that is what can break MDX).
const stripFrontmatter = (src) => src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

const BLOG = join(process.cwd(), 'src', 'content', 'blog');
const SLUG = 'ipl-device-power-adapter-travel-plug';
const targets = [];
for (const dir of readdirSync(BLOG)) {
  const p = join(BLOG, dir, `${SLUG}.mdx`);
  try { readFileSync(p); targets.push(p); } catch { }
}
console.log('adapter files found:', targets.length);
let bad = 0;
for (const p of targets) {
  const src = stripFrontmatter(readFileSync(p, 'utf8'));
  try {
    await compile(src, { remarkPlugins: [remarkGfm] });
    console.log('  ok   ', p.split(/[\\/]blog[\\/]/)[1]);
  } catch (e) {
    bad++;
    console.log('  FAIL ', p.split(/[\\/]blog[\\/]/)[1], '->', String(e.message).split('\n')[0].slice(0, 160));
    if (e.line) console.log('         line', e.line, 'col', e.column, '|', (e.reason || '').slice(0, 120));
  }
}
console.log(bad ? `MDX compile FAILURES: ${bad}` : 'all adapter MDX compiles');
process.exit(bad ? 1 : 0);

