import { useEffect, useMemo, useState } from 'react';

type MediaItem = {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  uploadTime: string | null;
  fileSize: number | null;
};

function formatFileSize(fileSize: number | null): string {
  if (!fileSize) {
    return 'Unknown size';
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadTime(uploadTime: string | null): string {
  if (!uploadTime) {
    return 'Unknown date';
  }

  const date = new Date(uploadTime);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
}

export default function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  function handleImageLoad(key: string, e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setDimensions((prev) => ({
      ...prev,
      [key]: `${img.naturalWidth} x ${img.naturalHeight}`,
    }));
  }

  async function loadImages() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/list-images');
      if (!response.ok) {
        throw new Error(`Failed to load images (${response.status})`);
      }

      const data = await response.json();
      setItems(Array.isArray(data.images) ? data.images : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load images';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadImages();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.filename.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        item.contentType.toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  async function copyLink(item: MediaItem) {
    const absoluteUrl = origin ? new URL(item.url, origin).toString() : item.url;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedKey(item.key);
      window.setTimeout(() => setCopiedKey(''), 1500);
    } catch {
      setError('Clipboard copy failed. Please copy the link manually.');
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Image Library</h2>
          <p className="mt-2 text-sm text-slate-600">
            Preview uploaded blob images, open the asset directly, and copy the public link in one click.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="min-w-[240px] rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-500"
            placeholder="Search filename or key"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            onClick={() => void loadImages()}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>{loading ? 'Loading images...' : `${filteredItems.length} image${filteredItems.length === 1 ? '' : 's'}`}</span>
        <a
          className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          href="/.netlify/functions/list-images"
          target="_blank"
          rel="noreferrer"
        >
          Open JSON API
        </a>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/3] animate-pulse bg-slate-100" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !filteredItems.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
          No images found. Upload an asset first or adjust your search keyword.
        </div>
      ) : null}

      {!loading && filteredItems.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const absoluteUrl = origin ? new URL(item.url, origin).toString() : item.url;

            return (
              <article key={item.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <a className="block aspect-[4/3] overflow-hidden bg-slate-100" href={item.url} target="_blank" rel="noreferrer">
                  <img
                    src={item.url}
                    alt={item.filename}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                    onLoad={(e) => handleImageLoad(item.key, e)}
                  />
                </a>

                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.filename}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.key}</p>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-medium text-slate-500">Type</dt>
                      <dd className="mt-1 break-all text-slate-700">{item.contentType}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-medium text-slate-500">Size</dt>
                      <dd className="mt-1 text-slate-700">{formatFileSize(item.fileSize)}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-medium text-slate-500">Dimensions</dt>
                      <dd className="mt-1 text-slate-700">{dimensions[item.key] || 'Loading...'}</dd>
                    </div>
                  </dl>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="font-medium text-slate-500">Uploaded</div>
                    <div className="mt-1">{formatUploadTime(item.uploadTime)}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-medium text-slate-500">Public URL</div>
                    <code className="mt-2 block break-all text-xs text-slate-700">{absoluteUrl}</code>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      onClick={() => void copyLink(item)}
                    >
                      {copiedKey === item.key ? 'Copied' : 'Copy Link'}
                    </button>
                    <a
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
