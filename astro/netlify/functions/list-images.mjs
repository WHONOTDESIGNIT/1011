import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const imageStore = getStore({
      name: 'user-uploads',
      consistency: 'strong',
      siteID: process.env.MY_SITE_ID || process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN,
    });
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    };
  }
};
