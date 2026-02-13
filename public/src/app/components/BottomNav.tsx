import { useNavigate, useLocation } from 'react-router';
import { Home, Users, MessageSquare, TrendingUp, Settings } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Hub', path: '/' },
    { icon: Users, label: 'Roster', path: '/roster' },
    { icon: TrendingUp, label: 'Draft', path: '/draft' },
    { icon: MessageSquare, label: 'Phone', path: '/phone' },
    { icon: Settings, label: 'More', path: '/more' },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 h-16 relative"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderTop: '2px solid var(--accent-primary)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Orange glow */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          boxShadow: '0 0 10px var(--accent-primary)',
          opacity: 0.5
        }}
      />

      <div className="max-w-md mx-auto h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 transition-all px-3 py-2"
              style={{
                backgroundColor: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent',
                borderRadius: '4px'
              }}
            >
              <Icon 
                className="w-5 h-5" 
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.4)',
                }} 
              />
              <span 
                className="text-[9px] font-black uppercase tracking-wider"
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.4)',
                  fontFamily: 'var(--font-broadcast)'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}