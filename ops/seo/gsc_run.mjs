// Final GSC URL-inspection runner: fresh page load per URL (only reliable mode),
// 3 parallel workers, resumable JSONL output.
//   node _gsc_run.mjs [--limit N]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const REPO_ROOT = process.env.DSH_REPO_ROOT;
if (!REPO_ROOT) { console.error('[gsc_run] 缺少 DSH_REPO_ROOT（站点仓库根目录，用于解析 playwright）'); process.exit(2); }
const require = createRequire(`${REPO_ROOT}/astro/package.json`);
const { chromium } = require('playwright');

const DIR = process.env.DSH_WORKSPACE;
if (!DIR) { console.error('[gsc_run] 缺少 DSH_WORKSPACE（工作区根目录，含 _gsc_todo.json / _gsc_results.jsonl）'); process.exit(2); }
const TODO_FILE = `${DIR}/_gsc_todo.json`;
const RESULT_FILE = `${DIR}/_gsc_results.jsonl`;
const SHOT_DIR = process.env.DSH_SHOT_DIR;
if (!SHOT_DIR) { console.error('[gsc_run] 缺少 DSH_SHOT_DIR（截图输出目录）'); process.exit(2); }
const USER_DATA = process.env.DSH_BROWSER_PROFILE;
if (!USER_DATA) { console.error('[gsc_run] 缺少 DSH_BROWSER_PROFILE（已登录 GSC 的浏览器 profile 目录）'); process.exit(2); }
const HOME = 'https://search.google.com/search-console?resource_id=' +
  encodeURIComponent('https://iplmanufacturer.com/');
const INPUT = 'input[aria-label*="中的任何网址"], input[aria-label*="any URL"], input.Ax4B8';
const WORKERS = Number(process.env.WORKERS || 3);
const WAIT_MS = Number(process.env.WAIT_MS || 90000);

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const li = argv.indexOf('--limit');
const LIMIT = li >= 0 ? Number(argv[li + 1]) : 0;

if (DRY_RUN) {
  // 干跑：只校验配置与输入是否可达，绝不启动浏览器、不建目录、不写结果文件。
  // 之所以必须有这个开关：本脚本的"运行"就是驱动真实浏览器查 GSC，
  // 没有 dry-run 时任何"验证一下接线对不对"的尝试都会变成真实运行。
  const problems = [];
  if (!fs.existsSync(TODO_FILE)) problems.push(`待查清单不存在: ${TODO_FILE}`);
  if (!fs.existsSync(RESULT_FILE)) problems.push(`结果文件不存在: ${RESULT_FILE}（首次运行会创建）`);
  if (!fs.existsSync(USER_DATA)) problems.push(`浏览器 profile 不存在: ${USER_DATA}`);
  if (!fs.existsSync(SHOT_DIR)) problems.push(`截图目录不存在: ${SHOT_DIR}（正式运行时会创建）`);
  let todo = 0, doneN = 0, queued = 0;
  try {
    const all = JSON.parse(fs.readFileSync(TODO_FILE, 'utf8'));
    todo = all.length;
    const doneSet = new Set();
    if (fs.existsSync(RESULT_FILE)) {
      for (const line of fs.readFileSync(RESULT_FILE, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try { const r = JSON.parse(line); if (r.status && r.status !== 'unknown') doneSet.add(r.url); } catch {}
      }
    }
    doneN = doneSet.size;
    queued = all.filter((u) => !doneSet.has(u)).length;
    if (LIMIT) queued = Math.min(queued, LIMIT);
  } catch (e) {
    problems.push(`读取清单失败: ${e.message}`);
  }
  console.log('[dry-run] 配置与路径校验');
  console.log(`  TODO=${todo} alreadyDone=${doneN} queued=${queued} workers=${WORKERS}`);
  console.log(`  RESULT_FILE=${RESULT_FILE}`);
  console.log(`  USER_DATA=${USER_DATA}`);
  console.log(`  SHOT_DIR=${SHOT_DIR}`);
  if (problems.length) {
    console.log('  未就绪项（正式运行会在这些点失败）:');
    for (const p of problems) console.log(`    - ${p}`);
    process.exit(1);
  }
  console.log('  全部就绪；未启动浏览器、未写任何文件。');
  process.exit(0);
}

fs.mkdirSync(SHOT_DIR, { recursive: true });
const all = JSON.parse(fs.readFileSync(TODO_FILE, 'utf8'));
const done = new Set();
if (fs.existsSync(RESULT_FILE)) {
  for (const line of fs.readFileSync(RESULT_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r.status && r.status !== 'unknown') done.add(r.url); } catch {}
  }
}
let queue = all.filter((u) => !done.has(u));
if (LIMIT) queue = queue.slice(0, LIMIT);
console.log(`TODO=${all.length} alreadyDone=${done.size} queued=${queue.length} workers=${WORKERS}`);
if (!queue.length) { console.log('nothing to do'); process.exit(0); }

const VERDICT_RE = /^网址(已收录到|尚未收录到|未收录到)\s*Google$|^URL is (not )?on Google$/;
const BLOCKED = /流量异常|unusual traffic|系统检测到您的计算机网络|不是机器人|reCAPTCHA|确认您不是机器人/;
const QUOTA = /超出.{0,6}配额|配额会按日更新|quota exceeded|exceeded the quota/i;
const NO_ACCESS = /无权访问|don't have access|do not have access|没有访问权限|权限不足/;

const readState = (page) => page.evaluate(() => {
  const hdr = document.querySelector('span.PuCZwf');
  let verdict = null, state = null;
  for (const el of document.querySelectorAll('*')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (!verdict && /^网址(已收录到|尚未收录到|未收录到)\s*Google$/.test(t)) verdict = t;
    if (!state && /^网页(已编入索引|未编入索引)/.test(t) && t.length < 70) state = t;
  }
  return { verdict, state, shown: hdr ? hdr.textContent.trim() : null };
});

const ctx = await chromium.launchPersistentContext(USER_DATA, {
  channel: 'msedge', headless: true, viewport: { width: 1400, height: 950 },
  args: ['--profile-directory=Default', '--no-first-run', '--no-default-browser-check',
         '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const out = fs.createWriteStream(RESULT_FILE, { flags: 'a' });
const stats = { indexed: 0, not_indexed: 0, unknown: 0 };
const started = Date.now();
let fatal = null, shotBudget = 15, cursor = 0, completed = 0;
const log = (...a) => console.log(`[${new Date().toTimeString().slice(0, 8)}]`, ...a);

async function inspect(page, url) {
  const want = url.replace(/\/$/, '');
  const t0 = Date.now();
  for (let attempt = 1; attempt <= 2 && !fatal; attempt++) {
    try {
      await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 90000 });
      const box = page.locator(INPUT).first();
      await box.waitFor({ state: 'visible', timeout: 30000 });
      await box.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type(url, { delay: 6 });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      const deadline = Date.now() + WAIT_MS;
      let last = null;
      while (Date.now() < deadline) {
        await page.waitForTimeout(800);
        last = await readState(page);
        if (last.verdict && (last.shown || '').replace(/\/$/, '') === want) {
          const ni = /尚未收录到|未收录到|not on Google/.test(last.verdict);
          return { status: ni ? 'not_indexed' : 'indexed', verdict: last.verdict,
                   state: last.state || '', ms: Date.now() - t0, attempt };
        }
        if (page.url().includes('accounts.google.com')) { fatal = 'SESSION_EXPIRED'; break; }
        if (Date.now() - t0 > 8000) {
          const body = await page.innerText('body').catch(() => '');
          if (QUOTA.test(body)) { fatal = 'QUOTA_EXCEEDED'; break; }
          if (BLOCKED.test(body)) { fatal = 'BLOCKED'; break; }
          if (NO_ACCESS.test(body)) { fatal = 'NO_ACCESS'; break; }
        }
      }
      if (fatal) return { status: 'unknown', raw: fatal, ms: Date.now() - t0 };
      if (attempt === 2) {
        if (shotBudget > 0) { shotBudget--; await page.screenshot({ path: `${SHOT_DIR}/unknown_${Date.now()}.png` }).catch(() => {}); }
        return { status: 'unknown', raw: `timeout shown=${last?.shown} verdict=${last?.verdict}`, ms: Date.now() - t0 };
      }
      log(`retry ${url.replace('https://iplmanufacturer.com', '')} (attempt1 failed: shown=${last?.shown})`);
    } catch (e) {
      if (attempt === 2) return { status: 'unknown', raw: 'error: ' + String(e.message).slice(0, 160), ms: Date.now() - t0 };
      await page.waitForTimeout(1500);
    }
  }
  return { status: 'unknown', raw: 'exhausted', ms: Date.now() - t0 };
}

async function worker(id) {
  const page = await ctx.newPage();
  try {
    while (!fatal) {
      const i = cursor++;
      if (i >= queue.length) break;
      const url = queue[i];
      const res = await inspect(page, url);
      out.write(JSON.stringify({ url, ...res, checkedAt: new Date().toISOString() }) + '\n');
      stats[res.status] = (stats[res.status] || 0) + 1;
      completed++;
      if (res.status === 'unknown' || completed % 10 === 0) {
        const el = (Date.now() - started) / 1000;
        log(`w${id} ${completed}/${queue.length} idx=${stats.indexed} not=${stats.not_indexed} unk=${stats.unknown}` +
            ` | ${url.replace('https://iplmanufacturer.com', '')} -> ${res.status}` +
            ` | ${(el / completed).toFixed(1)}s/url ETA ${(((queue.length - completed) * el) / completed / 60).toFixed(0)}min`);
      }
      await page.waitForTimeout(200 + Math.random() * 400);
    }
  } finally {
    await page.close().catch(() => {});
  }
}

try {
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1)));
} finally {
  out.end();
  await ctx.close().catch(() => {});
}
log(`DONE completed=${completed} indexed=${stats.indexed} not_indexed=${stats.not_indexed} unknown=${stats.unknown} fatal=${fatal || 'none'}`);
process.exit(fatal ? 2 : 0);
