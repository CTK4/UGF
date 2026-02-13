import { getRatingColor } from '../data/mock-data';

interface RatingBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

export function RatingBar({ label, value, maxValue = 100 }: RatingBarProps) {
  const percentage = (value / maxValue) * 100;
  const color = getRatingColor(value);

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-24 text-[10px] font-bold uppercase tracking-wider text-white/90"
        style={{ fontFamily: 'var(--font-broadcast)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2 flex-1">
        <div 
          className="flex-1 h-6 relative overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)`,
              boxShadow: `0 0 8px ${color}80`,
            }}
          />
        </div>
        <div 
          className="w-8 text-right text-sm font-black tabular-nums"
          style={{ 
            fontFamily: 'var(--font-broadcast)',
            color: color
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}