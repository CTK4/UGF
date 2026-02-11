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
      className="h-[72px] flex items-center justify-between px-4"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {showNotification && (
          <button className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6B00] rounded-full"></span>
          </button>
        )}
        <div className={`w-6 h-6 flex items-center justify-center ${getMoodColor()}`}>
          <Smile className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
