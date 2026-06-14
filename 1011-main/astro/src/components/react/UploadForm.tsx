'use client';

import { useRef, useState } from 'react';

type Status = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedImage {
  url: string;
  filename: string;
}

function IconSpinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin text-slate-400" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600" fill="none" aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86l-8.3 14.5A2 2 0 0 0 3.7 21h16.6a2 2 0 0 0 1.71-2.64l-8.3-14.5a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" aria-hidden="true">
      <path
        d="M8 8h10v10H8V8zm-2 8H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function UploadForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const uploadFile = async (file: File) => {
    if (!file || file.size === 0 || !file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMessage('Please select a valid image file.');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/.netlify/functions/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedImages((prev) => [{ url: data.url, filename: file.name }, ...prev]);
        setStatus('success');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        setStatus('error');
        setErrorMessage(errorData.error || 'Upload failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file) uploadFile(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const handleCopy = async (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const dropZoneClassName =
    status === 'uploading'
      ? 'border-slate-300 bg-slate-50'
      : dragActive
        ? 'border-teal-500 bg-teal-50'
        : 'border-slate-300 bg-white hover:border-slate-400';

  return (
    <div className="max-w-xl">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-200 ${dropZoneClassName}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {status === 'uploading' ? (
            <div className="flex flex-col items-center gap-3">
              <IconSpinner />
              <p className="text-sm text-slate-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <span className="text-sm font-semibold">IMG</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Drag and drop an image here, or{' '}
                  <button
                    type="button"
                    className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG, WebP up to 10MB</p>
              </div>
            </div>
          )}

          {status !== 'uploading' && (
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          )}
        </div>
      </form>

      {status === 'error' && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <IconAlert />
          <span className="text-sm text-red-800">{errorMessage}</span>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Uploaded ({uploadedImages.length})</h2>
          {uploadedImages.map((img, i) => (
            <div key={`${img.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{img.filename}</p>
                <p className="truncate font-mono text-xs text-slate-500">{img.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <IconCheck />
                <button
                  type="button"
                  onClick={() => handleCopy(img.url)}
                  className="rounded-lg p-2 hover:bg-slate-100"
                  title="Copy URL"
                >
                  {copiedUrl === img.url ? <IconCheck /> : <IconCopy />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
