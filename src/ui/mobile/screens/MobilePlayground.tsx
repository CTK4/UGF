import { FocusCard, ListRow, MobileTopBar, PrimaryActionButton, SecondaryActionButton, SectionCard, StatPillsRow } from "../components";

export function MobilePlayground() {
  return (
    <div className="mobile-ui" style={{ display: "grid", gap: 12, maxWidth: 430, margin: "0 auto", padding: 12 }}>
      <MobileTopBar title="Mobile Kit" rightActions={<span className="ugf-pill">Wk 8</span>} />

      <FocusCard
        title="Weekly Focus"
        opponentSlot={<div><strong>Opponent:</strong> Portland Pioneers</div>}
      >
        <StatPillsRow pills={[{ label: "Off", value: 84 }, { label: "Def", value: 79 }, { label: "Ovr", value: 82 }]} />
        <PrimaryActionButton label="Set Gameplan" onClick={() => {}} />
      </FocusCard>

      <SectionCard title="Actions">
        <ListRow title="Roster" subtitle="Manage depth chart" icon="👥" onClick={() => {}} />
        <ListRow title="Draft Board" subtitle="Review prospects" icon="📋" onClick={() => {}} />
        <SecondaryActionButton label="View More" onClick={() => {}} />
      </SectionCard>
    </div>
  );
}
