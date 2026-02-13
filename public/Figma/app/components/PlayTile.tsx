import { Play } from '../data/mock-data';

interface PlayTileProps {
  play: Play;
  variant?: 'normal' | 'highlighted';
  onClick?: () => void;
}

export function PlayTile({ play, variant = 'normal', onClick }: PlayTileProps) {
  const isHighlighted = variant === 'highlighted';

  return (
    <button
      onClick={onClick}
      className="w-full h-[140px] rounded-2xl p-3 flex flex-col justify-between transition-all"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: play.isOverused 
          ? '2px solid var(--accent-danger)' 
          : isHighlighted 
          ? '2px solid var(--accent-primary)' 
          : 'none',
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
        {play.name}
      </div>

      {/* Route Diagram Placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <svg width="80" height="60" viewBox="0 0 80 60" className="opacity-50">
          <line x1="10" y1="30" x2="70" y2="30" stroke="white" strokeWidth="2" />
          <line x1="40" y1="30" x2="50" y2="10" stroke="white" strokeWidth="2" />
          <line x1="40" y1="30" x2="60" y2="50" stroke="white" strokeWidth="2" />
          <circle cx="10" cy="30" r="3" fill="white" />
        </svg>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-white/60">
          Usage: {play.usage}%
        </div>
        <div 
          className="px-2 py-1 rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {play.personnel}
        </div>
      </div>
    </button>
  );
}
