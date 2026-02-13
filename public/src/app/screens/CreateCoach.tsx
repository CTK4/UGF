import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSave } from '../context/SaveProvider';
import { TopHeader } from '../components/TopHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function CreateCoach() {
  const navigate = useNavigate();
  const { setSave } = useSave();
  const [coachName, setCoachName] = useState('');
  const [coachAge, setCoachAge] = useState<number>(35);
  const [hometown, setHometown] = useState('');
  const [personality, setPersonality] = useState('balanced');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coachName.trim()) {
      alert('Please enter a coach name');
      return;
    }

    // Create new save with coach data
    setSave({
      userCharacterId: `COACH_${Date.now()}`,
      coach: {
        name: coachName,
        age: coachAge,
        hometown: hometown || 'Unknown',
        personality,
      },
      league: {
        season: 2026,
        week: 1,
        phase: 'preseason',
      },
      onboarding: {
        interviewsCompleted: [],
      },
      staffMeetingCompleted: false,
    });

    navigate('/interviews');
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Create Your Coach" showBack={false} />

      <div className="p-4">
        <div 
          className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Coach Profile</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="coach-name" className="text-white/80 text-sm font-medium">
                Name *
              </Label>
              <Input
                id="coach-name"
                type="text"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                placeholder="Enter your name"
                className="bg-[#0B0F16] border-white/10 text-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="coach-age" className="text-white/80 text-sm font-medium">
                Age
              </Label>
              <Select value={String(coachAge)} onValueChange={(val) => setCoachAge(Number(val))}>
                <SelectTrigger className="bg-[#0B0F16] border-white/10 text-white">
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B2433] border-white/10">
                  {Array.from({ length: 30 }, (_, i) => i + 30).map((age) => (
                    <SelectItem key={age} value={String(age)} className="text-white hover:bg-white/10">
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hometown" className="text-white/80 text-sm font-medium">
                Hometown
              </Label>
              <Input
                id="hometown"
                type="text"
                value={hometown}
                onChange={(e) => setHometown(e.target.value)}
                placeholder="Optional"
                className="bg-[#0B0F16] border-white/10 text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="personality" className="text-white/80 text-sm font-medium">
                Coaching Style
              </Label>
              <Select value={personality} onValueChange={setPersonality}>
                <SelectTrigger className="bg-[#0B0F16] border-white/10 text-white">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent className="bg-[#1B2433] border-white/10">
                  <SelectItem value="aggressive" className="text-white hover:bg-white/10">
                    Aggressive
                  </SelectItem>
                  <SelectItem value="balanced" className="text-white hover:bg-white/10">
                    Balanced
                  </SelectItem>
                  <SelectItem value="conservative" className="text-white hover:bg-white/10">
                    Conservative
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full mt-4 py-6 font-semibold text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Continue to Interviews
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
