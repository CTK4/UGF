import React from "react";
import type { ScreenProps } from "@/ui/types";
import { getProspectLabel } from "@/services/draftDiscovery";

export function HubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const gs = save.gameState;

  const discoveredEntries = Object.entries(gs.draft.discovered).sort((a, b) => a[1].level - b[1].level || a[0].localeCompare(b[0]));

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hub</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill">Week {gs.time.week} • {gs.phase}</div>
        <div className="ugf-pill">Label: {gs.time.label}</div>
        <div>Coach: <b>{gs.coach.name || "Unnamed"}</b></div>
        <div>Franchise: {gs.franchise.ugfTeamKey || "Not selected"}</div>

        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Tasks</b>
          {gs.tasks.length === 0 && <div>No tasks available this week.</div>}
          {gs.tasks.map((task) => (
            <div key={task.id} className="ugf-card" style={{ opacity: task.status === "DONE" ? 0.7 : 1 }}>
              <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                <div><b>{task.status === "DONE" ? "✓ " : ""}{task.title}</b></div>
                <div>{task.description}</div>
                {task.routeHint && <small>Hint: {task.routeHint}</small>}
                <button disabled={task.status === "DONE"} onClick={() => ui.dispatch({ type: "COMPLETE_TASK", taskId: task.id })}>
                  {task.status === "DONE" ? "Completed" : "Complete"}
                </button>
              </div>
            </div>
          ))}
        </div></div>


        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Draft Discovery</b>
          <div><small>Watchlist ({gs.draft.watchlist.length})</small></div>
          {gs.draft.watchlist.length === 0 && <div>No prospects watched yet.</div>}
          {gs.draft.watchlist.map((prospectId) => (
            <div key={`watch-${prospectId}`}>• {getProspectLabel(prospectId)}</div>
          ))}

          <div style={{ marginTop: 6 }}><small>Discovered Prospects ({discoveredEntries.length})</small></div>
          {discoveredEntries.length === 0 && <div>No scouting reports yet.</div>}
          {discoveredEntries.map(([prospectId, report]) => (
            <div key={prospectId} className="ugf-card">
              <div className="ugf-card__body" style={{ display: "grid", gap: 4 }}>
                <div><b>{getProspectLabel(prospectId)}</b></div>
                <div>Discovery Level: {report.level}/3</div>
                <small>{report.notes}</small>
              </div>
            </div>
          ))}
        </div></div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Staff Tree</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Phone</button>
          <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
        </div>
      </div>
    </div>
  );
}
