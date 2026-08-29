const SEVERITY_STYLES = {
  High: 'border-risk-high/40 bg-risk-high/10 text-risk-high',
  Medium: 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium',
  Low: 'border-risk-low/40 bg-risk-low/10 text-risk-low',
};

const ORDER = { High: 0, Medium: 1, Low: 2 };

// Risk-flagged clauses, most severe first.
export default function RiskTab({ risks = [] }) {
  if (risks.length === 0) {
    return <p className="text-sm text-ink/50">No risky clauses were flagged in this document.</p>;
  }

  const sorted = [...risks].sort(
    (a, b) => (ORDER[a.severity] ?? 3) - (ORDER[b.severity] ?? 3)
  );

  const counts = sorted.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['High', 'Medium', 'Low'].map((severity) =>
          counts[severity] ? (
            <span
              key={severity}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${SEVERITY_STYLES[severity]}`}
            >
              {counts[severity]} {severity}
            </span>
          ) : null
        )}
      </div>

      <ul className="space-y-3">
        {sorted.map((risk, i) => (
          <li key={i} className="rounded-xl bg-surface p-5">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h3 className="font-semibold text-ink">{risk.clause}</h3>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  SEVERITY_STYLES[risk.severity] || 'border-white/20 text-ink/60'
                }`}
              >
                {risk.severity}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink/70">{risk.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
