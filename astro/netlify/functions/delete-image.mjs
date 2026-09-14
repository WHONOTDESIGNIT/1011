import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

/**
 * 删除图片（受保护端点）
 * 鉴权：请求头 `X-Function-Secret` 必须等于环境变量 `FUNCTION_SECRET`；未配置一律 503（fail closed）。
 * 限制：密钥可被能读取请求的一方复现，因此本端点没有浏览器 UI，只给自己的工具用。
 */

const STORE_NAME = 'user-uploads';
// 只允许删除本端点自己生成的 key 形态（<时间戳>-<随机串>.<允许的扩展名>），
// 避免任何人拿任意字符串去打 Blobs 的键空间。
const KEY_PATTERN = /^\d{10,16}-[a-z0-9]{4,16}\.(jpg|jpeg|png|gif|webp)$/i;

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
  if (event.httpMethod !== 'DELETE') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const secret = checkSecret(event);
  if (secret === 'missing-env') {
    console.error('delete-image: FUNCTION_SECRET is not configured; refusing all requests');
    return json(503, { error: 'Media library is not configured.' });
  }
  if (secret !== 'ok') {
    return json(401, { error: 'Unauthorized' });
  }

  const key = event.queryStringParameters?.key;

  if (!key || !KEY_PATTERN.test(key)) {
    return json(400, { error: 'Missing or invalid key parameter' });
  }

  try {
    // 不再显式传 siteID/token（未定义的环境变量 → Blobs 无凭据 → 401）；留空由运行时注入。
    const imageStore = getStore({ name: STORE_NAME, consistency: 'strong' });

    await imageStore.delete(key);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, key }),
    };
  } catch (error) {
    // 不回显内部错误与堆栈（安全排查 R4）
    console.error('delete-image failed:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal error' }),
    };
  }
};
