import { useState } from 'react';
import { useParams } from 'react-router';
import { TopHeader } from '../components/TopHeader';
import { OVRBadge } from '../components/OVRBadge';
import { RatingBar } from '../components/RatingBar';
import { mockPlayers } from '../data/mock-data';

const tabs = ['Overview', 'Traits', 'Stats', 'Career', 'Awards'];

export function PlayerProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  
  const player = mockPlayers.find((p) => p.id === id) || mockPlayers[0];

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title={player.name} />

      <div className="flex flex-col gap-4 p-4">
        {/* Player Header */}
        <div 
          className="rounded-2xl p-6 flex flex-col items-center gap-3"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <OVRBadge ovr={player.ovr} size="large" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
            <div className="text-sm text-white/60 mt-1">
              {player.position} • {player.team || 'Free Agent'}
            </div>
            {player.contractYears && (
              <div className="text-xs text-white/50 mt-1">
                {player.contractYears} years remaining
              </div>
            )}
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

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-4">
            {player.ratings?.physical && (
              <RatingSection title="Physical" ratings={player.ratings.physical} />
            )}
            {player.ratings?.mental && (
              <RatingSection title="Mental" ratings={player.ratings.mental} />
            )}
            {player.ratings?.technical && (
              <RatingSection title="Technical" ratings={player.ratings.technical} />
            )}
          </div>
        )}

        {activeTab === 'Traits' && player.traits && (
          <div className="flex flex-col gap-2">
            {player.traits.map((trait, index) => (
              <div
                key={index}
                className="px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 
                    trait.type === 'positive' 
                      ? 'rgba(34, 197, 94, 0.15)' 
                      : trait.type === 'negative'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(250, 204, 21, 0.15)',
                  borderLeft: `4px solid ${
                    trait.type === 'positive' 
                      ? 'var(--rating-high)' 
                      : trait.type === 'negative'
                      ? 'var(--accent-danger)'
                      : 'var(--rating-mid)'
                  }`,
                }}
              >
                <span className="text-sm font-medium text-white">{trait.text}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Stats' && (
          <div 
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <p className="text-white/60">Season stats coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingSection({ title, ratings }: { title: string; ratings: Record<string, number> }) {
  return (
    <div 
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
      {Object.entries(ratings).map(([key, value]) => (
        <RatingBar key={key} label={key} value={value} />
      ))}
    </div>
  );
}
