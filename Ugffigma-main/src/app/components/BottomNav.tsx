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
      className="fixed bottom-0 left-0 right-0 h-20 border-t"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-divider)',
      }}
    >
      <div className="max-w-md mx-auto h-full flex items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 transition-all"
            >
              <Icon 
                className="w-6 h-6" 
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.5)',
                }} 
              />
              <span 
                className="text-[10px] font-medium"
                style={{ 
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.5)',
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
