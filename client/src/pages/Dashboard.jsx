import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadModal from '../components/UploadModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="text-xl font-bold text-gold">LegalEase</span>
        <button
          onClick={onLogout}
          className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold transition hover:bg-gold hover:text-navy"
        >
          Log out
        </button>
      </header>

      <main className="px-6 py-10">
        <h1 className="text-2xl font-semibold">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-ink/60">
          Upload a legal document to get a plain-English breakdown.
        </p>

        <button
          onClick={() => setUploadOpen(true)}
          className="mt-6 rounded-lg bg-gold px-5 py-2.5 font-semibold text-navy transition hover:opacity-90"
        >
          Upload document
        </button>
      </main>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
