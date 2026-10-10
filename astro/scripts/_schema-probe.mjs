// Validate the 22 adapter MDX frontmatters against the real content-collection schema
// (astro/src/content.config.ts) with js-yaml + the same field rules. check-frontmatter.mjs
// does NOT cover Zod-level rules such as the faqs item shape or the category enum.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const BLOG = join(process.cwd(), 'src', 'content', 'blog');
const CATEGORIES = ['Safety', 'Technology', 'Market', 'Marketing', 'Manufacturing', 'Regulatory',
  'Education', 'Buying Guide', 'OEM/ODM', 'Science', 'Sustainability', 'Business', 'Research',
  'Innovation', 'Components', 'Sourcing', 'B2B', 'Industry Insights', 'Brand Building'];
const SLUG = process.argv[2] || 'ipl-device-power-adapter-travel-plug';

const files = [];
for (const dir of readdirSync(BLOG)) {
  const p = join(BLOG, dir, `${SLUG}.mdx`);
  try { readFileSync(p); files.push([dir, p]); } catch { }
}

const parse = (src) => {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { error: 'no frontmatter' };
  try { return { data: yaml.load(m[1]) }; } catch (e) { return { error: 'YAML: ' + e.message.split('\n')[0] }; }
};

const required = ['title', 'pubDate', 'author', 'category', 'translationKey'];
const keyOrder = [];
let problems = 0;
let enKeys = null;
for (const [dir, p] of files) {
  const r = parse(readFileSync(p, 'utf8'));
  if (r.error) { console.log(`FAIL ${dir}: ${r.error}`); problems++; continue; }
  const d = r.data;
  const keys = Object.keys(d);
  if (dir === 'en') enKeys = keys;
  const errs = [];
  for (const k of required) if (d[k] === undefined) errs.push(`missing ${k}`);
  if (d.category !== undefined && !CATEGORIES.includes(d.category)) errs.push(`category "${d.category}" not in enum`);
  if (d.pubDate !== undefined && Number.isNaN(new Date(d.pubDate).getTime())) errs.push('pubDate unparseable');
  if (d.updatedDate !== undefined && Number.isNaN(new Date(d.updatedDate).getTime())) errs.push('updatedDate unparseable');
  if (d.readTime !== undefined && typeof d.readTime !== 'string' && typeof d.readTime !== 'number') errs.push('readTime type');
  if (d.draft !== undefined && typeof d.draft !== 'boolean') errs.push('draft not boolean');
  if (d.secondary_keywords !== undefined && (!Array.isArray(d.secondary_keywords) || d.secondary_keywords.some((x) => typeof x !== 'string'))) errs.push('secondary_keywords shape');
  if (d.faqs !== undefined) {
    if (!Array.isArray(d.faqs)) errs.push('faqs not an array');
    else d.faqs.forEach((f, i) => {
      if (typeof f !== 'object' || f === null) { errs.push(`faqs[${i}] not an object`); return; }
      const extra = Object.keys(f).filter((k) => k !== 'question' && k !== 'answer');
      if (extra.length) errs.push(`faqs[${i}] extra keys ${extra.join(',')}`);
      for (const k of ['question', 'answer']) {
        if (typeof f[k] !== 'string') errs.push(`faqs[${i}].${k} is ${typeof f[k]}`);
        else if (!f[k].trim()) errs.push(`faqs[${i}].${k} empty`);
      }
    });
  }
  if (d.title !== undefined && typeof d.title !== 'string') errs.push('title not a string');
  if (d.description !== undefined && typeof d.description !== 'string') errs.push('description not a string');
  if (d.citableSummary !== undefined && typeof d.citableSummary !== 'string') errs.push('citableSummary not a string');
  keyOrder.push([dir, keys.join(',')]);
  if (errs.length) { problems++; console.log(`FAIL ${dir}: ${errs.join('; ')}`); }
  else console.log(`ok   ${dir}  keys=${keys.length} faqs=${Array.isArray(d.faqs) ? d.faqs.length : 0} cat=${d.category}`);
}

// key-order comparison against the English reference
if (enKeys) {
  const ref = enKeys.join(',');
  for (const [dir, k] of keyOrder) if (k !== ref) { problems++; console.log(`ORDER ${dir} differs from en`); }
}
console.log(problems ? `SCHEMA PROBLEMS: ${problems}` : `all ${files.length} adapter files pass the schema rules`);
process.exit(problems ? 1 : 0);
