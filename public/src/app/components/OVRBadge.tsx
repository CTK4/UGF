import { getRatingColor } from '../data/mock-data';

interface OVRBadgeProps {
  ovr: number;
  size?: 'small' | 'medium' | 'large';
}

export function OVRBadge({ ovr, size = 'medium' }: OVRBadgeProps) {
  const color = getRatingColor(ovr);
  
  const dimensions = {
    small: { outer: 48, stroke: 3, text: 'text-xl', label: 'text-[9px]' },
    medium: { outer: 72, stroke: 4, text: 'text-[32px]', label: 'text-[11px]' },
    large: { outer: 96, stroke: 5, text: 'text-[42px]', label: 'text-xs' },
  };

  const { outer, stroke, text, label } = dimensions[size];

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: outer, height: outer }}
    >
      {/* Background circle */}
      <svg 
        width={outer} 
        height={outer} 
        className="absolute"
      >
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={(outer - stroke) / 2}
          fill="rgba(0, 0, 0, 0.5)"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={(outer - stroke) / 2}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          style={{
            filter: `drop-shadow(0 0 4px ${color})`
          }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <div 
          className={`${text} font-black leading-none tabular-nums`}
          style={{ 
            fontFamily: 'var(--font-display)',
            color: color
          }}
        >
          {ovr}
        </div>
        <div 
          className={`${label} font-black uppercase tracking-wider mt-0.5`}
          style={{ 
            fontFamily: 'var(--font-broadcast)',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          OVR
        </div>
      </div>
    </div>
  );
}