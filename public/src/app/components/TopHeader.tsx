import { ChevronLeft, Bell, Smile } from 'lucide-react';
import { useNavigate } from 'react-router';

interface TopHeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  ownerMood?: 'happy' | 'neutral' | 'angry';
}

export function TopHeader({ 
  title, 
  showBack = true, 
  showNotification = true,
  ownerMood = 'neutral' 
}: TopHeaderProps) {
  const navigate = useNavigate();

  const getMoodColor = () => {
    switch (ownerMood) {
      case 'happy': return 'text-[#22C55E]';
      case 'angry': return 'text-[#EF4444]';
      default: return 'text-[#FACC15]';
    }
  };

  return (
    <div 
      className="h-[60px] flex items-center justify-between px-4 relative"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '2px solid var(--accent-primary)'
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{
              backgroundColor: 'rgba(255, 107, 0, 0.1)',
              border: '1px solid rgba(255, 107, 0, 0.3)'
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h2 
          className="text-lg font-black uppercase tracking-tight text-white"
          style={{ fontFamily: 'var(--font-broadcast)' }}
        >
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {showNotification && (
          <button 
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white relative transition-colors"
            style={{
              backgroundColor: 'rgba(255, 107, 0, 0.1)',
              border: '1px solid rgba(255, 107, 0, 0.3)'
            }}
          >
            <Bell className="w-4 h-4" />
            <span 
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
          </button>
        )}
        <div 
          className={`w-8 h-8 flex items-center justify-center ${getMoodColor()}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Smile className="w-4 h-4" />
        </div>
      </div>

      {/* Orange accent glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          boxShadow: '0 0 10px var(--accent-primary)',
          opacity: 0.5
        }}
      />
    </div>
  );
}