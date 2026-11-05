#!/usr/bin/env node
// Regression tests for the three claims guards. No test framework: node:test would add a
// dependency for six cases, and these are exit-code assertions.
//
// Each case builds a throwaway fixture, points a guard at it through the env override, and
// asserts the exit code. Run: npm run test:claims

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(path.join(tmpdir(), 'claims-'));
const results = [];

function run(script, env) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, why: e.message }); }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ---------- messages fixtures ----------
const msgs = path.join(root, 'messages');
mkdirSync(msgs, { recursive: true });
const base = { servicesPage: { oemOdm: { meta: { description: 'An IPL maker for OEM and ODM programmes.' } } } };
writeFileSync(path.join(msgs, 'en.json'), JSON.stringify(base));
writeFileSync(path.join(msgs, 'de.json'), JSON.stringify(base));
writeFileSync(path.join(msgs, 'ja.json'), JSON.stringify(base));

check('messages: identical trees pass', () => {
  const r = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: msgs });
  assert(r.code === 0, `expected 0, got ${r.code}`);
});

check('messages: a translation that adds a standard number fails', () => {
  const bad = structuredClone(base);
  bad.servicesPage.oemOdm.meta.description += ' ISO 13485';
  writeFileSync(path.join(msgs, 'de.json'), JSON.stringify(bad));
  const r = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: msgs });
  assert(r.code === 1, `expected 1, got ${r.code}`);
  assert(r.out.includes('13485'), 'finding was not reported');
  writeFileSync(path.join(msgs, 'de.json'), JSON.stringify(base));
});

check('messages: adding to the ENGLISH page is not caught (known blind spot)', () => {
  const en = structuredClone(base);
  en.servicesPage.oemOdm.meta.description += ' ISO 13485';
  writeFileSync(path.join(msgs, 'en.json'), JSON.stringify(en));
  const r = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: msgs });
  assert(r.code === 0, `current rule cannot see this; documenting the gap, got ${r.code}`);
  writeFileSync(path.join(msgs, 'en.json'), JSON.stringify(base));
});

check('messages: an empty messages dir does not fake a pass', () => {
  const empty = path.join(root, 'messages-empty');
  mkdirSync(empty, { recursive: true });
  const r = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: empty });
  // today it throws on the missing en.json rather than reporting zero; either is acceptable,
  // silently printing ✅ is not
  assert(r.code !== 0, 'empty fixture must not report success');
});

check('messages: same input, same result twice', () => {
  const a = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: msgs });
  const b = run('check-claims-messages.mjs', { CLAIMS_MESSAGES_DIR: msgs });
  assert(a.code === b.code && a.out === b.out, 'nondeterministic output');
});

// ---------- blog fixtures ----------
const blog = path.join(root, 'blog');
mkdirSync(path.join(blog, 'en'), { recursive: true });
mkdirSync(path.join(blog, 'de'), { recursive: true });
writeFileSync(path.join(blog, 'en', 'post.mdx'), '---\ntitle: t\n---\nCertified to IEC 60601.');
writeFileSync(path.join(blog, 'de', 'post.mdx'), '---\ntitle: t\n---\nZertifiziert nach IEC 60601.');

check('blog: matching posts pass', () => {
  const r = run('check-claims-parity.mjs', { CLAIMS_BLOG_DIR: blog });
  assert(r.code === 0, `expected 0, got ${r.code}`);
});

check('blog: a translation with an extra standard number fails', () => {
  writeFileSync(path.join(blog, 'de', 'post.mdx'), '---\ntitle: t\n---\nZertifiziert nach IEC 60601 und ISO 13485.');
  const r = run('check-claims-parity.mjs', { CLAIMS_BLOG_DIR: blog });
  assert(r.code === 1, `expected 1, got ${r.code}`);
  writeFileSync(path.join(blog, 'de', 'post.mdx'), '---\ntitle: t\n---\nZertifiziert nach IEC 60601.');
});

// ---------- dist fixtures ----------
const dist = path.join(root, 'dist');
mkdirSync(path.join(dist, 'services'), { recursive: true });
mkdirSync(path.join(dist, 'de', 'services'), { recursive: true });
writeFileSync(path.join(dist, 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><p>Certified to ISO 13485.</p>');
writeFileSync(path.join(dist, 'de', 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><p>Zertifiziert nach ISO 13485.</p>');

check('dist: matching pages pass', () => {
  const r = run('check-claims-dist.mjs', { CLAIMS_DIST_DIR: dist });
  assert(r.code === 0, `expected 0, got ${r.code}`);
});

check('dist: a localized page with an extra standard number fails', () => {
  writeFileSync(path.join(dist, 'de', 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><p>ISO 13485 und IEC 62471.</p>');
  const r = run('check-claims-dist.mjs', { CLAIMS_DIST_DIR: dist });
  assert(r.code === 1, `expected 1, got ${r.code}`);
  assert(r.out.includes('de/services/oem-odm.html'), 'page was not named in the finding');
  writeFileSync(path.join(dist, 'de', 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><p>Zertifiziert nach ISO 13485.</p>');
});

check('dist: a number only in a script tag is ignored', () => {
  writeFileSync(path.join(dist, 'de', 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><script>var s="ISO 13485 IEC 62471";</script><p>Zertifiziert nach ISO 13485.</p>');
  const r = run('check-claims-dist.mjs', { CLAIMS_DIST_DIR: dist });
  assert(r.code === 0, `script text must not count as a claim, got ${r.code}`);
  writeFileSync(path.join(dist, 'de', 'services', 'oem-odm.html'), '<h1>OEM/ODM</h1><p>Zertifiziert nach ISO 13485.</p>');
});

check('dist: missing dist dir fails instead of passing silently', () => {
  const r = run('check-claims-dist.mjs', { CLAIMS_DIST_DIR: path.join(root, 'nope') });
  assert(r.code === 1, `expected 1, got ${r.code}`);
});

rmSync(root, { recursive: true, force: true });

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  (${r.why})`}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
