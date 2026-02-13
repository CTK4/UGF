import { useNavigate } from 'react-router';
import { useSave } from '../context/SaveProvider';
import { TopHeader } from '../components/TopHeader';
import { Button } from '../components/ui/button';
import { Users } from 'lucide-react';

export function StaffMeeting() {
  const navigate = useNavigate();
  const { setSave } = useSave();

  const handleComplete = () => {
    setSave((prev) => ({
      ...prev,
      staffMeetingCompleted: true,
    }));
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Staff Meeting" />

      <div className="p-4">
        <div 
          className="rounded-2xl p-6 flex flex-col items-center gap-6"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Users className="w-10 h-10 text-white" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-3">
              Weekly Staff Meeting
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              Your coordinators and position coaches have prepared reports on player development, 
              game planning, and upcoming opponents. Review the briefing materials and set your 
              priorities for the week ahead.
            </p>
          </div>

          <div 
            className="w-full rounded-xl p-4 space-y-3"
            style={{ backgroundColor: '#0B0F16' }}
          >
            <MeetingTopic title="Offensive Game Plan" status="Reviewed" />
            <MeetingTopic title="Defensive Adjustments" status="Reviewed" />
            <MeetingTopic title="Special Teams" status="Reviewed" />
            <MeetingTopic title="Injury Updates" status="Reviewed" />
          </div>

          <Button
            onClick={handleComplete}
            className="w-full py-6 font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Complete Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

function MeetingTopic({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{title}</span>
      <span className="text-xs font-semibold text-[#22C55E]">{status}</span>
    </div>
  );
}
