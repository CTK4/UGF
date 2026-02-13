import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopHeader } from '../components/TopHeader';
import { PlayerRow } from '../components/PlayerRow';
import { OVRBadge } from '../components/OVRBadge';
import { useSave } from '../context/SaveProvider';
import { getRoster, getTeam } from '../data/leagueAdapter';
import { getRatingColor } from '../data/mock-data';

const tabs = ['Roster', 'Depth', 'Contracts', 'Stats', 'History'];

export function Roster() {
  const navigate = useNavigate();
  const { save } = useSave();
  const [activeTab, setActiveTab] = useState('Roster');

  // Get real roster data
  const roster = save.userTeamId ? getRoster(save.userTeamId) : [];
  const team = save.userTeamId ? getTeam(save.userTeamId) : null;

  // Calculate team averages
  const avgOvr = roster.length > 0
    ? Math.round(roster.reduce((sum, p) => sum + p.ovr, 0) / roster.length)
    : 0;

  // Convert Player[] to the format expected by PlayerRow
  const playersForDisplay = roster.map((p) => ({
    id: p.playerId,
    name: `${p.firstName} ${p.lastName}`,
    position: p.position,
    archetype: p.archetype,
    age: p.age,
    ovr: p.ovr,
    status: p.status as 'normal' | 'injured' | 'rising' | 'declining' | undefined,
    team: team?.name,
    contractYears: p.contractYears,
    ratings: p.ratings,
    traits: p.traits,
  }));

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Team Roster" />

      <div className="flex flex-col gap-3 p-4">
        {/* Team Stats - Broadcast Style */}
        <div 
          className="p-4 relative overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 
              className="text-[12px] font-black uppercase tracking-wider"
              style={{ 
                fontFamily: 'var(--font-broadcast)',
                color: 'var(--accent-primary)'
              }}
            >
              Team Overview
            </h3>
            <div className="flex flex-col items-end">
              <div 
                className="text-[10px] font-bold uppercase tracking-wider text-white/50"
                style={{ fontFamily: 'var(--font-broadcast)' }}
              >
                AVG OVR
              </div>
              <div 
                className="text-3xl font-black tabular-nums leading-none"
                style={{ 
                  fontFamily: 'var(--font-display)',
                  color: getRatingColor(avgOvr)
                }}
              >
                {avgOvr}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <StatBar label="Offense" value={team?.off || 0} />
            <StatBar label="Defense" value={team?.def || 0} />
            <StatBar label="Special" value={74} />
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

        {/* Player List */}
        <div 
          className="flex flex-col"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {playersForDisplay.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-white/60">No players on roster</p>
            </div>
          ) : (
            playersForDisplay.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onClick={() => navigate(`/player/${player.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const percentage = value;
  const color = getRatingColor(value);

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-20 text-[10px] font-bold uppercase tracking-wider text-white/90"
        style={{ fontFamily: 'var(--font-broadcast)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2 flex-1">
        <div 
          className="flex-1 h-5 relative overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color} 0%, ${color}DD 100%)`,
              boxShadow: `0 0 8px ${color}80`,
            }}
          />
        </div>
        <div 
          className="w-8 text-right text-sm font-black tabular-nums"
          style={{ 
            fontFamily: 'var(--font-broadcast)',
            color: color
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}