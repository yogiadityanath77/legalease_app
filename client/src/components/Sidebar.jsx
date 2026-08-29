import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../utils/axios';
import UploadModal from './UploadModal';

const STATUS_LABEL = {
  pending: 'Analysing…',
  failed: 'Analysis failed',
};

// Document history for the logged-in user, plus the entry point for adding a
// new one. The sidebar renders on every signed-in page, so owning the upload
// modal here makes "add document" reachable from anywhere — and lets the list
// refresh itself once the upload lands.
export default function Sidebar() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/documents');
        if (active) setDocs(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <aside className="w-full shrink-0 border-b border-white/10 md:h-[calc(100vh-69px)] md:w-72 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink/40">
            Your documents
          </h2>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="rounded-md border border-gold/40 px-2 py-1 text-xs font-semibold text-gold transition hover:bg-gold hover:text-navy"
          >
            + New
          </button>
        </div>

        {loading && <p className="text-sm text-ink/50">Loading…</p>}

        {error && !loading && (
          <p className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            {error}
          </p>
        )}

        {!loading && !error && docs.length === 0 && (
          <p className="text-sm text-ink/50">
            No documents yet. Upload one to get started.
          </p>
        )}

        <ul className="space-y-1">
          {docs.map((doc) => (
            <li key={doc._id}>
              <NavLink
                to={`/document/${doc._id}`}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition ${
                    isActive
                      ? 'bg-gold/10 text-gold ring-1 ring-gold/30'
                      : 'text-ink/80 hover:bg-white/5'
                  }`
                }
              >
                <span className="block truncate text-sm font-medium">
                  {doc.name}
                </span>
                <span className="mt-0.5 block text-xs text-ink/40">
                  {new Date(doc.createdAt).toLocaleDateString()}
                  {STATUS_LABEL[doc.analysisStatus]
                    ? ` · ${STATUS_LABEL[doc.analysisStatus]}`
                    : ''}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setReloadKey((n) => n + 1)}
      />
    </aside>
  );
}
