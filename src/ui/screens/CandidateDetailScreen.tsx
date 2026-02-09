import React from "react";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";

function axesLabel(axes: Array<"SCHEME" | "ASSISTANTS"> = []): string {
  const hasScheme = axes.includes("SCHEME");
  const hasAssistants = axes.includes("ASSISTANTS");
  if (hasScheme && hasAssistants) return "Scheme + Assistants";
  if (hasScheme) return "Scheme";
  if (hasAssistants) return "Assistants";
  return "Scheme";
}

function badgeLabel(requirement: { minScheme?: number; minAssistants?: number; locksOnHire?: boolean; reason?: string }) {
  if (requirement.locksOnHire) return "High Control";
  if (!requirement.minScheme && !requirement.minAssistants && String(requirement.reason ?? "").includes("collaborative")) return "Collaborative";
  if (requirement.minScheme && !requirement.minAssistants) return "Scheme-Only";
  if (!requirement.minScheme && requirement.minAssistants) return "Staff-Only";
  return "Neutral";
}

export function CandidateDetailScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "CandidateDetail") return null;
  const role = state.route.role;
  const session = marketByWeekFor(save.gameState)[`${save.gameState.time.season}-${save.gameState.time.beatIndex}:${role}`];
  const candidate = session.candidates.find((c) => c.id === state.route.candidateId);
  if (!candidate) return null;
  const requirement = candidate.requirement ?? {};

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Candidate Detail</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div><b>{candidate.name}</b></div>
        <div>Demand: ${candidate.salaryDemand.toLocaleString()}</div>
        <div className="ugf-pill">{badgeLabel(requirement)}</div>
        {requirement.locksOnHire ? <div><small>Locks: {axesLabel(requirement.lockAxes ?? [])}</small></div> : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "TRY_HIRE", role, candidateId: candidate.id })}>Hire</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back</button>
        </div>
      </div>
    </div>
  );
}
