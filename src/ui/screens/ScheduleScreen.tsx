import React from "react";
import type { ScreenProps } from "@/ui/types";
import { LEAGUE_TEAMS } from "@/services/league/teams";

function teamName(id: string) {
  return LEAGUE_TEAMS.find((t) => t.id === id)?.name ?? id;
}

export function ScheduleScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return <div className="ugf-card"><div className="ugf-card__body">No save loaded.</div></div>;
  const gs = save.gameState;
  const season = gs.season;

  if (!season?.schedule) {
    return (
      <div className="ugf-card">
        <div className="ugf-card__header"><h2 className="ugf-card__title">Schedule</h2></div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <div className="ugf-pill">Schedule not initialized yet.</div>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back</button>
        </div>
      </div>
    );
  }

  const userTeamId = gs.franchise.excelTeamKey || gs.franchise.ugfTeamKey || "";
  const weeks = Array.from({ length: 17 }).map((_, i) => i + 1);

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Schedule</h2>
        <div className="ugf-pill">Record: {season.wins}-{season.losses}</div>
      </div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        {weeks.map((w) => {
          const games = season.schedule!.gamesByWeek[w] ?? [];
          const userGame = games.find((g) => g.homeTeamId === userTeamId || g.awayTeamId === userTeamId);
          if (!userGame) return (
            <div key={w} className="ugf-pill">Week {w}: BYE</div>
          );

          const played = userGame.status === "PLAYED";
          const score = played ? `${userGame.score?.away ?? 0}-${userGame.score?.home ?? 0}` : "—";
          const vs = userGame.homeTeamId === userTeamId ? `vs ${teamName(userGame.awayTeamId)}` : `@ ${teamName(userGame.homeTeamId)}`;

          return (
            <div key={w} className="ugf-card" style={{ margin: 0 }}>
              <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>Week {w}: {vs}</div>
                  <div className="ugf-pill" style={{ display: "inline-flex", gap: 10 }}>
                    <span>Status: {played ? "Played" : "Scheduled"}</span>
                    <span>Score: {score}</span>
                  </div>
                </div>
                <button disabled={played} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "GameDay", week: w } })}>
                  {played ? "Complete" : "Play"}
                </button>
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
