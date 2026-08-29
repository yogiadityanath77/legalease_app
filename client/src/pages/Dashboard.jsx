import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/UploadModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="md:flex">
        <Sidebar />

        <main className="flex-1 px-6 py-10">
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
            <span className="mt-4 font-semibold text-ink">Upload a document</span>
            <span className="mt-1 text-sm text-ink/50">
              PDF or pasted text — analysed by GPT-4o
            </span>
          </button>
        </main>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
