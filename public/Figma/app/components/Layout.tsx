import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div 
      className="min-h-screen mx-auto relative pb-20"
      style={{ 
        maxWidth: '393px',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <Outlet />
      <BottomNav />
    </div>
  );
}