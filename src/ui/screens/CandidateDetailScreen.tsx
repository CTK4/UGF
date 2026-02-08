import React from "react";
import type { ScreenProps } from "@/ui/types";

function fmtMoney(v: number): string {
  return `$${Math.round(v).toLocaleString()}`;
}

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
        <div><b>{candidate.name}</b> • Target {role} • Primary {candidate.primaryRole}</div>
        <div><b>Traits:</b> {candidate.traits.join(", ") || "N/A"}</div>
        <div><b>Fit:</b> {candidate.fitLabel}</div>
        <div><b>Demand:</b> {fmtMoney(candidate.salaryDemand)} • <b>Recommended Offer:</b> {fmtMoney(candidate.recommendedOffer)}</div>
        <div><b>Contract Years:</b> {candidate.defaultContractYears}</div>
        <div><b>Standards:</b> {candidate.standardsNote} • Perceived risk {candidate.perceivedRisk}</div>
        <div><b>Status:</b> {candidate.availability.replaceAll("_", " ")}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "TRY_HIRE", role, candidateId: candidate.id })}>Hire</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Back to Market</button>
        </div>
      </div>
    </div>
  );
}
