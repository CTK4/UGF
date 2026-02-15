import React, { useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { sanitizeForbiddenName } from "@/services/rosterImport";
import { UI_ID } from "@/ui/ids";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function FreeAgencyScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const [position, setPosition] = useState("ALL");
  const [minOverall, setMinOverall] = useState(55);
  const [query, setQuery] = useState("");

  if (!save) {
    return <div className="ugf-card" data-ui={UI_ID.freeAgency.root}><div className="ugf-card__body">No active save.</div></div>;
  }

  const cap = save.gameState.cap;
  const freeAgents = save.gameState.freeAgency.freeAgents;
  const positions = ["ALL", ...new Set(freeAgents.map((row) => row.position).sort((a, b) => a.localeCompare(b)))];
  const filtered = useMemo(() => freeAgents.filter((row) => {
    const positionMatch = position === "ALL" || row.position === position;
    const overallMatch = row.overall >= minOverall;
    const nameMatch = sanitizeForbiddenName(row.playerName).toLowerCase().includes(query.trim().toLowerCase());
    return positionMatch && overallMatch && nameMatch;
  }), [freeAgents, position, minOverall, query]);

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Free Agency</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill" data-ui={UI_ID.freeAgency.capSummary}>Cap Space: <b>{money(cap.capSpace)}</b> · Payroll: {money(cap.payroll)} · Cap Limit: {money(cap.capLimit)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(150px, 1fr))", gap: 8 }}>
          <label>Position<select data-ui={UI_ID.freeAgency.filterPosition} value={position} onChange={(event) => setPosition(event.target.value)}>{positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}</select></label>
          <label>Min OVR<input data-ui={UI_ID.freeAgency.filterMinOvr} type="number" min={40} max={99} value={minOverall} onChange={(event) => setMinOverall(Number(event.target.value) || 40)} /></label>
          <label>Search<input data-ui={UI_ID.freeAgency.filterSearch} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Player name" /></label>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {!filtered.length ? <div className="ugf-pill">No matching free agents.</div> : null}
          {filtered.map((row) => (
            <div key={row.id} className="ugf-card" data-ui={UI_ID.freeAgency.playerCard}>
              <div className="ugf-card__body" style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(6, minmax(60px, 1fr))", gap: 8, alignItems: "center" }}>
                <div><b>{sanitizeForbiddenName(row.playerName)}</b></div>
                <div>{row.position}</div>
                <div>OVR {row.overall}</div>
                <div>Age {row.age}</div>
                <div>{money(row.salary)}</div>
                <div>{row.years}y</div>
                <button
                  className="primary"
                  data-ui={UI_ID.freeAgency.signButton}
                  onClick={() => ui.dispatch({
                    type: "OPEN_MODAL",
                    title: `Sign ${sanitizeForbiddenName(row.playerName)}?`,
                    message: `Offer ${row.years} years at ${money(row.salary)} per year.`,
                    actions: [
                      { label: "Confirm Sign", action: { type: "SIGN_FREE_AGENT", playerId: row.id, years: row.years, salary: row.salary } },
                      { label: "Cancel", action: { type: "CLOSE_MODAL" } },
                    ],
                  })}
                >
                  Sign
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button data-ui={UI_ID.freeAgency.refreshButton} onClick={() => ui.dispatch({ type: "REFRESH_FREE_AGENCY" })}>Refresh Pool</button>
          <button data-ui={UI_ID.freeAgency.backButton} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub", tab: "roster" } })}>Back to Roster</button>
        </div>
      </div>
    </div>
  );
}
