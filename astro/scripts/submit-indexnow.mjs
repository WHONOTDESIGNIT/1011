// IndexNow 主动推送：将全站 URL 清单提交给 Bing / Yandex / Seznam（indexnow.org 共享端点）
//
// 用法：
//   node scripts/submit-indexnow.mjs            # 仅在 Netlify 生产构建（CONTEXT=production）时推送
//   node scripts/submit-indexnow.mjs --force    # 忽略环境判断，强制执行（本地/CI 手动推送）
//
// 依赖：
//   - dist/sitemap*.xml（generate-sitemap.mjs 产物），缺失时回退仓库根的 site-urls.txt
//   - astro/public/dbb5a892b50b43e7bda9e6a8b927b232.txt（IndexNow 验证 key 文件，线上可访问）
//
// 分批：IndexNow 单请求上限 10,000 条，这里按 9,000 条切批，避免站点长大后整批被拒。
// 失败分流：4xx（429 除外）= 我们的配置坏了（key 失效、host 不符、URL 畸形）→ 非零退出；
//           429 限流 / 5xx / 网络异常 = 对方的可用性问题 → 只告警，不拦部署。
//           guard 只该守自己的不变量；第三方端点的抖动不能扣住内容发布。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ASTRO_ROOT, '..');

const HOST = 'iplmanufacturer.com';
const KEY = 'dbb5a892b50b43e7bda9e6a8b927b232';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const URL_FILE = path.join(REPO_ROOT, 'site-urls.txt');

async function main() {
  const force = process.argv.includes('--force');

  // 非 Netlify 生产构建时跳过（本地/预览部署不推送），--force 可绕过
  if (!force && process.env.CONTEXT !== 'production') {
    console.log('ℹ️  非 Netlify 生产构建（CONTEXT=%s），跳过 IndexNow 推送；本地手动执行请加 --force', process.env.CONTEXT || 'undefined');
    return;
  }

  // URL 清单：优先从 dist 的 sitemap 产物提取（generate-sitemap.mjs 按语言拆分后的权威 loc 全集，
  // 自动覆盖新增文章/fallback URL），缺失时回退 site-urls.txt（仓库根，generate-site-urls.mjs 生成）
  const sitemapDir = path.join(ASTRO_ROOT, 'dist');
  let urls = [];
  if (fs.existsSync(sitemapDir)) {
    const sitemapFiles = fs
      .readdirSync(sitemapDir)
      .filter((f) => f.startsWith('sitemap') && f.endsWith('.xml'));
    for (const name of sitemapFiles) {
      const xml = fs.readFileSync(path.join(sitemapDir, name), 'utf8');
      for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) urls.push(m[1]);
    }
  }
  if (urls.length === 0) {
    if (!fs.existsSync(URL_FILE)) {
      console.error(`❌ 未找到 ${URL_FILE}，请先在 astro/ 目录执行 node scripts/generate-site-urls.mjs`);
      return;
    }
    urls = fs
      .readFileSync(URL_FILE, 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  urls = [...new Set(urls)].sort();

  // 附带 sitemap 自身，帮助搜索引擎整站发现
  const urlList = [...urls, `https://${HOST}/sitemap.xml`];

  const CHUNK = 9000;
  const chunks = [];
  for (let i = 0; i < urlList.length; i += CHUNK) chunks.push(urlList.slice(i, i + CHUNK));

  console.log(`🚀 IndexNow 推送 ${urlList.length} 条 URL → api.indexnow.org（分 ${chunks.length} 批，每批 ≤${CHUNK}）…`);

  let hardFail = 0;
  let softFail = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk };
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (res.ok) {
        console.log(`✅ 第 ${i + 1}/${chunks.length} 批成功（HTTP ${res.status}）：${chunk.length} 条 URL`);
      } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        // 400 参数错误 / 403 key 无效 / 422 主机不匹配：我方配置问题，必须拦
        hardFail++;
        console.error(`❌ 第 ${i + 1}/${chunks.length} 批被拒（HTTP ${res.status}）：${text || '(空响应)'}`);
      } else {
        // 429 限流 / 5xx 对方故障：不拦部署，留日志，下次构建重试
        softFail++;
        console.warn(`⚠️  第 ${i + 1}/${chunks.length} 批未送达（HTTP ${res.status}，对方侧问题）：${text || '(空响应)'}`);
      }
    } catch (err) {
      softFail++;
      console.warn(`⚠️  第 ${i + 1}/${chunks.length} 批网络错误（不拦部署）：${err.message}`);
    }
  }

  if (hardFail > 0) {
    process.exitCode = 1;
    console.error(`❌ IndexNow 有 ${hardFail}/${chunks.length} 批被判为配置错误（4xx）—— 构建以非零码结束，先查 key 文件、host 与 URL 格式`);
  }
  if (softFail > 0) {
    console.warn(`⚠️  IndexNow 有 ${softFail}/${chunks.length} 批未送达（限流/对方故障/网络），不拦部署；下次构建会整批重推`);
  }
  if (hardFail === 0 && softFail === 0) {
    console.log(`✅ IndexNow 全部 ${chunks.length} 批推送成功：${urlList.length} 条 URL`);
  }
}

main();
