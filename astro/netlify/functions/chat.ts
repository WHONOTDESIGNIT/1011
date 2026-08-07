import OpenAI from 'openai';
import { getDeployStore } from '@netlify/blobs';
import { createClient } from '@supabase/supabase-js';

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

const openai = new OpenAI();
const chatStore = getDeployStore(CHAT_STORE_NAME);
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

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
  if (typeof raw !== 'string') return 'current-chat';
  const trimmed = raw.trim().toLowerCase();
  return trimmed.replace(/[^a-z0-9-_]/g, '').slice(0, 80) || 'current-chat';
}

function chatKey(conversationId: string) {
  return `${CHAT_KEY_PREFIX}:${conversationId}`;
}

export default async (req: Request) => {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const conversationId = normalizeConversationId(url.searchParams.get('conversationId'));
    const history = ((await chatStore.get(chatKey(conversationId), { type: 'json' })) as ChatMessage[] | null) ?? [];
    return json({ conversationId, history });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!supabase) {
    return json(
      {
        error:
          'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure these environment variables before using chat.',
      },
      { status: 500 },
    );
  }

  let body: { message?: unknown; messages?: unknown; newConversation?: unknown; conversationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const conversationId = normalizeConversationId(body.conversationId);
  const conversationKey = chatKey(conversationId);
  const shouldStartNewConversation = body.newConversation === true;

  if (shouldStartNewConversation) {
    await chatStore.setJSON(conversationKey, []);
    return json({ success: true, conversationId, history: [] });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return json({ error: 'Message is required.' }, { status: 400 });
  }

  try {
    const storedHistory = ((await chatStore.get(conversationKey, { type: 'json' })) as ChatMessage[] | null) ?? [];
    const history = storedHistory.slice(-MAX_HISTORY);
    const updatedHistory = [...history, { role: 'user', content: message }];

    const embeddingResult = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: message,
    });

    const queryEmbedding = embeddingResult.data[0]?.embedding;
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding.');
    }

    const { data, error } = await supabase.rpc('match_documents', {
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

    const stream = await openai.chat.completions.create({
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
            await chatStore.setJSON(conversationKey, [
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
        },
      },
    );
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Internal Server Error';
    return json({ error: messageText }, { status: 500 });
  }
};
