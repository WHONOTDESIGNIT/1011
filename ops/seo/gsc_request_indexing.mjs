// ops/seo/gsc_request_indexing.mjs
//
// 通过 GSC 浏览器界面提交「请求编入索引」。不需要 OAuth、不需要 GCP 计费——
// 复用的是已登录 GSC 的浏览器 profile。
//
// 为什么需要这个：URL Inspection API 是只读的，Google 没有提供"请求重抓"的写接口；
// 那个动作只存在于界面按钮里。而 UI 的网址检查配额很小且未公开，所以要：
//   1. 先探测配额是否可用（配额按太平洋时间午夜重置）
//   2. 只有确认可用时才逐条提交，避免把有限额度浪费在失败上
//
// 用法：
//   node gsc_request_indexing.mjs https://.../products/a https://.../products/b
//   node gsc_request_indexing.mjs --file urls.txt
//   node gsc_request_indexing.mjs --check-only        # 只探测配额，不提交
//
// 退出码：0 = 全部成功或无需提交；2 = 配额不足；1 = 部分失败
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const REPO_ROOT = process.env.DSH_REPO_ROOT;
const USER_DATA = process.env.DSH_BROWSER_PROFILE;
const SHOT_DIR = process.env.DSH_SHOT_DIR;
if (!REPO_ROOT) { console.error('[gsc-req] 缺少 DSH_REPO_ROOT'); process.exit(2); }
if (!USER_DATA) { console.error('[gsc-req] 缺少 DSH_BROWSER_PROFILE（已登录 GSC 的浏览器 profile）'); process.exit(2); }
if (!fs.existsSync(USER_DATA)) { console.error('[gsc-req] profile 不存在: ' + USER_DATA); process.exit(2); }

const require = createRequire(`${REPO_ROOT}/astro/package.json`);
const { chromium } = require('playwright');

const HOME = 'https://search.google.com/search-console?resource_id=' +
  encodeURIComponent('https://iplmanufacturer.com/');
const INPUT = 'input[aria-label*="中的任何网址"], input[aria-label*="any URL"], input.Ax4B8';

// ---- 参数 ----
const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check-only');
const fi = argv.indexOf('--file');
let urls = argv.filter((a) => a.startsWith('http'));
if (fi >= 0 && argv[fi + 1]) {
  // 相对路径按 DSH_DATA_DIR 解析：tasks.json 入库，不能写本机绝对路径。
  const DATA_DIR = process.env.DSH_DATA_DIR || process.env.DSH_WORKSPACE || process.cwd();
  const rawPath = argv[fi + 1];
  const filePath = /^[A-Za-z]:[\\/]|^\//.test(rawPath) ? rawPath : path.join(DATA_DIR, rawPath);
  if (!fs.existsSync(filePath)) {
    console.error(`[gsc-req] 清单文件不存在: ${filePath}`);
    process.exit(2);
  }
  urls = urls.concat(fs.readFileSync(filePath, 'utf8')
    .split('\n').map((s) => s.trim()).filter((s) => s.startsWith('http')));
  console.log(`[gsc-req] 清单: ${filePath}`);
}
urls = [...new Set(urls.map((u) => u.replace(/\/$/, '')))];
if (!urls.length && !CHECK_ONLY) {
  console.error('[gsc-req] 没有目标 URL。用法: node gsc_request_indexing.mjs <url>... 或 --file urls.txt');
  process.exit(2);
}

const log = (...a) => console.log(`[${new Date().toTimeString().slice(0, 8)}] [gsc-req]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QUOTA_RE = /超出.{0,8}配额|已超出资源的网址检查配额|quota exceeded/i;
// 提交额度耗尽的专属文案（与"网址检查配额"是两套额度）
const SUBMIT_QUOTA_RE = /您今天已经超出了每日配额|请明天再尝试提交|每日配额/i;
const VERDICT_RE = /网址已收录到|网址尚未收录到|网址未收录到|URL is (not )?on Google/i;

const ctx = await chromium.launchPersistentContext(USER_DATA, {
  channel: 'msedge',
  headless: true,
  viewport: { width: 1500, height: 1000 },
  args: ['--profile-directory=Default', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = ctx.pages()[0] || await ctx.newPage();

// 打开页面：网络不可达时给出明确提示并退出，而不是抛堆栈。
async function gotoHome() {
  try {
    await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.error('[gsc-req] 无法打开 GSC —— 网络层面不通（不是脚本问题）。');
    console.error(`  原因: ${String(e.message).split('\n')[0].slice(0, 120)}`);
    console.error('  本机到 search.google.com 的连通性是间歇性的，请在网络可用时重试。');
    await ctx.close().catch(() => {});
    process.exit(2);
  }
}

// 关掉可能存在的配额弹窗 / 任何遮罩对话框
async function dismissDialogs() {
  let closed = 0;
  for (let i = 0; i < 5; i++) {
    const btns = page.locator('button, [role="button"]');
    const n = await btns.count();
    let acted = false;
    for (let j = 0; j < n; j++) {
      const b = btns.nth(j);
      const t = (await b.innerText().catch(() => '')) || '';
      if (/^(关闭|确定|知道了|OK|Close|Got it)$/i.test(t.trim())) {
        if (await b.isVisible().catch(() => false)) {
          await b.click({ timeout: 3000 }).catch(() => {});
          closed++;
          acted = true;
          await sleep(600);
          break;
        }
      }
    }
    if (!acted) break;
  }
  return closed;
}

// 探测配额：打开网址检查，输入一个 URL，看是否出现判定
async function checkQuota(url) {
  await gotoHome();
  await sleep(2500);
  const d = await dismissDialogs();
  if (d) log(`关闭了 ${d} 个对话框`);

  const body0 = (await page.innerText('body').catch(() => '')) || '';
  if (QUOTA_RE.test(body0)) return { quota: false, reason: '页面加载即提示超额' };

  const box = page.locator(INPUT).first();
  await box.waitFor({ state: 'visible', timeout: 30000 });
  await box.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(url, { delay: 5 });
  await sleep(300);
  await page.keyboard.press('Enter');

  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    await sleep(1500);
    const body = (await page.innerText('body').catch(() => '')) || '';
    if (QUOTA_RE.test(body)) {
      await dismissDialogs();
      return { quota: false, reason: '检查时提示超额' };
    }
    if (VERDICT_RE.test(body)) return { quota: true, reason: '判定已出现' };
  }
  return { quota: false, reason: '等待判定超时' };
}

// 点击「请求编入索引」
async function requestIndexing(url) {
  await dismissDialogs();
  // 按钮可能延迟出现
  let btn = null;
  for (let i = 0; i < 12; i++) {
    btn = page.getByRole('button', { name: /请求编入索引|Request indexing/i }).first();
    if (await btn.count() && await btn.isVisible().catch(() => false)) break;
    // 兜底：按文本找可点击元素
    const alt = page.locator('button, [role="button"]').filter({ hasText: /请求编入索引|Request indexing/i }).first();
    if (await alt.count() && await alt.isVisible().catch(() => false)) { btn = alt; break; }
    await sleep(1500);
  }
  if (!btn || !(await btn.count())) {
    return { ok: false, reason: '找不到「请求编入索引」按钮' };
  }
  const disabled = await btn.getAttribute('aria-disabled').catch(() => null);
  if (disabled === 'true') return { ok: false, reason: '按钮为禁用状态（可能配额已用尽）' };

  await btn.click({ timeout: 15000 }).catch(() => {});
  log('  已点击「请求编入索引」，等待确认…');

  // 等待"已将网址添加到优先抓取队列"之类的确认
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    await sleep(1200);
    const body = (await page.innerText('body').catch(() => '')) || '';
    if (/已请求编入索引|已添加到优先抓取队列|已将网址添加|Indexing requested|已加入优先/i.test(body)) {
      return { ok: true, reason: '确认已提交' };
    }
    if (SUBMIT_QUOTA_RE.test(body)) {
      // GSC 原文：'抱歉！我们无法处理这项请求，因为您今天已经超出了每日配额。'
      await dismissDialogs();
      return { ok: false, reason: 'SUBMIT_QUOTA: 提交额度已用尽（GSC 明确要求明天再试）' };
    }
    if (QUOTA_RE.test(body)) {
      await dismissDialogs();
      return { ok: false, reason: 'INSPECT_QUOTA: 网址检查额度不足' };
    }
    // GSC 对提交被拒会弹通用错误：「糟糕！出了点问题 / 提交您的索引编制请求时出现了问题」
    // 这是"请求编入索引"的额度限制（与网址检查额度是两套），继续遍历只会重复被拒。
    if (/提交您的索引编制请求时出现了问题|出了点问题|could not be submitted|Something went wrong/i.test(body)) {
      return { ok: false, reason: 'REJECTED: GSC 拒绝提交（提交额度可能已耗尽）' };
    }
  }
  return { ok: false, reason: '未等到提交确认' };
}

// ---- 主流程 ----
// ---- 已提交记录：跳过做过的 URL ----
// GSC 提交额度实测约 4-5 条/天。不记录的话每轮都从清单开头重来，
// 额度全花在重复提交上，清单永远推进不了。
const DATA_DIR = process.env.DSH_DATA_DIR || process.env.DSH_WORKSPACE || process.cwd();
const SUBMITTED_FILE = path.join(DATA_DIR, '_gsc_submitted.jsonl');
const normUrl = (u) => String(u).trim().replace(/\/$/, '');

function loadSubmitted() {
  const set = new Set();
  if (!fs.existsSync(SUBMITTED_FILE)) return set;
  for (const line of fs.readFileSync(SUBMITTED_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { const r = JSON.parse(t); if (r && r.url) set.add(normUrl(r.url)); } catch { /* 坏行忽略 */ }
  }
  return set;
}

function recordSubmitted(url) {
  fs.appendFileSync(SUBMITTED_FILE,
    JSON.stringify({ url: normUrl(url), submittedAt: new Date().toISOString() }) + '\n');
}

const alreadySubmitted = loadSubmitted();
const beforeCount = urls.length;
urls = urls.filter((u) => !alreadySubmitted.has(normUrl(u)));
if (urls.length !== beforeCount) {
  log(`跳过已提交 ${beforeCount - urls.length} 条，本轮待提交 ${urls.length} 条`);
}

const summary = { ok: 0, fail: 0, quotaStopped: false, results: [] };

log(`目标 ${urls.length} 个 URL` + (CHECK_ONLY ? '（仅探测配额）' : ''));
const probeUrl = urls[0] || 'https://iplmanufacturer.com/products/led-therapy-mask-001a';

const q = await checkQuota(probeUrl);
log(`配额探测: ${q.quota ? '可用 ✅' : '不可用 ❌'}  (${q.reason})`);

if (!q.quota) {
  log('配额未恢复。GSC 网址检查配额按**太平洋时间午夜**重置，');
  log('对应北京时间约 15:00（夏令时）或 16:00（冬令时）。请在重置后重跑本脚本。');
  await page.screenshot({ path: `${SHOT_DIR || '.'}/quota_exhausted_${Date.now()}.png` }).catch(() => {});
  await ctx.close();
  process.exit(2);
}

if (CHECK_ONLY) {
  log('仅探测模式，不提交。');
  await ctx.close();
  process.exit(0);
}

for (let i = 0; i < urls.length; i++) {
  const u = urls[i];
  log(`[${i + 1}/${urls.length}] ${u.replace('https://iplmanufacturer.com', '')}`);
  // 每条都重新走一次检查流程（按钮只在检查结果页出现）
  const qq = await checkQuota(u);
  if (!qq.quota) {
    log('  配额在提交过程中耗尽，停止。');
    summary.quotaStopped = true;
    break;
  }
  const r = await requestIndexing(u);
  if (r.ok) {
    summary.ok++;
    recordSubmitted(url);
    log('  ✅ ' + r.reason);
  } else {
    summary.fail++;
    log('  ❌ ' + r.reason);
    summary.results.push({ url: u, ok: false, reason: r.reason });
    await page.screenshot({ path: `${SHOT_DIR || '.'}/req_fail_${Date.now()}.png` }).catch(() => {});
    // 配额耗尽或 GSC 拒绝：停止整轮。继续只会产生同样的失败。
    if (/配额|REJECTED|SUBMIT_QUOTA|INSPECT_QUOTA/.test(r.reason)) { summary.quotaStopped = true; break; }
  }
  await sleep(4000);   // 条间留白，避免被判定为自动化
}

log('');
log(`完成：成功 ${summary.ok}，失败 ${summary.fail}${summary.quotaStopped ? '，已中断' : ''}`);
if (summary.quotaStopped && summary.ok === 0) {
  log('');
  log('');
  log('全部被拒绝。GSC 的原文是：');
  log('  「抱歉！我们无法处理这项请求，因为您今天已经超出了每日配额。请明天再尝试提交此网址。」');
  log('');
  log('这是**「请求编入索引」的每日提交额度**，与网址检查额度是两套，界面上不显示剩余量。');
  log('它按日重置，但实测"太平洋时间午夜"并不可靠（00:02 PT 仍报今天已超出），');
  log('所以不要掐点跑，明天用同一条命令重试即可（清单文件不会因失败而改变）。');
}
await ctx.close();
log('');
if (summary.quotaStopped && summary.ok === 0) {
  log('本轮未能提交：GSC 的每日提交额度已用尽。GSC 原文——');
  log('  「抱歉！我们无法处理这项请求，因为您今天已经超出了每日配额。请明天再尝试提交此网址。」');
  log('');
  log('这是「请求编入索引」的额度，与网址检查额度是两套，界面上不显示剩余量。');
  log('它按日重置（具体重置时刻实测不稳定，太平洋午夜并不总能恢复）。');
  log('明天用同一条命令重试即可 —— 清单文件不会因失败而改变。');
} else if (summary.quotaStopped) {
  log(`部分提交后额度用尽：成功 ${summary.ok} 条，剩余明天继续。`);
}
log(`完成：成功 ${summary.ok}，失败 ${summary.fail}，中断=${summary.quotaStopped}`);

// 退出码语义（见文件头说明）：
//   配额耗尽属于"今天到此为止"，退出 0，避免计划任务每天报失败把告警训成噪音
if (summary.quotaStopped) process.exit(0);
process.exit(summary.fail === 0 ? 0 : 1);
