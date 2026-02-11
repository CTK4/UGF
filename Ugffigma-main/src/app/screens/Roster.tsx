import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopHeader } from '../components/TopHeader';
import { PlayerRow } from '../components/PlayerRow';
import { OVRBadge } from '../components/OVRBadge';
import { mockPlayers } from '../data/mock-data';

const tabs = ['Roster', 'Depth', 'Contracts', 'Stats', 'History'];

export function Roster() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Roster');

  // Calculate team averages
  const avgOvr = Math.round(mockPlayers.reduce((sum, p) => sum + p.ovr, 0) / mockPlayers.length);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Team Roster" />

      <div className="flex flex-col gap-4 p-4">
        {/* OVR Summary */}
        <div 
          className="rounded-2xl p-4 flex items-center justify-around"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex flex-col items-center">
            <OVRBadge ovr={avgOvr} size="medium" />
            <div className="text-xs font-medium text-white/60 mt-2">Team AVG</div>
          </div>
          <div className="flex flex-col gap-2">
            <StatRow label="Offense" value={85} />
            <StatRow label="Defense" value={79} />
            <StatRow label="Special" value={74} />
          </div>
        </div>

        {/* Tab Selector */}
        <div 
          className="flex items-center gap-2 p-1 rounded-xl overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Player List */}
        <div className="flex flex-col gap-2">
          {mockPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              onClick={() => navigate(`/player/${player.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs font-medium text-white/80">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
