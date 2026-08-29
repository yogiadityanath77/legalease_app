import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/UploadModal';

const SEVERITIES = ['High', 'Medium', 'Low'];

// Severity is a status scale, not a set of identities — the colours mean
// something, so they are never the only signal: every figure is labelled too.
const SEVERITY_STYLES = {
  High: {
    dot: 'bg-risk-high',
    chip: 'border-risk-high/40 bg-risk-high/10 text-risk-high',
  },
  Medium: {
    dot: 'bg-risk-medium',
    chip: 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium',
  },
  Low: {
    dot: 'bg-risk-low',
    chip: 'border-risk-low/40 bg-risk-low/10 text-risk-low',
  },
};

const MAX_TOP_RISKS = 8;

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-ink/40">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

// Part-to-whole at a glance, three segments. The 2px gaps keep the fills from
// bleeding into one another; the legend below carries the actual numbers.
function SeverityBar({ counts, total }) {
  return (
    <div className="rounded-xl bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-ink/40">
        Severity breakdown
      </p>

      <div className="mt-3 flex h-2.5 gap-0.5">
        {SEVERITIES.filter((s) => counts[s] > 0).map((severity) => (
          <div
            key={severity}
            title={`${counts[severity]} ${severity}`}
            style={{ width: `${(counts[severity] / total) * 100}%` }}
            className={`rounded ${SEVERITY_STYLES[severity].dot}`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {SEVERITIES.map((severity) => (
          <span
            key={severity}
            className="flex items-center gap-2 text-sm text-ink/70"
          >
            <span
              className={`h-2 w-2 rounded-full ${SEVERITY_STYLES[severity].dot}`}
            />
            {severity}
            <span className="text-ink/50">{counts[severity] || 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Everything below is derived from the list response, which already carries
  // summary + risks for each document — no extra requests, no extra GPT calls.
  const stats = useMemo(() => {
    const analysed = docs.filter((d) => d.analysisStatus === 'complete');
    const needsAttention = docs.filter((d) => d.analysisStatus !== 'complete');

    const risks = analysed.flatMap((doc) =>
      (doc.risks || []).map((risk) => ({
        ...risk,
        docId: doc._id,
        docName: doc.name,
      }))
    );

    const counts = risks.reduce((acc, risk) => {
      acc[risk.severity] = (acc[risk.severity] || 0) + 1;
      return acc;
    }, {});

    // Lead with the worst severity actually present, so the panel is never
    // empty just because nothing scored High.
    const topSeverity = SEVERITIES.find((s) => counts[s] > 0) || null;
    const topRisks = topSeverity
      ? risks.filter((r) => r.severity === topSeverity)
      : [];

    return {
      analysed,
      needsAttention,
      totalRisks: risks.length,
      counts,
      topSeverity,
      topRisks,
    };
  }, [docs]);

  const hasDocs = docs.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="md:flex">
        <Sidebar />

        <main className="min-w-0 flex-1 px-6 py-10">
          {loading && <p className="text-ink/60">Loading…</p>}

          {error && !loading && (
            <div className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
              {error}
            </div>
          )}

          {!loading && !error && !hasDocs && (
            <>
              <h1 className="text-2xl font-semibold">
                Welcome{user?.name ? `, ${user.name}` : ''}
              </h1>
              <p className="mt-2 text-ink/60">
                Upload a legal document to get a plain-English breakdown, flagged
                risks, and answers to your questions.
              </p>

              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="mt-8 flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 px-6 py-16 text-center transition hover:border-gold/50 hover:bg-gold/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-2xl text-gold">
                  +
                </span>
                <span className="mt-4 font-semibold text-ink">
                  Upload a document
                </span>
                <span className="mt-1 text-sm text-ink/50">
                  PDF or pasted text — analysed by GPT-4o
                </span>
              </button>
            </>
          )}

          {!loading && !error && hasDocs && (
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">
                    Welcome{user?.name ? `, ${user.name}` : ''}
                  </h1>
                  <p className="mt-1 text-ink/60">
                    Here&apos;s what stands out across your documents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:opacity-90"
                >
                  Upload document
                </button>
              </div>

              {stats.needsAttention.length > 0 && (
                <div className="mt-6 rounded-xl border border-risk-medium/40 bg-risk-medium/10 p-4">
                  <p className="text-sm text-risk-medium">
                    {stats.needsAttention.length === 1
                      ? '1 document has not been analysed yet.'
                      : `${stats.needsAttention.length} documents have not been analysed yet.`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {stats.needsAttention.map((doc) => (
                      <Link
                        key={doc._id}
                        to={`/document/${doc._id}`}
                        className="text-sm text-gold hover:underline"
                      >
                        {doc.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatTile
                  label="Documents"
                  value={docs.length}
                  hint={`${stats.analysed.length} analysed`}
                />
                <StatTile label="Clauses flagged" value={stats.totalRisks} />
                <StatTile
                  label="High severity"
                  value={stats.counts.High || 0}
                  hint="Across all documents"
                />
              </div>

              {stats.totalRisks > 0 && (
                <div className="mt-4">
                  <SeverityBar counts={stats.counts} total={stats.totalRisks} />
                </div>
              )}

              <section className="mt-8">
                <h2 className="text-lg font-semibold">
                  {stats.topSeverity
                    ? `${stats.topSeverity}-severity clauses`
                    : 'Flagged clauses'}
                </h2>

                {stats.topRisks.length === 0 ? (
                  <p className="mt-2 text-sm text-ink/50">
                    {stats.analysed.length === 0
                      ? 'Nothing to show until a document has been analysed.'
                      : 'No risky clauses were flagged in your documents.'}
                  </p>
                ) : (
                  <>
                    <ul className="mt-3 space-y-3">
                      {stats.topRisks.slice(0, MAX_TOP_RISKS).map((risk, i) => (
                        <li key={`${risk.docId}-${i}`}>
                          <Link
                            to={`/document/${risk.docId}?tab=risks`}
                            className="block rounded-xl bg-surface p-5 transition hover:ring-1 hover:ring-gold/30"
                          >
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <h3 className="font-semibold text-ink">
                                {risk.clause}
                              </h3>
                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  SEVERITY_STYLES[risk.severity]?.chip ||
                                  'border-white/20 text-ink/60'
                                }`}
                              >
                                {risk.severity}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-ink/70">
                              {risk.reason}
                            </p>
                            <p className="mt-3 text-xs text-ink/40">
                              {risk.docName}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {stats.topRisks.length > MAX_TOP_RISKS && (
                      <p className="mt-3 text-sm text-ink/50">
                        + {stats.topRisks.length - MAX_TOP_RISKS} more{' '}
                        {stats.topSeverity.toLowerCase()}-severity clauses in
                        your documents.
                      </p>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setReloadKey((n) => n + 1)}
      />
    </div>
  );
}
