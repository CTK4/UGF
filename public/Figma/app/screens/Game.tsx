import { TopHeader } from '../components/TopHeader';
import { PlayTile } from '../components/PlayTile';
import { mockPlays } from '../data/mock-data';
import { Pause, RotateCcw } from 'lucide-react';

export function Game() {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Gameplan" />

      <div className="flex flex-col gap-4 p-4">
        {/* Scoreboard */}
        <div 
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-white/60">Ravens</div>
              <div className="text-2xl font-bold text-white">24</div>
            </div>
            <div className="text-white/40">-</div>
            <div className="text-center">
              <div className="text-xs text-white/60">Patriots</div>
              <div className="text-2xl font-bold text-white">17</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60">Q3</div>
            <div className="text-lg font-bold text-white">8:42</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60">Down & Dist</div>
            <div className="text-sm font-bold text-white">2nd & 7</div>
          </div>
        </div>

        {/* Field Position */}
        <div 
          className="rounded-xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/60">Field Position</div>
            <div className="text-sm font-bold text-white">OPP 35</div>
          </div>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '65%',
                backgroundColor: 'var(--accent-success)',
              }}
            />
          </div>
        </div>

        {/* Play Selection Grid */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3 px-1">
            Select Play
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {mockPlays.map((play) => (
              <PlayTile key={play.id} play={play} />
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="grid grid-cols-3 gap-3">
          <button
            className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <Pause className="w-4 h-4 text-white" />
            <span className="text-sm text-white">Timeout</span>
          </button>
          <button
            className="py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Auto Delegate
          </button>
          <button
            className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span className="text-sm text-white">Sim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
