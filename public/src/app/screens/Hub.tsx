import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { TopHeader } from '../components/TopHeader';
import { NewsCard } from '../components/NewsCard';
import { mockNews } from '../data/mock-data';
import { Calendar, Clipboard, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useSave } from '../context/SaveProvider';
import { getTeam, getRoster, getTeamLogoPath } from '../data/leagueAdapter';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Hub() {
  const navigate = useNavigate();
  const { save } = useSave();

  // Get user's team data
  const userTeam = save.userTeamId ? getTeam(save.userTeamId) : null;
  const roster = save.userTeamId ? getRoster(save.userTeamId) : [];
  
  // Calculate team average
  const teamAvgOvr = roster.length > 0 
    ? Math.round(roster.reduce((sum, p) => sum + p.ovr, 0) / roster.length)
    : 0;

  // Mock opponent for now
  const opponentTeam = getTeam('ATL');

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Hub" showBack={false} />

      <div className="flex flex-col gap-4 p-4">
        {/* Staff Meeting CTA */}
        {!save.staffMeetingCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => navigate('/staff-meeting')}
              className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all hover:brightness-110"
              style={{ backgroundColor: '#DC2626' }}
            >
              <AlertCircle className="w-6 h-6 text-white" />
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-white">Action Required</div>
                <div className="text-xs text-white/90">Complete weekly staff meeting to advance</div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Matchup Card */}
        {userTeam && opponentTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1B2433 0%, #0B0F16 100%)',
              }}
            >
              {/* Matchup Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={getTeamLogoPath(opponentTeam.logoKey)}
                    alt={opponentTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <div className="text-lg font-bold text-white">
                      {opponentTeam.name}
                    </div>
                    <div className="text-xs text-white/60">Week {save.league.week} Opponent</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-white/80">
                  AT
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {userTeam.name}
                    </div>
                    <div className="text-xs text-white/60">Your Team</div>
                  </div>
                  <ImageWithFallback
                    src={getTeamLogoPath(userTeam.logoKey)}
                    alt={userTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { stat: 'off', yours: userTeam.off, opponent: opponentTeam.off },
                  { stat: 'def', yours: userTeam.def, opponent: opponentTeam.def },
                  { stat: 'ovr', yours: userTeam.ovr, opponent: opponentTeam.ovr },
                ].map(({ stat, yours, opponent }) => (
                  <div key={stat} className="flex flex-col items-center gap-1">
                    <div className="text-[10px] uppercase tracking-wide text-white/60">
                      {stat}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${yours > opponent ? 'text-[#22C55E]' : 'text-white/60'}`}>
                        {yours}
                      </span>
                      <span className="text-white/40">vs</span>
                      <span className={`text-sm font-bold ${opponent > yours ? 'text-[#EF4444]' : 'text-white/60'}`}>
                        {opponent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/game')}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Set Gameplan
              </button>
            </div>
          </motion.div>
        )}

        {/* Weekly Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <ActionButton
            icon={<Users className="w-5 h-5" />}
            label="Roster"
            onClick={() => navigate('/roster')}
          />
          <ActionButton
            icon={<Clipboard className="w-5 h-5" />}
            label="Draft"
            onClick={() => navigate('/draft')}
          />
          <ActionButton
            icon={<Calendar className="w-5 h-5" />}
            label="Staff"
            onClick={() => navigate('/staff')}
          />
          <ActionButton
            icon={<TrendingUp className="w-5 h-5" />}
            label="Analytics"
            onClick={() => {}}
          />
        </motion.div>

        {/* News Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <h3 className="text-lg font-bold text-white px-1">Latest News</h3>
          {mockNews.map((news, index) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <NewsCard news={news} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function ActionButton({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-20 p-3 flex flex-col items-center justify-center gap-2 transition-all hover:brightness-110 relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255, 107, 0, 0.2)'
      }}
    >
      <div style={{ color: 'var(--accent-primary)' }}>{icon}</div>
      <div 
        className="text-[11px] font-black uppercase tracking-wider text-white"
        style={{ fontFamily: 'var(--font-broadcast)' }}
      >
        {label}
      </div>
      {/* Accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.5 }}
      />
    </button>
  );
}