import { getStore } from '@netlify/blobs';

type VoteBody = { slug?: string; type?: string };

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: VoteBody;
  try {
    body = await req.json() as VoteBody;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const { slug, type } = body;
  if (!slug || typeof slug !== 'string' || (type !== 'like' && type !== 'dislike')) {
    return new Response('Bad Request', { status: 400 });
  }

  // site-scoped store：计数跨部署持久保留（区别于 getDeployStore 的按部署隔离）
  const store = getStore('article-votes');
  const existing = await store.get(slug);
  const current = existing
    ? JSON.parse(existing) as { likes: number; dislikes: number }
    : { likes: 0, dislikes: 0 };

  if (type === 'like') {
    current.likes++;
  } else {
    current.dislikes++;
  }

  await store.set(slug, JSON.stringify(current));

  return new Response(JSON.stringify(current), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/api/vote',
  method: ['POST'],
};
