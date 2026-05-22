'use client';

import { useMemo, useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminPostForm() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const suggestedSlug = useMemo(() => slugify(title), [title]);
  const effectiveSlug = slug.trim() || suggestedSlug;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    const payload = {
      title: title.trim(),
      slug: effectiveSlug,
      excerpt: excerpt.trim(),
      category: category.trim() || null,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      coverImage: coverImage.trim() || null,
      content,
    };

    if (!payload.title || !payload.slug || !payload.content.trim()) {
      setStatus('error');
      setMessage('Title, slug, and content are required.');
      return;
    }

    try {
      const res = await fetch('/.netlify/functions/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setStatus('error');
        setMessage(err?.error || 'Failed to publish. Check function logs.');
        return;
      }

      const data = await res.json().catch(() => ({}));
      setStatus('success');
      setMessage(data?.message || 'Published successfully.');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Post title"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder={suggestedSlug || 'my-post-slug'}
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">Effective slug: {effectiveSlug || '—'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="e.g. Manufacturing"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Excerpt (optional)</label>
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Short summary shown on the blog list"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="ipl, oem, compliance"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cover Image URL (optional)</label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="/images/..."
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Content (Markdown/MDX)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[320px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            placeholder="Write your post body here..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' ? 'Publishing...' : 'Publish'}
          </button>
          <a className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50" href="/en/blog">
            View Blog
          </a>
        </div>

        {status !== 'idle' && message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
