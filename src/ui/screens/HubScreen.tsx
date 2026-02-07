import React from "react";
import type { ScreenProps } from "@/ui/types";
import { getFranchise } from "@/ui/data/franchises";

export function HubScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save) return null;
  const fr = getFranchise(save.franchiseId);
  const unread = save.phone.threads.reduce((a, t) => a + t.unreadCount, 0);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">{fr?.city} {fr?.name} Hub</h2>
          <div className="ugf-pill">{save.league.phase} • Week {save.league.week} • v{save.league.phaseVersion}</div>
        </div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <div className="grid-buttons">
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Staff</button>
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Phone ({unread})</button>
            <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
            {(["Contracts", "Roster", "Draft", "League"] as const).map((x) => (
              <button key={x} onClick={() => ui.dispatch({ type: "SHOW_MVP1_MODAL", feature: x })}>{x}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
