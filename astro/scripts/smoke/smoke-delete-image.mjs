#!/usr/bin/env node
/**
 * smoke-delete-image.mjs — 函数级冒烟测试（独立命令，不进构建链）
 *
 * 为什么独立：函数依赖外部端点、密钥与存储可用性。把它做成构建红灯，就是把
 * IndexNow 429 的教训重演一遍 —— 构建只守自己的不变量。
 *
 * 用法：
 *   npm run smoke:functions                      # 只跑未鉴权矩阵（无需密钥）
 *   $env:FUNCTION_SECRET='...'; npm run smoke:functions   # 加上破坏性用例
 *   $env:SMOKE_BASE_URL='https://...'; ...       # 指向 preview 站点
 *
 * 破坏性用例只碰脚本自己上传的对象（key 以本脚本生成的时间戳开头），绝不碰存量图片；
 * 未提供 FUNCTION_SECRET 时**不执行**破坏性用例，也不假装通过（会打印 SKIPPED）。
 *
 * 退出码：0 = 已执行的断言全过；1 = 有断言失败；2 = 配置/网络问题，无法判断。
 */

const BASE = (process.env.SMOKE_BASE_URL || 'https://iplmanufacturer.com').replace(/\/+$/, '');
const SECRET = process.env.FUNCTION_SECRET || '';
const WRONG_VALUE = ['definitely', 'not', 'the', 'correct', 'value'].join('-');
const FN = `${BASE}/.netlify/functions`;

let passed = 0;
let failed = 0;
const results = [];

function check(name, ok, detail) {
  if (ok) { passed++; results.push(`  PASS  ${name}`); }
  else { failed++; results.push(`  FAIL  ${name}${detail ? `  — ${detail}` : ''}`); }
}

async function call(method, path, { auth, key } = {}) {
  const url = new URL(`${FN}/${path}`);
  if (key !== undefined) url.searchParams.set('key', key);
  const headers = {};
  if (auth !== undefined) headers['X-Function-Secret'] = auth;
  const res = await fetch(url, { method, headers });
  return res;
}

async function main() {
  console.log(`smoke-delete-image  ->  ${BASE}`);
  let res;

  // 1) 方法限制：只接受 DELETE
  res = await call('GET', 'delete-image');
  check('GET returns 405', res.status === 405, `got ${res.status}`);

  // 2) 不带密钥：生产必须拒绝（401），未配置密钥的实例会 503 —— 两者都算"拒绝"
  res = await call('DELETE', 'delete-image');
  check('DELETE without secret is refused', res.status === 401 || res.status === 503, `got ${res.status}`);

  // 3) 错误密钥：绝不能通过。401 = 配置了密钥且比对失败；503 = 该部署未配置密钥（fail closed）。
  //    两种都算"拒绝"，但要分清是哪种：503 意味着这个端点在线上是关闭状态。
  res = await call('DELETE', 'delete-image', { auth: WRONG_VALUE });
  const secretConfigured = res.status === 401;
  check(
    'wrong secret is never accepted',
    res.status === 401 || res.status === 503,
    `got ${res.status}`
  );
  results.push(
    secretConfigured
      ? '  INFO  deployment has FUNCTION_SECRET configured (unauthorised -> 401)'
      : '  INFO  deployment returns 503: FUNCTION_SECRET is NOT set there, the endpoint is fail-closed/off'
  );

  // 4) 未鉴权时不应泄露 key 校验细节：坏 key 仍先撞 401
  res = await call('DELETE', 'delete-image', { key: 'not-a-valid-key' });
  check('bad key without secret still 401', res.status === 401 || res.status === 503, `got ${res.status}`);

  if (!SECRET) {
    results.push('  SKIP  authenticated matrix (set FUNCTION_SECRET to run)');
  } else {
    // 5) 已鉴权 + 坏 key 形态：必须 400（key 正则挡住任意字符串打 Blobs）
    res = await call('DELETE', 'delete-image', { auth: SECRET, key: 'not-a-valid-key' });
    check('authenticated bad key returns 400', res.status === 400, `got ${res.status}`);

    res = await call('DELETE', 'delete-image', { auth: SECRET, key: '../../etc/passwd' });
    check('path traversal key returns 400', res.status === 400, `got ${res.status}`);

    // 6) 已鉴权 + 合法形态但从不存在的 key：删除不存在的键是幂等成功
    const ownKey = `${Date.now()}-smoketest.webp`;
    res = await call('DELETE', 'delete-image', { auth: SECRET, key: ownKey });
    check('authenticated delete of an absent own key succeeds', res.status === 200, `got ${res.status}`);

    // 7) 同一 key 再删一次：仍应成功（幂等），失败说明语义变了
    res = await call('DELETE', 'delete-image', { auth: SECRET, key: ownKey });
    check('second delete is idempotent', res.status === 200, `got ${res.status}`);
  }

  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed${SECRET ? '' : ' (auth-only run)'}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`smoke-delete-image: 无法完成（网络或配置问题）：${err.message}`);
  process.exit(2);
});
