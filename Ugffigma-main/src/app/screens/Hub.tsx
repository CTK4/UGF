import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { TopHeader } from '../components/TopHeader';
import { NewsCard } from '../components/NewsCard';
import { mockMatchup, mockNews } from '../data/mock-data';
import { Calendar, Clipboard, Users, TrendingUp } from 'lucide-react';

export function Hub() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Hub" showBack={false} />

      <div className="flex flex-col gap-4 p-4">
        {/* Matchup Card */}
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
                <div className="text-4xl">{mockMatchup.opponentLogo}</div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {mockMatchup.opponent}
                  </div>
                  <div className="text-xs text-white/60">Week 8 Opponent</div>
                </div>
              </div>
              <div className="text-sm font-bold text-white/80">
                {mockMatchup.location}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {mockMatchup.yourTeam}
                  </div>
                  <div className="text-xs text-white/60">Your Team</div>
                </div>
                <div className="text-4xl">{mockMatchup.yourLogo}</div>
              </div>
            </div>

            {/* Comparison Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['off', 'def', 'ovr'].map((stat) => {
                const data = mockMatchup.comparison[stat as keyof typeof mockMatchup.comparison];
                return (
                  <div key={stat} className="flex flex-col items-center gap-1">
                    <div className="text-[10px] uppercase tracking-wide text-white/60">
                      {stat}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${data.yours > data.opponent ? 'text-[#22C55E]' : 'text-white/60'}`}>
                        {data.yours}
                      </span>
                      <span className="text-white/40">vs</span>
                      <span className={`text-sm font-bold ${data.opponent > data.yours ? 'text-[#EF4444]' : 'text-white/60'}`}>
                        {data.opponent}
                      </span>
                    </div>
                  </div>
                );
              })}
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
            label="Schedule"
            onClick={() => {}}
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
      className="h-24 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:brightness-110"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="text-[#FF6B00]">{icon}</div>
      <div className="text-sm font-semibold text-white">{label}</div>
    </button>
  );
}