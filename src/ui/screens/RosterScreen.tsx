import React, { useEffect, useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { sanitizeForbiddenName } from "@/services/rosterImport";
import { getPlayers } from "@/data/leagueDb";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "OL" | "DL" | "LB" | "DB" | "ST";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function toPositionGroup(pos: string): PositionFilter {
  const key = String(pos || "").toUpperCase();
  if (["QB"].includes(key)) return "QB";
  if (["RB", "FB"].includes(key)) return "RB";
  if (["WR"].includes(key)) return "WR";
  if (["TE"].includes(key)) return "TE";
  if (["LT", "LG", "C", "RG", "RT", "OL"].includes(key)) return "OL";
  if (["DE", "DT", "NT", "DL"].includes(key)) return "DL";
  if (["LB", "ILB", "OLB", "MLB"].includes(key)) return "LB";
  if (["CB", "S", "SS", "FS", "DB"].includes(key)) return "DB";
  if (["K", "P", "LS", "ST"].includes(key)) return "ST";
  return "ALL";
}

export function RosterScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const [filter, setFilter] = useState<PositionFilter>("ALL");
  const [showReleased, setShowReleased] = useState(false);

  useEffect(() => {
    if (save) {
      ui.dispatch({ type: "INIT_ROSTER_DATA" });
    }
  }, [save, ui]);

  if (!save) {
    return <div className="ugf-card"><div className="ugf-card__body">Roster unavailable without an active save.</div></div>;
  }

  const players = Object.values(save.gameState.roster?.players ?? {});
  const pendingById = new Set(getPlayers().filter((p) => String(p.status ?? "").toUpperCase() === "PENDING_FREE_AGENT").map((p) => String(p.playerId)));
  const warning = save.gameState.roster?.warning;
  const cap = save.gameState.cap;

  const rows = useMemo(() => {
    return players
      .filter((player) => (showReleased ? true : player.status !== "RELEASED"))
      .filter((player) => (filter === "ALL" ? true : toPositionGroup(player.pos) === filter))
      .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
  }, [filter, players, showReleased]);

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Roster</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill">Cap Limit: {money(cap.capLimit)} · Payroll: {money(cap.payroll)} · Cap Space: <b>{money(cap.capSpace)}</b></div>
        {warning ? <div className="ugf-card"><div className="ugf-card__body">{warning}</div></div> : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            Position:&nbsp;
            <select value={filter} onChange={(event) => setFilter(event.target.value as PositionFilter)}>
              {["ALL", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "ST"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={showReleased} onChange={(event) => setShowReleased(event.target.checked)} /> Show Released
          </label>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
        </div>

        {!rows.length ? <div>No players found for the active roster.</div> : null}
        {rows.map((player) => (
          <div key={player.id} className="ugf-card">
            <div className="ugf-card__body" style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(7, minmax(70px, 1fr)) 120px", gap: 8, alignItems: "center" }}>
              <div>
                <b>{sanitizeForbiddenName(player.name)}{pendingById.has(player.id) ? " (Pending FA)" : ""}</b>
                {player.status === "RELEASED" ? <span className="ugf-pill" style={{ marginLeft: 8 }}>Released</span> : null}
              </div>
              <div>{player.pos}</div>
              <div>OVR {player.overall}</div>
              <div>Age {player.age}</div>
              <div>{player.yearsLeft} yrs</div>
              <div>{money(player.salary)}</div>
              <div>{money(player.capHit)}</div>
              <div>{player.status}</div>
              <button
                className="danger"
                disabled={player.status === "RELEASED"}
                onClick={() => ui.dispatch({ type: "PROMPT_RELEASE_PLAYER", playerId: player.id })}
              >
                Release
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
