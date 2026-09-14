'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  error?: string;
  history?: Message[];
  conversationId?: string;
  token?: string;
};

const MAX_HISTORY = 20;
const CHAT_STORAGE_KEY = 'ishine-chat-conversation-id';
const CHAT_TOKEN_KEY = 'ishine-chat-conversation-token';
/** iShine AI Chat 基础建设完成前强制隐藏窗口（不渲染任何 UI）；
 *  上线时将 CHAT_ENABLED 改为 true 即可恢复（服务端还需设置环境变量 CHAT_ENABLED=true）。 */
const CHAT_ENABLED = false;

/**
 * 会话 id 与令牌都由服务端签发（服务端用 HMAC 签名，别人枚举/猜到 id 也读不到别人的会话）。
 * 客户端只负责持久化服务端返回的这对值，不再自己生成 id。
 */
function readSession(response: Response, data?: ChatResponse) {
  const id = response.headers.get('X-Conversation-Id') || data?.conversationId || '';
  const token = response.headers.get('X-Conversation-Token') || data?.token || '';
  return { id, token };
}

function persistSession(id: string, token: string) {
  if (!id || !token) return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, id);
  window.localStorage.setItem(CHAT_TOKEN_KEY, token);
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zm6 13l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Chat() {
  // 隐藏开关：在 CHAT_ENABLED 为 false 时组件完全不渲染，
  // 保证聊天窗口在页面上一直处于隐藏状态（在首个 hook 之前返回，符合 hooks 规则）
  if (!CHAT_ENABLED) return null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [conversationToken, setConversationToken] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isOpen, isLoading]);

  useEffect(() => {
    if (!hasMounted) return;

    // 只恢复「服务端签发过」的会话；没有就留空，等第一次发送时由服务端签发。
    const storedId = window.localStorage.getItem(CHAT_STORAGE_KEY) || '';
    const storedToken = window.localStorage.getItem(CHAT_TOKEN_KEY) || '';
    if (storedId && storedToken) {
      setConversationId(storedId);
      setConversationToken(storedToken);
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!conversationId || !conversationToken) return;

    let cancelled = false;

    async function loadHistory() {
      setIsHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/chat?conversationId=${encodeURIComponent(conversationId)}`
          + `&token=${encodeURIComponent(conversationToken)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to load chat history.');
        }
        const data = (await response.json()) as ChatResponse;
        if (!cancelled) {
          setMessages(Array.isArray(data.history) ? data.history : []);
        }
      } catch (caughtError) {
        if (!cancelled) {
          const message = caughtError instanceof Error ? caughtError.message : 'Failed to load chat history.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [conversationId, conversationToken]);

  const canSend = input.trim().length > 0 && !isLoading;

  const headerLabel = useMemo(() => {
    if (isLoading) return 'Thinking...';
    if (isHistoryLoading) return 'Loading previous conversation...';
    if (messages.length > 0) return 'Ask about products, OEM/ODM, compliance, and services';
    return 'Ask iShine AI';
  }, [isHistoryLoading, isLoading, messages.length]);

  async function startNewConversation() {
    if (isLoading) return;

    setIsHistoryLoading(true);
    setError('');
    try {
      // 不带 conversationId：服务端签发新的 id + 签名令牌
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newConversation: true }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        throw new Error(data.error || 'Failed to start a new conversation.');
      }

      const data = (await response.json().catch(() => ({}))) as ChatResponse;
      const session = readSession(response, data);
      persistSession(session.id, session.token);
      setConversationId(session.id);
      setConversationToken(session.token);
      setMessages([]);
      setInput('');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Failed to start a new conversation.';
      setError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    const content = input.trim();
    const nextUserMessage: Message = { role: 'user', content };

    setMessages((prev) => [...prev, nextUserMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          messages: messages.slice(-MAX_HISTORY),
          conversationId,
          token: conversationToken,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        throw new Error(data.error || 'Failed to get a response.');
      }

      // 第一次发送时服务端签发会话；把 id + 令牌留存，后续续聊与历史读取都要用
      const issued = readSession(response);
      if (issued.id && issued.token && issued.id !== conversationId) {
        persistSession(issued.id, issued.token);
        setConversationId(issued.id);
        setConversationToken(issued.token);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available.');
      }

      let assistantMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage += chunk;

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantMessage },
        ]);
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
      setError(message);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'Sorry, I could not complete that request right now. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="flex h-[min(70vh,38rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-200 bg-ink-900 px-4 py-4 text-white">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <IconSpark />
                <span>iShine AI</span>
              </div>
              <p className="mt-1 max-w-[18rem] text-xs text-white/70">{headerLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void startNewConversation()}
                disabled={isLoading || isHistoryLoading}
              >
                New
              </button>
              <button
                type="button"
                className="rounded-full border border-white/15 p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <IconClose />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4">
            {isHistoryLoading ? (
              <div className="mb-3 rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-slate-500">
                Loading saved conversation...
              </div>
            ) : null}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
                Ask about OEM/ODM, product differences, compliance, MOQ, packaging, or manufacturing capabilities.
              </div>
            ) : null}

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-neutral-800 ring-1 ring-neutral-200'
                    }`}
                  >
                    {message.content || (message.role === 'assistant' && isLoading ? '...' : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-neutral-200 bg-white px-4 py-3">
            {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading || isHistoryLoading}
                className="min-h-11 flex-1 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-neutral-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
              />
              <button
                type="submit"
                disabled={!canSend || isHistoryLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-xl transition hover:bg-neutral-800"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <IconSpark />
        <span>Ask iShine AI</span>
      </button>
    </div>
  );
}
