import { getRatingColor } from '../data/mock-data';

interface OVRBadgeProps {
  ovr: number;
  size?: 'small' | 'medium' | 'large';
}

export function OVRBadge({ ovr, size = 'medium' }: OVRBadgeProps) {
  const color = getRatingColor(ovr);
  
  const dimensions = {
    small: { outer: 40, stroke: 3, text: 'text-base', label: 'text-[8px]' },
    medium: { outer: 64, stroke: 4, text: 'text-[28px]', label: 'text-[11px]' },
    large: { outer: 96, stroke: 5, text: '[42px]', label: 'text-sm' },
  };

  const { outer, stroke, text, label } = dimensions[size];

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: outer, height: outer }}
    >
      <svg 
        width={outer} 
        height={outer} 
        className="absolute"
      >
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={(outer - stroke) / 2}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <div className={`${text} font-bold text-white leading-none`}>
          {ovr}
        </div>
        <div className={`${label} font-medium text-white/60 uppercase tracking-wider mt-0.5`}>
          OVR
        </div>
      </div>
    </div>
  );
}
