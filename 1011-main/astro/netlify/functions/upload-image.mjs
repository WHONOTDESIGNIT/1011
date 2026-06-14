import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Expected multipart/form-data' }) };
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing boundary' }) };
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'binary');

    const parts = parseMultipart(rawBody, boundary);
    const filePart = parts.find((p) => p.name === 'image');

    if (!filePart) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image field found' }) };
    }

    const imageStore = getStore({
      name: 'user-uploads',
      consistency: 'strong',
      siteID: process.env.MY_SITE_ID || process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN,
    });

    const ext = filePart.filename
      ? filePart.filename.split('.').pop()?.toLowerCase() || 'jpg'
      : 'jpg';
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const key = `${uniqueKey}.${ext}`;

    const detectedType = filePart.contentType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    await imageStore.set(key, filePart.data, {
      metadata: {
        contentType: detectedType,
        originalFilename: filePart.filename || 'unknown',
        uploadTime: new Date().toISOString(),
        fileSize: String(filePart.data.length),
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        url: `/.netlify/functions/get-image?key=${encodeURIComponent(key)}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
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
  for (let i = fromIndex; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}
