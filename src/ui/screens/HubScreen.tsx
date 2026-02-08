import React from "react";
import type { ScreenProps } from "@/ui/types";

export function HubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const gs = save.gameState;

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
          {gs.tasks.map((task) => <button key={task.id} disabled={task.completed} onClick={() => ui.dispatch({ type: "COMPLETE_TASK", taskId: task.id })}>{task.completed ? "✓ " : ""}{task.title}</button>)}
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
