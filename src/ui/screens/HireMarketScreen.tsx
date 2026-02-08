import React from "react";
import { STAFF_ROLE_LABELS } from "@/domain/staffRoles";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";

export function HireMarketScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "HireMarket") return null;
  const role = state.route.role;
  const session = marketByWeekFor(save.gameState)[`${save.gameState.time.season}-${save.gameState.time.beatIndex}:${role}`];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire Market / {STAFF_ROLE_LABELS[role]}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {session.candidates.map((c) => <button key={c.id} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CandidateDetail", role, candidateId: c.id } })}>{c.name} • ${c.salaryDemand.toLocaleString()}</button>)}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Back</button>
      </div>
    </div>
  );
}
