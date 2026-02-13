import { useState } from 'react';
import { useParams } from 'react-router';
import { TopHeader } from '../components/TopHeader';
import { OVRBadge } from '../components/OVRBadge';
import { RatingBar } from '../components/RatingBar';
import { getPlayer } from '../data/leagueAdapter';
import { getRatingColor } from '../data/mock-data';

const tabs = ['Overview', 'Traits', 'Stats', 'Career', 'Awards'];

export function PlayerProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Get player from real data
  const playerData = id ? getPlayer(id) : null;

  if (!playerData) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-white/60">Player not found</div>
      </div>
    );
  }

  // Convert to display format
  const player = {
    id: playerData.playerId,
    name: `${playerData.firstName} ${playerData.lastName}`,
    position: playerData.position,
    archetype: playerData.archetype,
    age: playerData.age,
    ovr: playerData.ovr,
    status: playerData.status,
    contractYears: playerData.contractYears,
    ratings: playerData.ratings,
    traits: playerData.traits,
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title={player.name} />

      <div className="flex flex-col gap-3 p-4">
        {/* Player Header - Broadcast Style */}
        <div 
          className="p-4 relative overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="flex items-center gap-4">
            {/* Position Badge */}
            <div 
              className="w-20 h-20 flex items-center justify-center font-black text-2xl uppercase"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-broadcast)',
              }}
            >
              {player.position}
            </div>
            
            <div className="flex-1">
              <h2 
                className="text-xl font-black uppercase tracking-tight text-white mb-1"
                style={{ fontFamily: 'var(--font-broadcast)' }}
              >
                {player.name}
              </h2>
              <div 
                className="text-[11px] font-bold uppercase text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-broadcast)' }}
              >
                {player.archetype} • AGE {player.age}
                {player.contractYears && ` • ${player.contractYears}YR CONTRACT`}
              </div>
            </div>

            {/* OVR Display */}
            <div className="flex flex-col items-end gap-1">
              <div 
                className="text-[10px] font-bold uppercase tracking-wider text-white/50"
                style={{ fontFamily: 'var(--font-broadcast)' }}
              >
                OVERALL
              </div>
              <div 
                className="text-4xl font-black tabular-nums leading-none"
                style={{ 
                  fontFamily: 'var(--font-display)',
                  color: getRatingColor(player.ovr)
                }}
              >
                {player.ovr}
              </div>
            </div>
          </div>

          {/* Accent bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%)`
            }}
          />
        </div>

        {/* Tab Selector */}
        <div 
          className="flex items-center gap-1 p-1 overflow-x-auto"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-[11px] font-black uppercase whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'var(--font-broadcast)',
                borderBottom: activeTab === tab ? '2px solid white' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-3">
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
                className="px-4 py-3 relative"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderLeft: `4px solid ${
                    trait.type === 'positive' 
                      ? 'var(--rating-high)' 
                      : trait.type === 'negative'
                      ? 'var(--accent-danger)'
                      : 'var(--rating-mid)'
                  }`,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span 
                  className="text-[13px] font-bold text-white uppercase"
                  style={{ fontFamily: 'var(--font-broadcast)' }}
                >
                  {trait.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Stats' && (
          <div 
            className="p-6 text-center"
            style={{ 
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
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
      className="p-4 flex flex-col gap-2.5"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderLeft: '4px solid var(--accent-primary)'
      }}
    >
      <h3 
        className="text-[12px] font-black text-white uppercase tracking-wider mb-1"
        style={{ 
          fontFamily: 'var(--font-broadcast)',
          color: 'var(--accent-primary)'
        }}
      >
        {title}
      </h3>
      {Object.entries(ratings).map(([key, value]) => (
        <RatingBar key={key} label={key} value={value} />
      ))}
    </div>
  );
}