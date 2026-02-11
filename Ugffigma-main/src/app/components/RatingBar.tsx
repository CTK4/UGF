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
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs font-medium text-white/80">
        {label}
      </div>
      <div 
        className="flex-1 h-5 rounded-lg relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="w-8 text-right text-sm font-bold text-white">
        {value}
      </div>
    </div>
  );
}
