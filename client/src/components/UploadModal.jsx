import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const TABS = [
  { key: 'pdf', label: 'Upload PDF' },
  { key: 'text', label: 'Paste Text' },
];

export default function UploadModal({ open, onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState('pdf');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setTab('pdf');
    setFile(null);
    setText('');
    setName('');
    setError('');
    setDragActive(false);
    setLoading(false);
  };

  const close = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }
    setError('');
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const canSubmit = !loading && (tab === 'pdf' ? Boolean(file) : text.trim().length > 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      if (name.trim()) formData.append('name', name.trim());
      if (tab === 'pdf') {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      const { data } = await api.post('/documents/upload', formData);
      reset();
      onClose();
      navigate(`/document/${data.documentId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New document</h2>
          <button
            onClick={close}
            className="text-ink/50 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab toggle */}
        <div className="mb-4 flex rounded-lg border border-white/10 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setError('');
              }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-gold text-navy'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink/70" htmlFor="doc-name">
              Document name <span className="text-ink/40">(optional)</span>
            </label>
            <input
              id="doc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rental agreement"
              className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-ink outline-none focus:border-gold"
            />
          </div>

          {tab === 'pdf' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${
                dragActive
                  ? 'border-gold bg-gold/5'
                  : 'border-white/15 hover:border-white/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {file ? (
                <p className="text-sm text-ink">
                  <span className="text-gold">{file.name}</span> selected
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink/70">
                    Drag &amp; drop a PDF here
                  </p>
                  <p className="text-xs text-ink/40">or click to browse</p>
                </>
              )}
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste the document text here…"
              className="w-full resize-y rounded-lg border border-white/10 bg-navy px-3 py-2 text-ink outline-none focus:border-gold"
            />
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-gold py-2 font-semibold text-navy transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Uploading…' : 'Upload & analyse'}
          </button>
        </form>
      </div>
    </div>
  );
}
