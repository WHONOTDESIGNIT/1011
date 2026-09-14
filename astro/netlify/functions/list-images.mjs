import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

/**
 * 图片清单（受保护端点）
 * 鉴权：请求头 `X-Function-Secret` 必须等于环境变量 `FUNCTION_SECRET`（Netlify 官方推荐的
 * "自定义 header + 函数内校验"）；未配置该环境变量时一律 503（fail closed）。
 * 限制：密钥可被能读取请求的一方复现，因此本端点没有任何浏览器 UI，只给自己的工具用。
 */

const STORE_NAME = 'user-uploads';

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(payload),
  };
}

/** 返回 'ok' | 'missing-env' | 'bad' */
function checkSecret(event) {
  const expected = process.env.FUNCTION_SECRET;
  if (!expected) return 'missing-env';
  const got = event.headers['x-function-secret'] || event.headers['X-Function-Secret'] || '';
  const a = Buffer.from(String(got));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return 'bad';
  return timingSafeEqual(a, b) ? 'ok' : 'bad';
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const secret = checkSecret(event);
  if (secret === 'missing-env') {
    console.error('list-images: FUNCTION_SECRET is not configured; refusing all requests');
    return json(503, { error: 'Media library is not configured.' });
  }
  if (secret !== 'ok') {
    return json(401, { error: 'Unauthorized' });
  }

  try {
    // 不再显式传 siteID/token（此前传的是未定义的环境变量 → Blobs 无凭据 → 每次 401）。
    // 留空由运行时自动注入站点上下文，与 get-image.mjs / vote.ts 的写法一致。
    const imageStore = getStore({ name: STORE_NAME, consistency: 'strong' });
    const { blobs } = await imageStore.list();

    const images = [];

    for (const blob of blobs) {
      try {
        const meta = await imageStore.getMetadata(blob.key);
        images.push({
          key: blob.key,
          url: `/.netlify/functions/get-image?key=${encodeURIComponent(blob.key)}`,
          filename: meta?.metadata?.originalFilename || blob.key,
          contentType: meta?.metadata?.contentType || 'image/jpeg',
          uploadTime: meta?.metadata?.uploadTime || null,
          fileSize: meta?.metadata?.fileSize ? Number(meta.metadata.fileSize) : null,
        });
      } catch {
        images.push({
          key: blob.key,
          url: `/.netlify/functions/get-image?key=${encodeURIComponent(blob.key)}`,
          filename: blob.key,
          contentType: 'image/jpeg',
          uploadTime: null,
          fileSize: null,
        });
      }
    }

    images.sort((a, b) => {
      if (a.uploadTime && b.uploadTime) {
        return new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime();
      }
      return 0;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, total: images.length }),
    };
  } catch (error) {
    // 不向调用者回显内部错误与堆栈（安全排查 R4）；细节只进 Netlify 日志。
    console.error('list-images failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal error' }),
    };
  }
};
