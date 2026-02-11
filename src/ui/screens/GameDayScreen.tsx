import React, { useMemo } from "react";
import type { ScreenProps } from "@/ui/types";
import { LEAGUE_TEAMS } from "@/services/league/teams";

function teamName(id: string) {
  return LEAGUE_TEAMS.find((t) => t.id === id)?.name ?? id;
}

export function GameDayScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save) return <div className="ugf-card"><div className="ugf-card__body">No save loaded.</div></div>;
  if (state.route.key !== "GameDay") return null;

  const week = state.route.week;
  const gs = save.gameState;
  const season = gs.season;
  if (!season?.schedule) return <div className="ugf-card"><div className="ugf-card__body">Schedule missing.</div></div>;

  const userTeamId = gs.franchise.excelTeamKey || gs.franchise.ugfTeamKey || "";
  const games = season.schedule.gamesByWeek[week] ?? [];
  const userGame = games.find((g) => g.homeTeamId === userTeamId || g.awayTeamId === userTeamId);

  const alreadyPlayed = userGame?.status === "PLAYED";
  const result = userGame ? season.resultsByGameId[userGame.id] : null;

  const header = useMemo(() => {
    if (!userGame) return `Week ${week} — BYE`;
    const vs = userGame.homeTeamId === userTeamId ? `vs ${teamName(userGame.awayTeamId)}` : `@ ${teamName(userGame.homeTeamId)}`;
    return `Week ${week} — ${vs}`;
  }, [userGame, userTeamId, week]);

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Game Day</h2>
        <div className="ugf-pill">{header}</div>
      </div>

      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        {!userGame ? (
          <div className="ugf-pill">No game scheduled. Enjoy the bye.</div>
        ) : (
          <>
            <div className="ugf-pill">
              {alreadyPlayed && result
                ? `Final: ${teamName(result.awayTeamId)} ${result.awayScore} — ${teamName(result.homeTeamId)} ${result.homeScore}`
                : "Ready. This will simulate a full game (MVV)."}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={alreadyPlayed} onClick={() => ui.dispatch({ type: "PLAY_USER_GAME", week })}>
                {alreadyPlayed ? "Played" : "Simulate Game"}
              </button>
              <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Schedule" } })}>Back to Schedule</button>
            </div>

            {result ? (
              <div className="ugf-card" style={{ margin: 0 }}>
                <div className="ugf-card__header"><h3 className="ugf-card__title">Why it happened (MVV)</h3></div>
                <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                  {result.summary.slice(0, 8).map((line) => <div key={line} className="ugf-pill">{line}</div>)}
                  <div className="ugf-pill">Plays: {result.plays.length}</div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
