import { getStore } from '@netlify/blobs';

/**
 * 文章投票（读取）
 * 安全排查 R7：加入代码级限流，并校验 slug 形态；计数损坏时自愈而不是 500。
 */

const STORE_NAME = 'article-votes';
const MAX_SLUG_LENGTH = 120;

function readCounts(raw: string | null): { likes: number; dislikes: number } {
  if (!raw) return { likes: 0, dislikes: 0 };
  try {
    const parsed = JSON.parse(raw) as { likes?: unknown; dislikes?: unknown };
    return {
      likes: Number.isFinite(Number(parsed.likes)) ? Math.max(0, Math.trunc(Number(parsed.likes))) : 0,
      dislikes: Number.isFinite(Number(parsed.dislikes)) ? Math.max(0, Math.trunc(Number(parsed.dislikes))) : 0,
    };
  } catch {
    return { likes: 0, dislikes: 0 };
  }
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug || slug.length > MAX_SLUG_LENGTH || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    const current = readCounts(await store.get(slug));

    return new Response(JSON.stringify(current), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('get-votes failed:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};

export const config = {
  path: '/api/votes',
  method: ['GET'],
  /** 代码级限流：60 秒内同一 IP 最多 60 次读取（只读，额度放宽一倍）。 */
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
