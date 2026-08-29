// Plain-English summary. GPT returns prose, so split on blank lines for paragraphs.
export default function SummaryTab({ summary }) {
  const paragraphs = (summary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return <p className="text-sm text-ink/50">No summary available for this document.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl bg-surface p-6">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-wrap leading-relaxed text-ink/85">
          {p}
        </p>
      ))}
    </div>
  );
}
