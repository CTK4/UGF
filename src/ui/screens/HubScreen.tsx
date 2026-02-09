import React from "react";
import type { ScreenProps } from "@/ui/types";
import { getProspectLabel } from "@/services/draftDiscovery";
import { getSuggestedNeed } from "@/engine/scouting";
import { FRANCHISES } from "@/ui/data/franchises";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { TeamIcon } from "@/ui/components/TeamIcon";

export function HubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const gs = save.gameState;

  const discoveredEntries = Object.entries(gs.draft.discovered).sort((a, b) => a[1].level - b[1].level || a[0].localeCompare(b[0]));

  const standingsRows = ui.selectors.table("Team Summary");
  const standingsIconSize = typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches ? 64 : 48;
  const standingsSnapshot = FRANCHISES.map((franchise) => {
    const row = standingsRows.find((entry) => String(entry.Team ?? "").trim() === franchise.id) as Record<string, unknown> | undefined;
    const wins = Number(row?.Wins ?? row?.W ?? 0);
    const losses = Number(row?.Losses ?? row?.L ?? 0);
    return {
      id: franchise.id,
      teamKey: normalizeExcelTeamKey(franchise.fullName),
      name: franchise.fullName,
      wins,
      losses,
      winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
    };
  }).sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.name.localeCompare(b.name)).slice(0, 8);


  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hub</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill">{gs.time.season} · {gs.time.label}</div>
        <div className="ugf-pill">Week {gs.time.week} • Phase: {gs.phase}</div>
        <div>Coach: <b>{gs.coach.name || "Unnamed"}</b></div>
        <div>Franchise: {gs.franchise.ugfTeamKey || "Not selected"}</div>

        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Tasks</b>
          {gs.tasks.length === 0 && <div>No tasks available this week.</div>}
          {gs.tasks.map((task) => (
            <div key={task.id} className="ugf-card" style={{ opacity: task.status === "DONE" ? 0.7 : 1 }}>
              <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                <div><b>{task.status === "DONE" ? "✓ " : ""}{task.title}</b></div>
                <div>{task.description}</div>
                {task.type === "SCOUT_POSITION" && <small>Suggested Need: {getSuggestedNeed(gs) ?? "N/A"}</small>}
                {task.routeHint && <small>Hint: {task.routeHint}</small>}
                <button disabled={task.status === "DONE"} onClick={() => ui.dispatch({ type: "COMPLETE_TASK", taskId: task.id })}>
                  {task.status === "DONE" ? "Completed" : "Complete"}
                </button>
              </div>
            </div>
          ))}
        </div></div>


        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Draft Discovery</b>
          <div><small>Watchlist ({gs.draft.watchlist.length})</small></div>
          {gs.draft.watchlist.length === 0 && <div>No prospects watched yet.</div>}
          {gs.draft.watchlist.map((prospectId) => (
            <div key={`watch-${prospectId}`}>• {getProspectLabel(prospectId)}</div>
          ))}

          <div style={{ marginTop: 6 }}><small>Discovered Prospects ({discoveredEntries.length})</small></div>
          {discoveredEntries.length === 0 && <div>No scouting reports yet.</div>}
          {discoveredEntries.map(([prospectId, report]) => (
            <div key={prospectId} className="ugf-card">
              <div className="ugf-card__body" style={{ display: "grid", gap: 4 }}>
                <div><b>{getProspectLabel(prospectId)}</b></div>
                <div>Discovery Level: {report.level}/3</div>
                <small>{report.notes.at(-1) ?? "No notes"}</small>
              </div>
            </div>
          ))}
        </div></div>

        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Standings Snapshot</b>
          <ul className="ugf-standings-list">
            {standingsSnapshot.map((team) => (
              <li key={team.id} className="ugf-standings-row">
                <span className="ugf-standings-logoCol">
                  <TeamIcon teamKey={team.teamKey} size={standingsIconSize} />
                </span>
                <span><b>{team.name}</b> — {team.wins}-{team.losses}</span>
              </li>
            ))}
          </ul>
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
