import React, { useEffect, useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { getProspectLabel } from "@/services/draftDiscovery";
import { getSuggestedNeed } from "@/engine/scouting";
import { FRANCHISES } from "@/ui/data/franchises";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { findTeamSummaryRow, getTeamDisplayName, resolveTeamKey } from "@/ui/data/teamKeyResolver";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { sanitizeForbiddenName } from "@/services/rosterImport";
import { capSpaceForTeam } from "@/engine/cap";
import { JANUARY_DAY_LABELS, getJanuaryDayLabel } from "@/engine/calendar";
import { getMissingGates } from "@/engine/advance";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function HubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const routeTab = ui.getState().route.key === "Hub" ? ui.getState().route.tab : undefined;
  const [hubTab, setHubTab] = useState<"summary" | "roster" | "contracts">(routeTab === "roster" || routeTab === "contracts" ? routeTab : "summary");
  const advanceState = ui.selectors.canAdvance();

  useEffect(() => {
    if (routeTab === "roster" || routeTab === "contracts") {
      setHubTab(routeTab);
    }
  }, [routeTab]);

  if (!save) {
    return (
      <div className="ugf-card">
        <div className="ugf-card__header"><h2 className="ugf-card__title">Hub</h2></div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <div className="ugf-pill">No save loaded, so Hub actions are unavailable.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })}>Back to Start</button>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Create Coach</button>
          </div>
        </div>
      </div>
    );
  }
  const gs = save.gameState;
  const missingGates = getMissingGates(gs);
  const draftState = gs.draft ?? { discovered: {}, watchlist: [] };

  const discoveredEntries = Object.entries(draftState.discovered).sort((a, b) => a[1].level - b[1].level || a[0].localeCompare(b[0]));

  const isMobile = typeof window !== "undefined" ? !window.matchMedia("(min-width: 900px)").matches : true;
  const standingsIconSize = isMobile ? 44 : 56;
  const standingsSnapshot = FRANCHISES.map((franchise) => {
    const teamKey = resolveTeamKey(franchise.fullName);
    const row = findTeamSummaryRow(teamKey) as Record<string, unknown> | undefined;
    if (!row && import.meta.env.DEV) {
      console.warn("[HubScreen] No standings row found for franchise/team key.", {
        franchiseId: franchise.id,
        franchiseName: franchise.fullName,
        teamKey,
      });
    }
    const wins = Number(row?.Wins ?? row?.W ?? 0);
    const losses = Number(row?.Losses ?? row?.L ?? 0);
    return {
      id: franchise.id,
      teamKey,
      name: getTeamDisplayName(teamKey),
      wins,
      losses,
      winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
    };
  }).sort((a, b) => b.winPct - a.winPct || b.wins - a.wins || a.name.localeCompare(b.name)).slice(0, 8);

  const activeTeamKey = resolveTeamKey(gs.franchise.ugfTeamKey || gs.franchise.excelTeamKey || "");
  const teamRoster = useMemo(() => {
    const ids = gs.league.teamRosters[activeTeamKey] ?? [];
    return ids.map((id) => gs.league.playersById[id]).filter(Boolean);
  }, [gs.league.playersById, gs.league.teamRosters, activeTeamKey]);
  const teamContracts = useMemo(
    () => teamRoster.map((player) => ({
      playerName: player.name,
      position: player.pos || player.positionGroup,
      yearsLeft: player.contract.yearsLeft,
      expiring: player.contract.yearsLeft <= 1,
      pendingFreeAgent: String(player.status ?? "").toUpperCase() === "PENDING_FREE_AGENT",
      capHit: player.contract.amount,
    })),
    [teamRoster],
  );
  const expiring = teamContracts.filter((row) => row.expiring);
  const multiYear = teamContracts.filter((row) => !row.expiring);
  const pendingFreeAgents = teamContracts.filter((row) => row.pendingFreeAgent);
  const totalCapObligation = teamContracts.reduce((sum, row) => sum + row.capHit, 0);

  const capUsed = gs.league.cap.capUsedByTeam[activeTeamKey] ?? 0;
  const capSpace = capSpaceForTeam(activeTeamKey, gs.league.cap.capUsedByTeam, gs.league.cap.salaryCap);


  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hub</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        {gs.phase === "REGULAR_SEASON" ? (
          <>
            <div className="ugf-pill">Season {gs.time.season} · Week {gs.time.week}</div>
            <div className="ugf-pill">Phase: Regular Season</div>
          </>
        ) : (
          <>
            <div className="ugf-pill">Season {gs.time.season} · January Week {gs.time.week} · {getJanuaryDayLabel(gs.time.dayIndex)}</div>
            <div className="ugf-pill">Phase: January Offseason</div>
          </>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="ugf-pill">Offense: {gs.delegation.offenseControl}</span>
          <span className="ugf-pill">Defense: {gs.delegation.defenseControl}</span>
          <span className="ugf-pill">Game Mgmt: {gs.delegation.gameManagement}</span>
          <span className="ugf-pill">GM Auth: {gs.delegation.gmAuthority}</span>
        </div>
        <div className="ugf-card" style={{ borderColor: "rgba(120, 180, 255, 0.45)" }}>
          <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
            <b>Next required task(s)</b>
            <div>{advanceState.canAdvance ? "All required tasks complete. You can advance the calendar." : advanceState.message ?? "Complete required tasks to continue."}</div>
          </div>
        </div>
        <div className="ugf-pill">Owner Mood: Neutral · Hot Seat: Warm (MVP placeholders)</div>
        <div>Coach: <b>{gs.coach.name || "Unnamed"}</b></div>
        <div>Franchise: {sanitizeForbiddenName(gs.franchise.ugfTeamKey || "Not selected")}</div>
        {!advanceState.canAdvance ? (
          <div className="ugf-card" style={{ borderColor: "rgba(255, 140, 0, 0.45)" }}>
            <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
              <b>Advance is blocked</b>
              <div>{advanceState.message ?? "Complete required tasks to continue."}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {advanceState.route ? (
                  <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: advanceState.route })}>Go to Required Screen</button>
                ) : null}
                <button onClick={() => ui.dispatch({ type: "OPEN_ADVANCE_BLOCKED_MODAL" })}>View Blocker Details</button>
              </div>
            </div>
          </div>
        ) : null}
        {missingGates.length > 0 ? (
          <div className="ugf-card" style={{ borderColor: "rgba(255, 191, 71, 0.45)" }}>
            <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
              <b>Resolve & Advance</b>
              <div>{missingGates.map((gate) => gate.label).join(" · ")}</div>
              <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Resolve & Advance</button>
            </div>
          </div>
        ) : null}

        <SegmentedTabs
          value={hubTab}
          tabs={[
            { key: "summary", label: "Summary" },
            { key: "roster", label: "Roster" },
            { key: "contracts", label: "Contracts" },
          ]}
          onChange={(k) => {
            if (k === "summary" || k === "roster" || k === "contracts") setHubTab(k);
          }}
          ariaLabel="Hub tabs"
        />

        <div className="ugf-pill">Cap Used: {money(capUsed)} / {money(gs.league.cap.salaryCap)} · Cap Space: <b>{money(capSpace)}</b></div>
        {gs.phase === "REGULAR_SEASON" && gs.seasonSchedule ? (
          <div className="ugf-card">
            <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
              <b>Regular Season Schedule</b>
              <div>Record: {gs.seasonSchedule.record.wins} – {gs.seasonSchedule.record.losses}</div>
              {gs.seasonSchedule.games.map((game) => (
                <div key={game.id} className="ugf-card">
                  <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      Week {game.week}: {resolveTeamKey(game.opponentKey) || game.opponentKey}
                    </span>
                    <span>
                      {game.played ? (
                        <span>{game.result === "W" ? "Win" : "Loss"}</span>
                      ) : (
                        <button onClick={() => ui.dispatch({ type: "SIMULATE_GAME" })}>Play</button>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } })}>Open Roster</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "FreeAgency" } })}>Open Free Agency</button>
        </div>

        {hubTab === "roster" ? (
          <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
            <b>Team Roster</b>
            {!teamRoster.length ? <div>No roster rows found for the active franchise.</div> : null}
            {teamRoster.slice(0, 80).map((player) => (
              <div key={player.id} className="ugf-card">
                <div className="ugf-card__body" style={{ display: "grid", gridTemplateColumns: "1.3fr repeat(5, minmax(70px, 1fr)) 110px", gap: 8, alignItems: "center" }}>
                  <div><b>{sanitizeForbiddenName(player.name)}</b></div>
                  <div>{player.pos || player.positionGroup}</div>
                  <div>OVR {player.overall ?? "—"}</div>
                  <div>Age {player.age ?? "—"}</div>
                  <div>{player.contract.yearsLeft} yrs</div>
                  <div>{money(player.contract.amount)}</div>
                  <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } })}>Manage</button>
                </div>
              </div>
            ))}
          </div></div>
        ) : null}

        {hubTab === "contracts" ? (
          <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
            <b>Contracts</b>
            <div>Total cap obligations: <b>{money(totalCapObligation)}</b></div>
            <div style={{ display: "grid", gap: 6 }}>
              <strong>Expiring ({expiring.length})</strong>
              {!expiring.length ? <div>None.</div> : expiring.map((row, idx) => (
                <div key={`${row.playerName}-${idx}`}>• {sanitizeForbiddenName(row.playerName)} ({row.position}) — {money(row.capHit)}</div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <strong>Multi-year ({multiYear.length})</strong>
              {!multiYear.length ? <div>None.</div> : multiYear.map((row, idx) => (
                <div key={`${row.playerName}-${idx}`}>• {sanitizeForbiddenName(row.playerName)} ({row.position}) — {row.yearsLeft} yrs · {money(row.capHit)}</div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <strong>Pending Free Agent ({pendingFreeAgents.length})</strong>
              {!pendingFreeAgents.length ? <div>None.</div> : pendingFreeAgents.map((row, idx) => (
                <div key={`pfa-${row.playerName}-${idx}`}>• {sanitizeForbiddenName(row.playerName)} ({row.position}) — re-sign decision pending</div>
              ))}
            </div>
          </div></div>
        ) : null}

        {hubTab !== "summary" ? null : (
          <>
            {gs.phase !== "REGULAR_SEASON" && (
              <>
        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>January Calendar</b>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(36px, 1fr))", gap: 6 }}>
            {JANUARY_DAY_LABELS.map((label, idx) => (
              <div key={label} className="ugf-pill" style={{ textAlign: "center", fontWeight: idx === gs.time.dayIndex ? 700 : 400, opacity: idx === gs.time.dayIndex ? 1 : 0.7 }}>{label}</div>
            ))}
          </div>
          <small>Current slot: Week {gs.time.week} · {getJanuaryDayLabel(gs.time.dayIndex)}</small>
        </div></div>

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
          <div><small>Watchlist ({draftState.watchlist.length})</small></div>
          {draftState.watchlist.length === 0 && <div>No prospects watched yet.</div>}
          {draftState.watchlist.map((prospectId) => (
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
              </>
            )}

        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <b>Standings Snapshot</b>
          <ul className="ugf-standings-list">
            {standingsSnapshot.map((team) => (
              <li key={team.id} className="ugf-standings-row">
                <span className="ugf-standings-logoCol" style={{ ["--logo-col-width" as string]: `${standingsIconSize + 12}px` }}>
                  <TeamLogo teamKey={team.teamKey} variant="standings" size={standingsIconSize} />
                </span>
                <span><b>{team.name}</b> — {team.wins}-{team.losses}</span>
              </li>
            ))}
          </ul>
        </div></div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } })}>Roster</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Staff</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Phone</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Scouting</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub", tab: "contracts" } })}>Draft Board</button>
          <button
            disabled={!advanceState.canAdvance}
            aria-disabled={!advanceState.canAdvance}
            title={advanceState.canAdvance ? "Advance to the next day" : advanceState.message ?? "Advance is blocked"}
            onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}
          >
            Advance Week
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
