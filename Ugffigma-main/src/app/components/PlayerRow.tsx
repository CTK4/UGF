import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Player, getRatingColor } from '../data/mock-data';
import { OVRBadge } from './OVRBadge';

interface PlayerRowProps {
  player: Player;
  onClick?: () => void;
  variant?: 'normal' | 'selected';
}

export function PlayerRow({ player, onClick, variant = 'normal' }: PlayerRowProps) {
  const isSelected = variant === 'selected';
  
  const getStatusIcon = () => {
    switch (player.status) {
      case 'injured':
        return <AlertCircle className="w-4 h-4 text-[#EF4444]" />;
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-[#22C55E]" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-[#F97316]" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  return (
    <button
      onClick={onClick}
      className="w-full h-[72px] rounded-xl p-3 flex items-center gap-3 transition-all"
      style={{
        backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: isSelected ? '2px solid var(--accent-primary)' : 'none',
      }}
    >
      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: getRatingColor(player.ovr) + '20', color: getRatingColor(player.ovr) }}
      >
        {player.avatar || getInitials(player.name)}
      </div>

      {/* Player Info */}
      <div className="flex-1 flex flex-col items-start justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">{player.name}</h3>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
          <span>{player.archetype}</span>
          <span>•</span>
          <span>{player.age}y</span>
        </div>
      </div>

      {/* OVR Badge */}
      <OVRBadge ovr={player.ovr} size="small" />
    </button>
  );
}