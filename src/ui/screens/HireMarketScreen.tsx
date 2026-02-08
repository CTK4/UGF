import React from "react";
import { STAFF_ROLE_LABELS } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

const money = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

export function HireMarketScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "HireMarket") return null;
  const role = state.route.role;
  const weekKey = `${save.league.season}-${save.league.week}`;
  const marketKey = `${weekKey}:${role}`;
  const session = save.market.byWeek[marketKey];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire Market / {STAFF_ROLE_LABELS[role]}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "REFRESH_MARKET", role })}>Refresh Market</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Back</button>
        </div>
        {(session?.candidates ?? []).map((c) => (
          <button key={c.id} style={{ textAlign: "left" }} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CandidateDetail", role, candidateId: c.id } })}>
            <div><strong>{c.name}</strong> • {c.primaryRole}</div>
            <div style={{ opacity: 0.8 }}>{c.fitLabel} • Demand: {money(c.salaryDemand)} • <span className="ugf-pill">{c.availability.replaceAll("_", " ")}</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}
