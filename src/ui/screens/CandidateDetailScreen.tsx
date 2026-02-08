import React from "react";
import { STAFF_ROLE_LABELS } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

const money = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

export function CandidateDetailScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "CandidateDetail") return null;
  const role = state.route.role;
  const weekKey = `${save.league.season}-${save.league.week}`;
  const session = save.market.byWeek[`${weekKey}:${role}`];
  const candidate = session?.candidates.find((c) => c.id === state.route.candidateId);
  if (!candidate) return <div className="ugf-card"><div className="ugf-card__body">Candidate not found.</div></div>;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Candidate Detail</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div><b>{candidate.name}</b> • Primary: {STAFF_ROLE_LABELS[candidate.primaryRole]} • Target: {STAFF_ROLE_LABELS[candidate.targetRole]}</div>
        <div><b>Traits:</b> {candidate.traits.join(", ") || "None listed"}</div>
        <div><b>Philosophy:</b> {candidate.philosophy}</div>
        <div><b>Fit:</b> {candidate.fitLabel}</div>
        <div><b>Status:</b> {candidate.availability.replaceAll("_", " ")}</div>
        <div><b>Demand:</b> {money(candidate.salaryDemand)} • <b>Recommended:</b> {money(candidate.recommendedOffer)}</div>
        <div><b>Contract:</b> {candidate.contractYears} years</div>
        <div><b>Standards:</b> {candidate.standardsNote} • Risk {candidate.perceivedRisk}%</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "TRY_HIRE", role, candidateId: candidate.id })}>Hire (Locks decision this week)</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back to Market</button>
        </div>
      </div>
    </div>
  );
}
