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
      className="w-full h-[60px] p-2 flex items-center gap-3 transition-all relative overflow-hidden"
      style={{
        backgroundColor: isSelected ? '#1A212C' : 'var(--bg-surface)',
        borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        fontFamily: 'var(--font-broadcast)',
      }}
    >
      {/* Position Badge */}
      <div 
        className="w-12 h-10 flex items-center justify-center font-black text-[11px] uppercase"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          color: '#FF6B00',
          fontFamily: 'var(--font-broadcast)',
        }}
      >
        {player.position}
      </div>

      {/* Player Info */}
      <div className="flex-1 flex flex-col items-start justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h3 
            className="text-[15px] font-black uppercase tracking-tight text-white"
            style={{ fontFamily: 'var(--font-broadcast)' }}
          >
            {player.name}
          </h3>
          {getStatusIcon()}
        </div>
        <div 
          className="flex items-center gap-2 text-[10px] font-bold uppercase text-white/50"
          style={{ fontFamily: 'var(--font-broadcast)' }}
        >
          <span>{player.archetype}</span>
          <span>•</span>
          <span>AGE {player.age}</span>
        </div>
      </div>

      {/* OVR Display - Broadcast Style */}
      <div className="flex flex-col items-end gap-0">
        <div 
          className="text-[10px] font-bold uppercase tracking-wider text-white/50"
          style={{ fontFamily: 'var(--font-broadcast)' }}
        >
          OVR
        </div>
        <div 
          className="text-2xl font-black tabular-nums leading-none"
          style={{ 
            fontFamily: 'var(--font-display)',
            color: getRatingColor(player.ovr)
          }}
        >
          {player.ovr}
        </div>
      </div>

      {/* Glow effect on selected */}
      {isSelected && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--accent-primary) 100%)',
          }}
        />
      )}
    </button>
  );
}