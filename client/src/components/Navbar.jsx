import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logo on the left, user + logout on the right.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-navy/95 px-6 py-4 backdrop-blur">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-xl font-bold tracking-tight text-gold"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-gold text-sm font-black text-navy">
          L
        </span>
        LegalEase
      </button>

      <div className="flex items-center gap-4">
        {user?.name && (
          <span className="hidden text-sm text-ink/60 sm:inline">{user.name}</span>
        )}
        <button
          onClick={onLogout}
          className="rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold transition hover:bg-gold hover:text-navy"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
