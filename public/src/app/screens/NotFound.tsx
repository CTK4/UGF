import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-lg text-white/60 mb-8">Page not found</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Home className="w-5 h-5" />
          Back to Hub
        </button>
      </div>
    </div>
  );
}
