import { ChevronRight } from 'lucide-react';
import { NewsItem } from '../data/mock-data';

interface NewsCardProps {
  news: NewsItem;
  onCtaClick?: () => void;
}

export function NewsCard({ news, onCtaClick }: NewsCardProps) {
  return (
    <div 
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-white">{news.headline}</h3>
        <div className="text-xs font-medium text-white/50">{news.timestamp}</div>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">
        {news.description}
      </p>

      {news.cta && (
        <button
          onClick={onCtaClick}
          className="flex items-center justify-between px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <span className="text-sm font-semibold text-[#FF6B00]">
            {news.cta}
          </span>
          <ChevronRight className="w-4 h-4 text-[#FF6B00]" />
        </button>
      )}
    </div>
  );
}
