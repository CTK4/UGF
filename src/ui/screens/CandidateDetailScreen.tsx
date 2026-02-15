import React from "react";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";
import { UI_ID } from "@/ui/ids";

function axesLabel(axes: Array<"SCHEME" | "ASSISTANTS"> = []): string {
  const hasScheme = axes.includes("SCHEME");
  const hasAssistants = axes.includes("ASSISTANTS");
  if (hasScheme && hasAssistants) return "Scheme + Assistants";
  if (hasScheme) return "Scheme";
  if (hasAssistants) return "Assistants";
  return "Scheme";
}

export function CandidateDetailScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "CandidateDetail") return null;

  const role = state.route.role;
  const session = marketByWeekFor(save.gameState)[`${save.gameState.time.season}-${save.gameState.time.week}:${role}`];
  const candidate = session?.candidates?.find((entry) => entry.id === state.route.candidateId);

  if (!candidate) {
    return (
      <div className="ugf-card" data-ui={UI_ID.candidateDetail.root}>
        <div className="ugf-card__body figma-shell">
          <div className="ugf-pill">Candidate unavailable. Return to market.</div>
          <button data-ui={UI_ID.candidateDetail.backButton} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back</button>
        </div>
      </div>
    );
  }

  const requirement = candidate.requirement ?? {};

  return (
    <div className="ugf-card" data-ui={UI_ID.candidateDetail.root}>
      <div className="ugf-card__header"><h2 className="ugf-card__title">Candidate Detail</h2></div>
      <div className="ugf-card__body figma-shell">
        <div className="ugf-card">
          <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
            <b>{candidate.name ?? "Unknown Candidate"}</b>
            <div className="ugf-pill">Demand: ${Number(candidate.salaryDemand ?? 0).toLocaleString()}</div>
            {requirement.locksOnHire ? <small>Locks on hire: {axesLabel(requirement.lockAxes ?? [])}</small> : <small>Flexible working style.</small>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button data-ui={UI_ID.candidateDetail.hireButton} onClick={() => ui.dispatch({ type: "TRY_HIRE", role, candidateId: candidate.id })}>Hire Candidate</button>
          <button data-ui={UI_ID.candidateDetail.backButton} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back</button>
        </div>
      </div>
    </div>
  );
}
