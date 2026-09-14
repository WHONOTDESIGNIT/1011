import { getStore } from '@netlify/blobs';
import { createHmac } from 'node:crypto';

/**
 * 文章投票（写入）
 *
 * 安全排查 R7：此前任何人可以无限刷 likes/dislikes，计数完全不可信。现在加入
 *   1) 去重：同一「IP + 文章」在窗口期内只计一次（窗口 24 小时）；
 *   2) 隐私：不存原始 IP，只存 HMAC 后的哈希前 32 位（密钥取 VOTE_HASH_SECRET，回退 FUNCTION_SECRET，
 *      都没有时用固定盐 —— 仍然不落原始 IP）；
 *   3) 限流：代码级 rateLimit（Netlify 所有套餐可用），按 IP + 站点聚合。
 *
 * 计数本体仍存在 site-scoped store `article-votes`（跨部署保留）。
 */

const STORE_NAME = 'article-votes';
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SLUG_LENGTH = 120;

function json(payload: object, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clientIp(req: Request): string {
  const direct = req.headers.get('x-nf-client-connection-ip');
  if (direct) return direct.trim();
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

function ipHash(ip: string): string {
  const secret = process.env.VOTE_HASH_SECRET || process.env.FUNCTION_SECRET || 'ishine-vote-dedupe-v1';
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32);
}

function readCounts(raw: string | null): { likes: number; dislikes: number } {
  if (!raw) return { likes: 0, dislikes: 0 };
  try {
    const parsed = JSON.parse(raw) as { likes?: unknown; dislikes?: unknown };
    return {
      likes: Number.isFinite(Number(parsed.likes)) ? Math.max(0, Math.trunc(Number(parsed.likes))) : 0,
      dislikes: Number.isFinite(Number(parsed.dislikes)) ? Math.max(0, Math.trunc(Number(parsed.dislikes))) : 0,
    };
  } catch {
    // 存量数据损坏时自愈，不让一个坏键把接口打成 500
    return { likes: 0, dislikes: 0 };
  }
}

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
  if (!slug || typeof slug !== 'string' || slug.length > MAX_SLUG_LENGTH
    || !/^[a-z0-9][a-z0-9-]*$/i.test(slug) || (type !== 'like' && type !== 'dislike')) {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const store = getStore(STORE_NAME);
    const key = `${ipHash(clientIp(req))}:${slug}`;

    const seenRaw = await store.get(key);
    const seenAt = seenRaw ? Number(JSON.parse(seenRaw).t) : 0;
    if (seenAt && Date.now() - seenAt < DEDUPE_WINDOW_MS) {
      const current = readCounts(await store.get(slug));
      return json({ ...current, alreadyVoted: true });
    }

    const current = readCounts(await store.get(slug));
    if (type === 'like') {
      current.likes++;
    } else {
      current.dislikes++;
    }

    await store.set(slug, JSON.stringify({ likes: current.likes, dislikes: current.dislikes }));
    await store.set(key, JSON.stringify({ t: Date.now(), slug, type }));

    return json({ ...current, alreadyVoted: false });
  } catch (error) {
    // 不回显内部错误（安全排查 R4）
    console.error('vote failed:', error);
    return json({ error: 'Internal error' }, 500);
  }
};

export const config = {
  path: '/api/vote',
  method: ['POST'],
  /**
   * 代码级限流：60 秒内同一 IP 最多 30 次投票请求（去重是主防线，限流挡自动脚本）。
   * 文档：docs.netlify.com/security/secure-access-to-sites/rate-limiting/
   */
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
