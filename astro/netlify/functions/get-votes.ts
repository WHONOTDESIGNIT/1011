import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Bad Request', { status: 400 });
  }

  const store = getStore('article-votes');
  const existing = await store.get(slug);
  const current = existing
    ? JSON.parse(existing) as { likes: number; dislikes: number }
    : { likes: 0, dislikes: 0 };

  return new Response(JSON.stringify(current), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

export const config = {
  path: '/api/votes',
  method: ['GET'],
};
