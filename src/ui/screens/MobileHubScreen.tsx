import type { ScreenProps } from "@/ui/types";
import {
  FocusCard,
  ListRow,
  MobileTopBar,
  PrimaryActionButton,
  SecondaryActionButton,
  SectionCard,
  StatPillsRow,
} from "@/ui/mobile/components";
import { getJanuaryDayLabel } from "@/engine/calendar";
import { getMissingGates } from "@/engine/advance";

/*
Verification checklist:
- [ ] Desktop Hub behavior remains unchanged when mobile UI is not active.
- [ ] Mobile Hub appears with ?ui=mobile and at widths under 520px.
- [ ] Phone/Staff/Roster actions navigate correctly.
- [ ] Advance uses the same selector gate/dispatch path as desktop Hub.
*/
export function MobileHubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const advanceState = ui.selectors.canAdvance();

  if (!save) {
    return (
      <div className="mobile-ui" style={{ display: "grid", gap: 12, maxWidth: 430, margin: "0 auto", padding: 12 }}>
        <MobileTopBar title="Hub" />
        <SectionCard title="No Save Loaded">
          <p style={{ margin: 0 }}>Hub actions are unavailable until a save is loaded.</p>
          <SecondaryActionButton label="Back to Start" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })} />
        </SectionCard>
      </div>
    );
  }

  const gs = save.gameState;
  const missingGates = getMissingGates(gs);
  const openTasks = gs.tasks.filter((task) => task.status !== "DONE");

  return (
    <div className="mobile-ui mobile-hub-screen">
      <MobileTopBar
        title="Hub"
        rightActions={
          <>
            <span className="ugf-pill">Wk {gs.time.week}</span>
          </>
        }
      />

      <FocusCard
        title="Season Overview"
        headerRight={<span className="ugf-pill">{gs.phase.replaceAll("_", " ")}</span>}
      >
        <div className="ugf-pill">Season {gs.time.season} · Week {gs.time.week} · {getJanuaryDayLabel(gs.time.dayIndex)}</div>
        <StatPillsRow
          pills={[
            { label: "Owner Mood", value: "Neutral" },
            { label: "Hot Seat", value: "Warm" },
            { label: "GM Trust", value: "Steady" },
            { label: "Staff Tension", value: "Low" },
          ]}
        />
      </FocusCard>

      <SectionCard title="Next required task(s)">
        <div className="mobile-hub-screen__task-status">
          {advanceState.canAdvance
            ? "All required tasks complete. You can advance the calendar."
            : advanceState.message ?? "Complete required tasks to continue."}
        </div>
        {openTasks.length === 0 && !missingGates.length ? (
          <div className="mobile-hub-screen__empty">No open tasks.</div>
        ) : openTasks.length === 0 && missingGates.length ? (
          <div className="mobile-hub-screen__empty">Advance Week will prompt to auto-resolve missing requirements.</div>
        ) : (
          openTasks.slice(0, 3).map((task) => (
            <ListRow
              key={task.id}
              icon="✅"
              title={task.title}
              subtitle={task.routeHint ?? task.description}
              onClick={() => ui.dispatch({ type: "COMPLETE_TASK", taskId: task.id })}
            />
          ))
        )}
      </SectionCard>

      <SectionCard title="Primary actions">
        <ListRow title="Phone" subtitle="Open inbox" icon="📱" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })} />
        <ListRow title="Staff" subtitle="Manage coordinators" icon="🧠" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })} />
        <ListRow title="Roster" subtitle="Review players" icon="🧾" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub", tab: "roster" } })} />
        <div className="mobile-hub-screen__cta-row">
          <SecondaryActionButton label={missingGates.length ? "Resolve & Advance" : "Advance"} disabled={!advanceState.canAdvance} title={advanceState.message ?? "Advance calendar"} onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })} />
          <PrimaryActionButton label="Advance Week" disabled={!advanceState.canAdvance} title={advanceState.message ?? "Advance calendar"} onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })} />
        </div>
      </SectionCard>
    </div>
  );
}
