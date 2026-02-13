import { useState, useEffect } from 'react';
import { TopHeader } from '../components/TopHeader';
import { PlayerRow } from '../components/PlayerRow';
import { OVRBadge } from '../components/OVRBadge';
import { RatingBar } from '../components/RatingBar';
import { mockDraftProspects } from '../data/mock-data';
import { Clock } from 'lucide-react';

export function Draft() {
  const [selectedProspect, setSelectedProspect] = useState(mockDraftProspects[0]);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercentage = (timeRemaining / 180) * 100;

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Draft War Room" />

      <div className="flex flex-col gap-4 p-4">
        {/* Draft Info */}
        <div 
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-white/60">Round 2 • Pick 15</div>
              <div className="text-xl font-bold text-white">Your Pick</div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B00]" />
              <div className="text-lg font-bold text-white">{formatTime(timeRemaining)}</div>
            </div>
          </div>

          {/* Timer Bar */}
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full transition-all duration-1000"
              style={{
                width: `${timePercentage}%`,
                backgroundColor: timePercentage > 30 ? 'var(--accent-success)' : 'var(--accent-danger)',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prospect List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide px-1">
              Available Prospects
            </h3>
            {mockDraftProspects.map((prospect) => (
              <PlayerRow
                key={prospect.id}
                player={prospect}
                variant={selectedProspect.id === prospect.id ? 'selected' : 'normal'}
                onClick={() => setSelectedProspect(prospect)}
              />
            ))}
          </div>

          {/* Prospect Detail */}
          <div 
            className="rounded-2xl p-4 flex flex-col gap-4"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="flex items-center gap-4">
              <OVRBadge ovr={selectedProspect.ovr} size="medium" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{selectedProspect.name}</h3>
                <div className="text-sm text-white/60">
                  {selectedProspect.position} • {selectedProspect.archetype}
                </div>
                <div className="text-xs text-white/50">Age {selectedProspect.age}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Projected Ratings
              </h4>
              <RatingBar label="Speed" value={82} />
              <RatingBar label="Strength" value={78} />
              <RatingBar label="Awareness" value={75} />
            </div>

            <button
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Select Player
            </button>
          </div>
        </div>

        {/* Live Ticker */}
        <div 
          className="rounded-xl p-3"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="text-xs font-medium text-white/60">
            <span className="text-[#FF6B00]">LIVE:</span> Pick 14: Patriots select CB Marcus Williams
          </div>
        </div>
      </div>
    </div>
  );
}
