import { ChevronRight } from 'lucide-react';
import { NewsItem } from '../data/mock-data';

interface NewsCardProps {
  news: NewsItem;
  onCtaClick?: () => void;
}

export function NewsCard({ news, onCtaClick }: NewsCardProps) {
  return (
    <div 
      className="p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderLeft: '4px solid var(--accent-primary)'
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 
          className="text-[14px] font-black uppercase tracking-tight text-white"
          style={{ fontFamily: 'var(--font-broadcast)' }}
        >
          {news.headline}
        </h3>
        <div 
          className="text-[10px] font-bold uppercase text-white/40"
          style={{ fontFamily: 'var(--font-broadcast)' }}
        >
          {news.timestamp}
        </div>
      </div>

      <p className="text-xs text-white/70 leading-relaxed">
        {news.description}
      </p>

      {news.cta && (
        <button
          onClick={onCtaClick}
          className="flex items-center justify-between px-3 py-2 transition-all hover:brightness-110"
          style={{ 
            backgroundColor: 'rgba(255, 107, 0, 0.15)',
            border: '1px solid rgba(255, 107, 0, 0.3)'
          }}
        >
          <span 
            className="text-[11px] font-black uppercase"
            style={{ 
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-broadcast)'
            }}
          >
            {news.cta}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        </button>
      )}

      {/* Accent glow */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-1"
        style={{
          boxShadow: '0 0 8px var(--accent-primary)',
          opacity: 0.5
        }}
      />
    </div>
  );
}