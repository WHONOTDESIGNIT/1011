// legacy-redirects.csv 的字段与审核状态校验。
//
// P1-D 接入构建时，这个模块是"CSV → _redirects"链的第一道闸：未审核的记录、
// 非法的决定、指向不存在的目标、以及只写了 restore 却没写恢复路径的行，都必须
// 让构建立刻失败，而不是静默生成一条错误的线上规则。
//
// 现在尚未接入构建（业主仍在人工审核），可用 CLI 单独查看当前状态：
//   node scripts/lib/legacy-map-check.mjs astro/scripts/legacy-redirects.csv
import fs from 'node:fs';

export const ALLOWED_DECISION = new Set(['301', '410', 'restore', 'keep_404']);

/** 最小 CSV 解析（本文件只处理自己生成的、无嵌套换行的表）。 */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() || [];
  return rows.filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

/**
 * 返回所有不合格记录。空数组 == 可以进入构建。
 * exists(path) 用来判断 301 目标在 dist 里是否真的存在。
 */
export function validateLegacyMap(rows, exists) {
  const problems = [];
  const seen = new Set();

  for (const r of rows) {
    const tag = r.old_url;
    if (!tag) { problems.push({ url: '(空行)', why: 'old_url 为空' }); continue; }
    if (seen.has(tag)) problems.push({ url: tag, why: 'old_url 重复' });
    seen.add(tag);

    if (!r.status || !['301', '410'].includes(r.status)) {
      problems.push({ url: tag, why: `status 必须是 301 或 410，当前 "${r.status}"` });
    }
    // 未审核且无人工决定 -> 不许上线
    if (r.needs_review === 'yes' && !r.review_decision) {
      problems.push({ url: tag, why: 'needs_review=yes 但 review_decision 为空' });
      continue;
    }
    if (r.review_decision && !ALLOWED_DECISION.has(r.review_decision)) {
      problems.push({ url: tag, why: `review_decision 非法："${r.review_decision}"` });
      continue;
    }
    // restore 不是重定向，必须给出恢复目标才算可执行
    if (r.review_decision === 'restore' && !r.restore_ref) {
      problems.push({ url: tag, why: 'review_decision=restore 但 restore_ref 为空' });
    }
    // 人工决定优先于自动判断；两者矛盾时以人工为准，但 301 仍必须有真实目标
    const final = r.review_decision === '301' || r.review_decision === '410' ? r.review_decision : r.status;
    if (final === '301') {
      if (!r.new_url) problems.push({ url: tag, why: '最终判 301 但 new_url 为空' });
      else if (exists && !exists(r.new_url)) problems.push({ url: tag, why: `301 目标不存在：${r.new_url}` });
    }
  }
  return problems;
}

if (process.argv[1] && process.argv[1].endsWith('legacy-map-check.mjs')) {
  const file = process.argv[2] || 'astro/scripts/legacy-redirects.csv';
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const pending = rows.filter((r) => r.needs_review === 'yes' && !r.review_decision);
  const decided = rows.filter((r) => r.review_decision);
  const byDecision = decided.reduce((a, r) => ((a[r.review_decision] = (a[r.review_decision] || 0) + 1), a), {});
  console.log(`总行 ${rows.length}｜已人工决定 ${decided.length}（${JSON.stringify(byDecision)}）｜待审核 ${pending.length}`);
  const problems = validateLegacyMap(rows, null);
  console.log(problems.length ? `❌ 结构性问题 ${problems.length} 条` : '✅ 结构性问题 0');
  for (const p of problems.slice(0, 15)) console.log(`   ${p.url} — ${p.why}`);
  if (pending.length) {
    console.log('\n待审核（按家族）：');
    const g = pending.reduce((a, r) => ((a[r.shape.split('/')[0]] = (a[r.shape.split('/')[0]] || 0) + 1), a), {});
    console.log(JSON.stringify(g));
  }
}
