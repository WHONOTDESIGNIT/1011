import { getStore } from '@netlify/blobs';

const getContentType = (key) => {
  const ext = key.split('.').pop()?.toLowerCase();
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
};

export default async (req) => {
  const key = new URL(req.url).searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = getStore('user-uploads');

  try {
    const image = await store.get(key, { type: 'stream' });

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(image, {
      status: 200,
      headers: {
        'Content-Type': getContentType(key),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error retrieving image:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
