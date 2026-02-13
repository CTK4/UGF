import { useState } from 'react';
import { TopHeader } from '../components/TopHeader';
import { OVRBadge } from '../components/OVRBadge';
import { useSave } from '../context/SaveProvider';
import { getStaff, normalizeRole, Personnel } from '../data/leagueAdapter';

const tabs = ['Staff', 'Openings', 'Free Agents'];

export function Staff() {
  const { save } = useSave();
  const [activeTab, setActiveTab] = useState('Staff');

  if (!save.userTeamId) {
    return null;
  }

  const staff = getStaff(save.userTeamId);

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TopHeader title="Coaching Staff" />

      <div className="flex flex-col gap-4 p-4">
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

        {/* Staff List */}
        {activeTab === 'Staff' && (
          <div className="flex flex-col gap-2">
            {staff.length === 0 ? (
              <div 
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <p className="text-white/60">No staff members</p>
              </div>
            ) : (
              staff.map((member) => <StaffRow key={member.personnelId} member={member} />)
            )}
          </div>
        )}

        {activeTab === 'Openings' && (
          <div 
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <p className="text-white/60">Staff openings coming soon</p>
          </div>
        )}

        {activeTab === 'Free Agents' && (
          <div 
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <p className="text-white/60">Free agent coaches coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StaffRow({ member }: { member: Personnel }) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:brightness-110 transition-all"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <OVRBadge ovr={member.ovr} size="small" />
      
      <div className="flex-1">
        <div className="text-sm font-bold text-white">
          {member.firstName} {member.lastName}
        </div>
        <div className="text-xs text-white/60">
          {normalizeRole(member.role)} • {member.age} yrs
        </div>
      </div>

      <div className="text-right">
        <div className="text-xs text-white/60">Specialty</div>
        <div className="text-xs font-semibold text-white">{member.specialty}</div>
      </div>
    </div>
  );
}
