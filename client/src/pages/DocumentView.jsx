import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SummaryTab from '../components/SummaryTab';
import RiskTab from '../components/RiskTab';
import QATab from '../components/QATab';

const TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'risks', label: 'Risks' },
  { key: 'qa', label: 'Q&A' },
];

export default function DocumentView() {
  const { id } = useParams();

  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState('summary');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      setDoc(null);
      setTab('summary');
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

  // The upload endpoint saves the text even when GPT fails, so offer a retry
  // instead of making the user upload the document again.
  const retryAnalysis = async () => {
    setRetrying(true);
    setError('');
    try {
      const { data } = await api.post(`/documents/${id}/analyze`);
      setDoc(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  const analysed = doc?.analysisStatus === 'complete';

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="md:flex">
        <Sidebar />

        <main className="min-w-0 flex-1 px-6 py-8">
          {loading && <p className="text-ink/60">Loading…</p>}

          {error && !loading && !doc && (
            <div className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
              {error}
            </div>
          )}

          {doc && !loading && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-2xl font-semibold">{doc.name}</h1>
              <p className="mt-1 text-sm text-ink/50">
                Uploaded {new Date(doc.createdAt).toLocaleString()}
              </p>

              {!analysed && (
                <div className="mt-6 rounded-xl border border-risk-medium/40 bg-risk-medium/10 p-5">
                  <p className="text-sm text-risk-medium">
                    {doc.analysisStatus === 'failed'
                      ? 'The AI analysis failed for this document.'
                      : 'This document has not been analysed yet.'}
                  </p>
                  {error && (
                    <p className="mt-2 text-sm text-risk-high">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={retryAnalysis}
                    disabled={retrying}
                    className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:opacity-90 disabled:opacity-40"
                  >
                    {retrying ? 'Analysing…' : 'Run analysis'}
                  </button>
                </div>
              )}

              {analysed && (
                <>
                  <div className="mt-6 flex gap-1 border-b border-white/10">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                          tab === t.key
                            ? 'border-gold text-gold'
                            : 'border-transparent text-ink/60 hover:text-ink'
                        }`}
                      >
                        {t.label}
                        {t.key === 'risks' && doc.risks?.length ? (
                          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-ink/70">
                            {doc.risks.length}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    {tab === 'summary' && <SummaryTab summary={doc.summary} />}
                    {tab === 'risks' && <RiskTab risks={doc.risks} />}
                    {tab === 'qa' && <QATab documentId={doc._id} />}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
