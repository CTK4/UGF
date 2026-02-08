import React from "react";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";

export function CandidateDetailScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "CandidateDetail") return null;
  const role = state.route.role;
  const session = marketByWeekFor(save.gameState)[`${save.gameState.time.season}-${save.gameState.time.week}:${role}`];
  const candidate = session.candidates.find((c) => c.id === state.route.candidateId);
  if (!candidate) return null;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Candidate Detail</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div><b>{candidate.name}</b></div>
        <div>Demand: ${candidate.salaryDemand.toLocaleString()}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "TRY_HIRE", role, candidateId: candidate.id })}>Hire</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back</button>
        </div>
      </div>
    </div>
  );
}
