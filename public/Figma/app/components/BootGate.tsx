import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useSave } from '../context/SaveProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ONBOARDING_ROUTES = ['/create-coach', '/interviews', '/offers'];

export function BootGate({ children }: { children: React.ReactNode }) {
  const { save } = useSave();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Whitelist onboarding routes - never redirect from these
    if (ONBOARDING_ROUTES.includes(location.pathname)) {
      return;
    }

    // If no coach created, redirect to create-coach
    if (!save.userCharacterId) {
      navigate('/create-coach', { replace: true });
      return;
    }

    // If coach created but no team, redirect to interviews (unless already on offers)
    if (!save.userTeamId && location.pathname !== '/offers') {
      navigate('/interviews', { replace: true });
      return;
    }
  }, [save.userCharacterId, save.userTeamId, location.pathname, navigate]);

  // Show loading while redirecting
  if (!ONBOARDING_ROUTES.includes(location.pathname)) {
    if (!save.userCharacterId || (!save.userTeamId && location.pathname !== '/offers')) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <LoadingSpinner />
        </div>
      );
    }
  }

  return <>{children}</>;
}
