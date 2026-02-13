import { buildTimeLabel, getAdvanceTarget, getBeat } from "@/engine/calendar";
import type { GameState } from "@/engine/gameState";
import type { GateFailure } from "@/engine/gates";
import { validateBeatGates } from "@/engine/gates";
import { syncJanuaryTasks } from "@/engine/tasks";

export type AdvanceOutcome =
  | { ok: true; gameState: GameState }
  | { ok: false; blocked: GateFailure; gameState: GameState };

export type MissingGate = {
  key: "staff_meeting" | "depth_chart" | "game_not_played";
  label: string;
  autoResolveAction: "AUTO_RESOLVE_STAFF_MEETING" | "AUTO_RESOLVE_DEPTH_CHART" | "AUTO_RESOLVE_GAME";
};

export function getMissingGates(state: GameState): MissingGate[] {
  const missing: MissingGate[] = [];

  if (state.phase === "JANUARY_OFFSEASON") {
    if (!state.offseasonPlan) {
      missing.push({
        key: "staff_meeting",
        label: "Staff Meeting incomplete",
        autoResolveAction: "AUTO_RESOLVE_STAFF_MEETING",
      });
    }

    if (!state.completedGates.includes("DEPTH_CHART_FINALIZED")) {
      missing.push({
        key: "depth_chart",
        label: "Depth Chart not finalized",
        autoResolveAction: "AUTO_RESOLVE_DEPTH_CHART",
      });
    }
  }

  if (state.phase === "REGULAR_SEASON") {
    const currentWeekGame = state.seasonSchedule?.games.find((game) => game.week === state.time.week);
    if (currentWeekGame && (!currentWeekGame.played || !currentWeekGame.result)) {
      missing.push({
        key: "game_not_played",
        label: "Current week game not completed",
        autoResolveAction: "AUTO_RESOLVE_GAME",
      });
    }
  }

  return missing;
}

export function getAdvanceBlocker(state: GameState): GateFailure | null {
  const currentBeat = getBeat(state.time.season, state.time.week);
  return validateBeatGates(state, currentBeat.gates ?? []);
}

export function advanceDay(state: GameState): AdvanceOutcome {
  const blocked = getAdvanceBlocker(state);
  if (blocked) {
    return { ok: false, blocked, gameState: state };
  }

  const target = getAdvanceTarget(state.time);
  const phaseVersion = state.time.phaseVersion + 1;
  const label = buildTimeLabel(target.season, target.week, target.dayIndex);
  const nextState: GameState = {
    ...state,
    time: {
      ...state.time,
      season: target.season,
      week: target.week,
      dayIndex: target.dayIndex,
      phaseVersion,
      label,
    },
    phase: "JANUARY_OFFSEASON",
    checkpoints: [...state.checkpoints, { ts: Date.now(), label, week: target.week, phaseVersion }],
    lastUiError: null,
  };

  return {
    ok: true,
    gameState: {
      ...nextState,
      tasks: syncJanuaryTasks(nextState),
    },
  };
}
