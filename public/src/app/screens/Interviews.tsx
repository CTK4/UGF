import { useNavigate } from 'react-router';
import { useSave } from '../context/SaveProvider';
import { TopHeader } from '../components/TopHeader';
import { getTeam, getTeamLogoPath } from '../data/leagueAdapter';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const INTERVIEW_TEAMS = ['BIR', 'MIL', 'ATL'];

export function Interviews() {
  const navigate = useNavigate();
  const { save, setSave } = useSave();

  const handleInterview = (teamId: string) => {
    // Mark this team's interview as completed
    setSave((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        interviewsCompleted: [...prev.onboarding.interviewsCompleted, teamId],
      },
    }));
  };

  const allInterviewsCompleted = INTERVIEW_TEAMS.every((teamId) =>
    save.onboarding.interviewsCompleted.includes(teamId)
  );

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Head Coach Interviews" showBack={false} />

      <div className="p-4">
        <div 
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-white/80 text-sm leading-relaxed">
            Three teams have expressed interest in your coaching expertise. Complete all interviews to receive contract offers.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {INTERVIEW_TEAMS.map((teamId) => {
            const team = getTeam(teamId);
            if (!team) return null;

            const isCompleted = save.onboarding.interviewsCompleted.includes(teamId);

            return (
              <div
                key={teamId}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-4">
                  <ImageWithFallback
                    src={getTeamLogoPath(team.logoKey)}
                    alt={team.name}
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <div className="text-lg font-bold text-white">{team.name}</div>
                    <div className="text-sm text-white/60 capitalize">
                      {team.tier} Team • OVR {team.ovr}
                    </div>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-2 text-[#22C55E]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">Done</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleInterview(teamId)}
                    className="px-4 py-2 font-semibold text-white"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    Interview
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {allInterviewsCompleted && (
          <Button
            onClick={() => navigate('/offers')}
            className="w-full mt-6 py-6 font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            View Contract Offers
          </Button>
        )}
      </div>
    </div>
  );
}
