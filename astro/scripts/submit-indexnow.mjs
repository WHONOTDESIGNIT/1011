// IndexNow 主动推送：将全站 URL 清单提交给 Bing / Yandex / Seznam（indexnow.org 共享端点）
//
// 用法：
//   node scripts/submit-indexnow.mjs            # 仅在 Netlify 生产构建（CONTEXT=production）时推送
//   node scripts/submit-indexnow.mjs --force    # 忽略环境判断，强制执行（本地/CI 手动推送）
//
// 依赖：
//   - site-urls.txt（仓库根，由 scripts/generate-site-urls.mjs 生成，1209 条绝对 URL）
//   - astro/public/dbb5a892b50b43e7bda9e6a8b927b232.txt（IndexNow 验证 key 文件，线上可访问）
//
// 说明：推送失败只输出错误、不退出非零码，避免阻塞 Netlify 部署（IndexNow 是加速手段而非收录前提）。
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

  if (!fs.existsSync(URL_FILE)) {
    console.error(`❌ 未找到 ${URL_FILE}，请先在 astro/ 目录执行 node scripts/generate-site-urls.mjs`);
    return;
  }

  const urls = fs
    .readFileSync(URL_FILE, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // 附带 sitemap 自身，帮助搜索引擎整站发现
  const urlList = [...urls, `https://${HOST}/sitemap.xml`];

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  console.log(`🚀 IndexNow 推送 ${urlList.length} 条 URL → api.indexnow.org …`);
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) {
      console.log(`✅ IndexNow 推送成功（HTTP ${res.status}）：${urlList.length} 条 URL`);
    } else {
      // 常见状态：400 参数错误 / 403 key 无效 / 422 主机不匹配 / 429 频率限制
      console.error(`❌ IndexNow 推送失败（HTTP ${res.status}）：${text || '(空响应)'}`);
    }
  } catch (err) {
    console.error(`❌ IndexNow 网络错误：${err.message}`);
  }
}

main();
