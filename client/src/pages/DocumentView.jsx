import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

// Phase 2: raw document view. The Summary / Risk / Q&A tabs arrive in Phase 4.
export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/documents/${id}`);
        if (active) setDoc(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xl font-bold text-gold"
        >
          LegalEase
        </button>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold transition hover:bg-gold hover:text-navy"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {loading && <p className="text-ink/60">Loading…</p>}
        {error && !loading && (
          <div className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            {error}
          </div>
        )}

        {doc && !loading && (
          <>
            <h1 className="text-2xl font-semibold">{doc.name}</h1>
            <p className="mt-1 text-sm text-ink/50">
              Uploaded {new Date(doc.createdAt).toLocaleString()}
            </p>
            <pre className="mt-6 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-4 text-sm text-ink/80">
              {doc.rawText}
            </pre>
          </>
        )}
      </main>
    </div>
  );
}
