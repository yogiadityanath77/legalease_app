import { useEffect, useRef, useState } from 'react';
import api from '../utils/axios';

// Chat-style follow-up questions. Answers are not stored server-side
// (see DECISIONS.md #4), so the transcript lives in component state only.
export default function QATab({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuestion('');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${documentId}/ask`, {
        question: trimmed,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[16rem] space-y-3 rounded-xl bg-surface p-5">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-ink/50">
            Ask anything about this document — for example, “How much notice do I
            have to give before leaving?”
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold text-navy'
                  : 'bg-white/5 text-ink/85'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && <p className="text-sm text-ink/50">Thinking…</p>}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document…"
          className="flex-1 rounded-lg border border-white/10 bg-surface px-4 py-2.5 text-ink outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-navy transition hover:opacity-90 disabled:opacity-40"
        >
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </form>
    </div>
  );
}
