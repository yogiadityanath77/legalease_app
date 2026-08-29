import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-gold">LegalEase</h1>
        <p className="mb-6 text-sm text-ink/60">Create your account</p>

        {error && (
          <div className="mb-4 rounded-lg border border-risk-high/40 bg-risk-high/10 px-3 py-2 text-sm text-risk-high">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink/70" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-ink outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold py-2 font-semibold text-navy transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
