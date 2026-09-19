import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

/**
 * 图片上传（受保护端点）
 *
 * 鉴权：请求头 `X-Function-Secret` 必须等于 Netlify 环境变量 `FUNCTION_SECRET`
 *   —— 这是 Netlify 官方文档给的"自定义 header + 函数内校验"方案
 *   （docs.netlify.com/manage/security/secure-access-to-sites/ 与 Netlify 社区 Access Control 指南）。
 *   注意其固有局限：密钥在调用方手里，能被读到请求的一方复现；因此本端点**不再有任何浏览器 UI**
 *   （/upload 页面已删除），只供本机脚本/curl 等自己的工具使用，密钥不进前端包。
 *   未配置 FUNCTION_SECRET 时一律 503（fail closed），绝不放行。
 *
 * 校验：文件类型由**文件头魔数**判定，不信 Content-Type、不信扩展名；刻意不接受 svg
 *   （SVG 可内嵌脚本，以本站域下发即存储型 XSS，见安全排查 R1）。
 *   大小上限 5 MB。
 */

const MAX_BYTES = 5 * 1024 * 1024;
const STORE_NAME = 'user-uploads';

const MAGIC_TYPES = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { ext: 'gif', mime: 'image/gif', test: (b) => b.length > 6 && b.toString('ascii', 0, 3) === 'GIF' },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

function json(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
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
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const secret = checkSecret(event);
  if (secret === 'missing-env') {
    console.error('upload-image: FUNCTION_SECRET is not configured; refusing all requests');
    return json(503, { error: 'Upload is not configured.' });
  }
  if (secret !== 'ok') {
    return json(401, { error: 'Unauthorized' });
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return json(400, { error: 'Expected multipart/form-data' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return json(400, { error: 'Missing boundary' });
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'binary');

    if (rawBody.length > MAX_BYTES + 4096) {
      return json(413, { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB).` });
    }

    const parts = parseMultipart(rawBody, boundary);
    const filePart = parts.find((p) => p.name === 'image');

    if (!filePart || !filePart.data?.length) {
      return json(400, { error: 'No image field found' });
    }

    if (filePart.data.length > MAX_BYTES) {
      return json(413, { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB).` });
    }

    // 真实类型以文件头为准；扩展名由魔数反推，避免用攻击者提供的文件名
    const detected = MAGIC_TYPES.find((t) => t.test(filePart.data));
    if (!detected) {
      return json(415, { error: 'Unsupported image type (jpeg, png, gif, webp only).' });
    }

    // 不再显式传 siteID/token：此前传入的是未定义的环境变量，
    // 导致 Blobs 客户端没有凭据、每次都 401（线上表现为 "Blobs has generated an internal error (401)"）。
    // 留空即由 Netlify 运行时自动注入站点上下文——同目录的 get-image.mjs / vote.mts 一直是这样且工作正常。
    const imageStore = getStore({ name: STORE_NAME, consistency: 'strong' });

    const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const key = `${uniqueKey}.${detected.ext}`;

    await imageStore.set(key, filePart.data, {
      metadata: {
        contentType: detected.mime,
        originalFilename: String(filePart.filename || 'unknown').slice(0, 200),
        uploadTime: new Date().toISOString(),
        fileSize: String(filePart.data.length),
      },
    });

    return json(200, {
      key,
      url: `/.netlify/functions/get-image?key=${encodeURIComponent(key)}`,
      contentType: detected.mime,
      bytes: filePart.data.length,
    });
  } catch (error) {
    // 不回显内部错误（安全排查 R4）
    console.error('upload-image failed:', error);
    return json(500, { error: 'Internal error' });
  }
};

function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  let start = indexOf(body, boundaryBuffer, 0);
  if (start === -1) return parts;

  start += boundaryBuffer.length;

  while (true) {
    if (body[start] === 0x0d && body[start + 1] === 0x0a) start += 2;

    const nextBoundary = indexOf(body, boundaryBuffer, start);
    if (nextBoundary === -1) break;

    const partData = body.slice(start, nextBoundary);
    const headerEnd = indexOf(partData, Buffer.from('\r\n\r\n'), 0);
    if (headerEnd === -1) { start = nextBoundary + boundaryBuffer.length; continue; }

    const headerStr = partData.slice(0, headerEnd).toString('utf8');
    const data = partData.slice(headerEnd + 4, partData.length - 2);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: filenameMatch ? filenameMatch[1] : null,
      contentType: ctMatch ? ctMatch[1].trim() : null,
      data,
    });

    start = nextBoundary + boundaryBuffer.length;
    const endBoundary = Buffer.from(`--${boundary}--`);
    if (indexOf(body, endBoundary, nextBoundary) === nextBoundary) break;
  }

  return parts;
}

function indexOf(buf, search, fromIndex) {
  return buf.indexOf(search, fromIndex);
}
