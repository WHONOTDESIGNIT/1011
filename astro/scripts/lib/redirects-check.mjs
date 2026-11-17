// _redirects 的判定期工具。
//
// 原有能力只有一个方向：被删掉的垫片页是否都补了 301。实际事故证明这不够——
// 真正会出事的是另外四种：来源重复、目标不存在、规则被前面的通配遮蔽、以及回环。
// 本文件把它们补上，并提供 CLI 便于单独审计一份 _redirects。
//
// 用法（只审计产物，不参与默认构建）：
//   node scripts/lib/redirects-check.mjs --audit dist
import fs from 'node:fs';
import path from 'node:path';

/**
 * 返回被删掉但 _redirects 里找不到对应规则的路径。
 *
 * 规则行形如 `FROM TO 301!`，所以判定用 `FROM + 空格`：这样 `/blog/foo` 不会误配
 * `/blog/foo-bar ...`（前缀相同但并不是同一条规则）。
 */
export function findMissingRedirects(body, deletedPaths) {
  return deletedPaths.filter((from) => !body.includes(`${from} `));
}

/** 解析 _redirects 为结构化规则。忽略注释与空行。 */
export function parseRules(body) {
  const out = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const [from, to, ...rest] = parts;
    const status = rest.find((t) => /^\d{3}!?$/.test(t)) || '';
    out.push({ from, to, status, force: status.endsWith('!'), line });
  }
  return out;
}

/** 同一 FROM 出现多次：不会报错（首条命中），但会掩盖配置错误，必须禁止。 */
export function findDuplicateFrom(rules) {
  const seen = new Map();
  const dup = [];
  for (const r of rules) {
    if (seen.has(r.from)) dup.push({ from: r.from, first: seen.get(r.from), line: r.line });
    else seen.set(r.from, r.line);
  }
  return dup;
}

/**
 * 被前面的通配规则遮蔽：Netlify 自上而下首条命中即生效。
 * 对每条非通配规则，检查它之前是否存在能匹配同一路径的更宽规则。
 * 这正是 2026-08 那次事故的形态：301 放在 /blog/:splat 之后，永不执行。
 */
export function findShadowed(rules) {
  const out = [];
  const head = (p) => p.split(':splat')[0].split('*')[0];
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.from.includes(':splat') || r.from.includes('*')) continue;
    for (let j = 0; j < i; j++) {
      const prev = rules[j];
      if (!prev.from.includes(':splat') && !prev.from.includes('*')) continue;
      if (r.from.startsWith(head(prev.from))) {
        out.push({ from: r.from, shadowedBy: prev.from, line: r.line });
        break;
      }
    }
  }
  return out;
}

/** 回环与多跳：沿 TO 跟随，最多 5 跳。 */
export function findLoops(rules) {
  const byFrom = new Map();
  for (const r of rules) byFrom.set(r.from, r);
  const loops = [];
  const chains = [];
  for (const r of rules) {
    const visited = [r.from];
    let cur = r;
    let hops = 0;
    while (cur && hops < 5) {
      const next = byFrom.get(cur.to);
      if (!next) break;
      hops++;
      if (visited.includes(next.from)) {
        loops.push({ start: r.from, chain: [...visited, next.from].join(' -> ') });
        break;
      }
      visited.push(next.from);
      cur = next;
    }
    if (hops >= 2) chains.push({ start: r.from, hops });
  }
  return { loops, chains };
}

/** 301/200 的目标必须能落到产物：dist 里有对应 .html，或它本身又被其他规则接管。 */
export function findMissingTargets(rules, distDir, hasRuleFor) {  const out = [];
  for (const r of rules) {
    if (!r.status.startsWith('301') && !r.status.startsWith('200')) continue;
    if (r.to.includes(':splat') || r.to.includes('*')) continue;
    const target = r.to.split('?')[0].replace(/\/$/, '');
    if (!target || target === '/') continue;
    if (hasRuleFor && hasRuleFor(target)) continue;
    const rel = target.slice(1);
    // 200 重写的 TO 本身已带 .html（/about /about.html 200）；301 的 TO 是无扩展名的干净路径。
    const candidates = target.endsWith('.html')
      ? [path.join(distDir, rel)]
      : [path.join(distDir, `${rel}.html`), path.join(distDir, rel, 'index.html')];
    if (!candidates.some((c) => fs.existsSync(c))) out.push({ from: r.from, to: r.to, line: r.line });
  }
  return out;
}

/**
 * 301 的目标本身又是一条 **301** 的来源 —— 用户会被连跳两次。
 * 注意：目标被 200 重写规则接管是正常的（/pt-BR → /pt-br → /pt-br.html 200 对客户端
 * 只算一次 301），只有 301→301 才是真二跳。
 */
export function findChainedTargets(rules) {
  const byFrom = new Map();
  for (const r of rules) byFrom.set(r.from, r);
  const out = [];
  for (const r of rules) {
    if (!r.status.startsWith('301')) continue;
    const next = byFrom.get(r.to);
    if (next && next.status.startsWith('301')) out.push({ from: r.from, to: r.to, line: r.line });
  }
  return out;
}

/** 一次性跑全部判定。 */
export function auditRedirects(body, distDir) {
  const rules = parseRules(body);
  const fromSet = new Set(rules.map((r) => r.from));
  const { loops, chains } = findLoops(rules);
  return {
    total: rules.length,
    duplicates: findDuplicateFrom(rules),
    shadowed: findShadowed(rules),
    loops,
    multiHop: chains,
    chainedTargets: findChainedTargets(rules),
    missingTargets: findMissingTargets(rules, distDir, (p) => fromSet.has(p)),
  };
}

// CLI：单独审计一份 _redirects
if (process.argv[1] && process.argv[1].endsWith('redirects-check.mjs') && process.argv.includes('--audit')) {
  const i = process.argv.indexOf('--audit');
  const distDir = path.resolve(process.argv[i + 1] || 'dist');
  const body = fs.readFileSync(path.join(distDir, '_redirects'), 'utf8');
  const r = auditRedirects(body, distDir);
  console.log(`规则 ${r.total} 条`);
  const show = (name, arr) => console.log(`${arr.length ? '❌' : '✅'} ${name}: ${arr.length}`);
  show('重复 FROM', r.duplicates);
  show('被通配遮蔽', r.shadowed);
  show('回环', r.loops);
  show('301 目标不存在', r.missingTargets);
  show('301 目标二跳', r.chainedTargets);
  console.log(`ℹ️  多跳链: ${r.multiHop.length}`);
  for (const [name, arr] of [['重复', r.duplicates], ['遮蔽', r.shadowed], ['回环', r.loops], ['目标缺失', r.missingTargets], ['目标二跳', r.chainedTargets]]) {
    for (const x of arr.slice(0, 10)) console.log(`   [${name}] ${x.line || JSON.stringify(x)}`);
  }
}
