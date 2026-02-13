import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSave } from '../context/SaveProvider';
import { TopHeader } from '../components/TopHeader';
import { getTeam, getTeamLogoPath } from '../data/leagueAdapter';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const OFFER_TEAMS = ['BIR', 'MIL', 'ATL'];

interface Offer {
  teamId: string;
  years: number;
  salary: number;
}

const OFFERS: Offer[] = [
  { teamId: 'BIR', years: 5, salary: 7500000 },
  { teamId: 'MIL', years: 4, salary: 4500000 },
  { teamId: 'ATL', years: 4, salary: 6000000 },
];

export function Offers() {
  const navigate = useNavigate();
  const { setSave } = useSave();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const handleAcceptOffer = () => {
    if (!selectedTeamId) {
      alert('Please select a team first');
      return;
    }

    // Set user's team and navigate to Hub
    setSave((prev) => ({
      ...prev,
      userTeamId: selectedTeamId,
    }));

    navigate('/');
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Contract Offers" showBack={false} />

      <div className="p-4">
        <div 
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-white/80 text-sm leading-relaxed">
            All three teams have extended contract offers. Select the opportunity that best fits your vision.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {OFFERS.map((offer) => {
            const team = getTeam(offer.teamId);
            if (!team) return null;

            const isSelected = selectedTeamId === offer.teamId;

            return (
              <button
                key={offer.teamId}
                onClick={() => setSelectedTeamId(offer.teamId)}
                className="rounded-2xl p-4 text-left transition-all"
                style={{ 
                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  opacity: isSelected ? 1 : 0.8,
                }}
              >
                <div className="flex items-center justify-between mb-3">
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
                  {isSelected && <CheckCircle2 className="w-6 h-6 text-white" />}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Contract Length</div>
                    <div className="text-lg font-bold text-white">{offer.years} Years</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">Annual Salary</div>
                    <div className="text-lg font-bold text-white">
                      ${(offer.salary / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleAcceptOffer}
          disabled={!selectedTeamId}
          className="w-full py-6 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Accept Offer & Start Career
        </Button>
      </div>
    </div>
  );
}
