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
};

const MAX_HISTORY = 20;
const CHAT_STORAGE_KEY = 'ishine-chat-conversation-id';

function createConversationId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const [conversationId, setConversationId] = useState('');
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

    const existingConversationId = window.localStorage.getItem(CHAT_STORAGE_KEY);
    const nextConversationId = existingConversationId || createConversationId();
    if (!existingConversationId) {
      window.localStorage.setItem(CHAT_STORAGE_KEY, nextConversationId);
    }
    setConversationId(nextConversationId);
  }, [hasMounted]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function loadHistory() {
      setIsHistoryLoading(true);
      try {
        const response = await fetch(
          `/.netlify/functions/chat?conversationId=${encodeURIComponent(conversationId)}`,
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
  }, [conversationId]);

  const canSend = input.trim().length > 0 && !isLoading;

  const headerLabel = useMemo(() => {
    if (isLoading) return 'Thinking...';
    if (isHistoryLoading) return 'Loading previous conversation...';
    if (messages.length > 0) return 'Ask about products, OEM/ODM, compliance, and services';
    return 'Ask iShine AI';
  }, [isHistoryLoading, isLoading, messages.length]);

  async function startNewConversation() {
    if (!conversationId || isLoading) return;

    setIsHistoryLoading(true);
    setError('');
    try {
      const nextConversationId = createConversationId();
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newConversation: true,
          conversationId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        throw new Error(data.error || 'Failed to start a new conversation.');
      }

      window.localStorage.setItem(CHAT_STORAGE_KEY, nextConversationId);
      setConversationId(nextConversationId);
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
    if (!canSend || !conversationId) return;

    const content = input.trim();
    const nextUserMessage: Message = { role: 'user', content };

    setMessages((prev) => [...prev, nextUserMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          messages: messages.slice(-MAX_HISTORY),
          conversationId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ChatResponse;
        throw new Error(data.error || 'Failed to get a response.');
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
        <div className="flex h-[min(70vh,38rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-4 text-white">
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

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
            {isHistoryLoading ? (
              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                Loading saved conversation...
              </div>
            ) : null}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
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
                        : 'bg-white text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    {message.content || (message.role === 'assistant' && isLoading ? '...' : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading || isHistoryLoading}
                className="min-h-11 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!canSend || isHistoryLoading || !conversationId}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl transition hover:bg-slate-800"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <IconSpark />
        <span>Ask iShine AI</span>
      </button>
    </div>
  );
}
