import OpenAI from 'openai';
import { getDeployStore, type Store } from '@netlify/blobs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type MatchDocument = {
  id: number | string;
  content: string;
  similarity?: number;
};

const MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_HISTORY = 20;
const MAX_CONTEXT_DOCS = 5;
const MATCH_THRESHOLD = 0.78;
const CHAT_STORE_NAME = 'chat-history';
const CHAT_KEY_PREFIX = 'chat';
const SYSTEM_PROMPT =
  'You are iShine AI, a helpful product and manufacturing consultant for IPL devices. Answer based on the provided knowledge base context when possible. If the context does not contain the answer, say so clearly and avoid inventing facts.';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 惰性初始化（安全排查 R4，第二次修复）：
// 之前在模块顶层直接 `new OpenAI()` / `getDeployStore()`，缺环境变量时会在**模块加载期**抛错，
// 而模块加载期的异常发生在 handler 的 try/catch 之外 —— Netlify 会用它自己的 502 信封把
// errorMessage/trace 原样回给匿名调用者（实测仍能读到 "Missing credentials ... apiKey"）。
// 改为懒加载 + 失败返回 null，缺配置走下面可控的 503 分支，细节只进日志。
let openaiClient: OpenAI | null | undefined;
function getOpenAI(): OpenAI | null {
  if (openaiClient === undefined) {
    try {
      openaiClient = process.env.OPENAI_API_KEY ? new OpenAI() : null;
    } catch (error) {
      console.error('chat: OpenAI client init failed:', error);
      openaiClient = null;
    }
  }
  return openaiClient;
}

let storeClient: Store | null | undefined;
function getChatStore(): Store | null {
  if (storeClient === undefined) {
    try {
      storeClient = getDeployStore(CHAT_STORE_NAME);
    } catch (error) {
      console.error('chat: blob store init failed:', error);
      storeClient = null;
    }
  }
  return storeClient;
}

let supabaseClient: SupabaseClient | null | undefined;
function getSupabase(): SupabaseClient | null {
  if (supabaseClient === undefined) {
    supabaseClient =
      supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;
  }
  return supabaseClient;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

function normalizeConversationId(raw: unknown) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim().toLowerCase();
  return trimmed.replace(/[^a-z0-9-_]/g, '').slice(0, 80);
}

function chatKey(conversationId: string) {
  return `${CHAT_KEY_PREFIX}:${conversationId}`;
}

/**
 * 会话令牌（安全排查 R3）：conversationId 由服务端随机签发，并附一个 HMAC 签名；
 * 读取/续写必须同时给出 id 与 token，且签名要匹配。这样别人猜到或枚举 id 也读不到别人的会话，
 * 也不能用任意 id 去清空别人的记录。签名密钥来自环境变量 CHAT_SESSION_SECRET。
 */
function issueSessionToken(conversationId: string): string | null {
  const secret = process.env.CHAT_SESSION_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(conversationId).digest('base64url').slice(0, 22);
}

function sessionTokenMatches(conversationId: string, token: unknown): boolean {
  if (typeof token !== 'string' || !token) return false;
  const expected = issueSessionToken(conversationId);
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req: Request) => {
  // 该功能尚未完成（BaseLayout 里的 <Chat> 仍是注释状态），因此默认关闭：
  // 未显式设置 CHAT_ENABLED=true 时直接 404，避免一个"半成品 + 公网可调用 + 会烧 API 额度"的端点挂在那里。
  if (process.env.CHAT_ENABLED !== 'true') {
    return json({ error: 'Not found' }, { status: 404 });
  }

  if (!process.env.CHAT_SESSION_SECRET) {
    console.error('chat: CHAT_SESSION_SECRET is not configured; refusing all requests');
    return json({ error: 'Chat service is not configured.' }, { status: 503 });
  }

  const client = getOpenAI();
  const store = getChatStore();
  const sb = getSupabase();

  if (!client || !store || !sb) {
    // 不回显缺哪个环境变量（R4）：只说服务未就绪，细节进日志。
    console.error('chat: not configured', {
      openai: Boolean(client),
      blobs: Boolean(store),
      supabase: Boolean(sb),
    });
    return json({ error: 'Chat service is not configured.' }, { status: 503 });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const conversationId = normalizeConversationId(url.searchParams.get('conversationId'));
    if (!conversationId || !sessionTokenMatches(conversationId, url.searchParams.get('token'))) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const history = ((await store.get(chatKey(conversationId), { type: 'json' })) as ChatMessage[] | null) ?? [];
    return json({ conversationId, history });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: { message?: unknown; messages?: unknown; newConversation?: unknown; conversationId?: unknown; token?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const providedId = normalizeConversationId(body.conversationId);
  // 没有 id = 新会话：服务端签发 id + 签名令牌
  const conversationId = providedId || randomUUID().replace(/-/g, '').slice(0, 24);
  const token = issueSessionToken(conversationId) as string;
  const isNewConversation = !providedId;

  if (!isNewConversation && !sessionTokenMatches(providedId, body.token)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationKey = chatKey(conversationId);
  const shouldStartNewConversation = body.newConversation === true;

  if (shouldStartNewConversation) {
    await store.setJSON(conversationKey, []);
    return json({ success: true, conversationId, token, history: [] });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return json({ error: 'Message is required.' }, { status: 400 });
  }

  try {
    const storedHistory = ((await store.get(conversationKey, { type: 'json' })) as ChatMessage[] | null) ?? [];
    const history = storedHistory.slice(-MAX_HISTORY);
    const updatedHistory = [...history, { role: 'user', content: message }];

    const embeddingResult = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: message,
    });

    const queryEmbedding = embeddingResult.data[0]?.embedding;
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding.');
    }

    const { data, error } = await sb.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MAX_CONTEXT_DOCS,
    });

    if (error) {
      throw new Error(error.message);
    }

    const docs = (data as MatchDocument[] | null) ?? [];
    const contextText = docs.length
      ? docs.map((doc, index) => `Context ${index + 1}:\n${doc.content}`).join('\n\n')
      : 'No relevant knowledge base context was found.';

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nKnowledge base context:\n${contextText}`,
        },
        ...updatedHistory,
      ],
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          let assistantMessage = '';

          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (!text) continue;
              assistantMessage += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
            await store.setJSON(conversationKey, [
              ...updatedHistory,
              { role: 'assistant', content: assistantMessage },
            ]);
          } catch (error) {
            controller.error(error);
            return;
          }
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          // 新会话把服务端签发的 id 与令牌回给客户端（正文是流，只能走 header）；
          // 客户端持久化后，续聊与读取历史都要带上这两个值。
          'X-Conversation-Id': conversationId,
          'X-Conversation-Token': token,
        },
      },
    );
  } catch (error) {
    // 不回显内部错误与 SDK 细节（安全排查 R4）
    console.error('chat failed:', error);
    return json({ error: 'Internal error' }, { status: 500 });
  }
};

/**
 * 代码级限流（Netlify 官方支持，所有套餐可用：docs.netlify.com/security/secure-access-to-sites/rate-limiting/）。
 * 按 IP + 站点聚合，60 秒内最多 20 次请求，超出返回 429；这样即使端点被公开，也不会无限烧模型额度。
 * 注意官方提示：跨过阈值后最多需要 10 秒才开始拦截。
 */
export const config = {
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
