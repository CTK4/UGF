import { buildTimeLabel, getAdvanceTarget, getBeat } from "@/engine/calendar";
import type { GameState } from "@/engine/gameState";
import type { GateFailure } from "@/engine/gates";
import { validateBeatGates } from "@/engine/gates";
import { syncJanuaryTasks } from "@/engine/tasks";

export type MissingGate = {
  key: "STAFF_MEETING" | "DEPTH_CHART" | "WEEK_GAME";
  label: string;
  autoResolveAction: "AUTO_RESOLVE_STAFF_MEETING" | "AUTO_RESOLVE_DEPTH_CHART" | "AUTO_RESOLVE_WEEK_GAME";
};

export function getMissingGates(state: GameState): MissingGate[] {
  const missing: MissingGate[] = [];

  if (state.phase === "JANUARY_OFFSEASON") {
    if (!state.offseasonPlan) {
      missing.push({
        key: "STAFF_MEETING",
        label: "Staff Meeting incomplete",
        autoResolveAction: "AUTO_RESOLVE_STAFF_MEETING",
      });
    }

    if (!state.depthChartFinalized) {
      missing.push({
        key: "DEPTH_CHART",
        label: "Depth Chart not finalized",
        autoResolveAction: "AUTO_RESOLVE_DEPTH_CHART",
      });
    }

    return missing;
  }

  if (state.phase === "REGULAR_SEASON" && state.seasonSchedule) {
    const currentWeekGame = state.seasonSchedule.games.find((game) => game.week === state.time.week);
    if (currentWeekGame && (!currentWeekGame.played || !currentWeekGame.result)) {
      missing.push({
        key: "WEEK_GAME",
        label: "Game not played",
        autoResolveAction: "AUTO_RESOLVE_WEEK_GAME",
      });
    }
  }

  return missing;
}

export type AdvanceOutcome =
  | { ok: true; gameState: GameState }
  | { ok: false; blocked: GateFailure; gameState: GameState };

export function getAdvanceBlocker(state: GameState): GateFailure | null {
  const missing = getMissingGates(state);
  if (missing.length > 0) {
    const first = missing[0];
    if (first.key === "STAFF_MEETING") {
      return {
        gateId: "GATE.STAFF_MEETING_DONE",
        message: "Advance blocked: Staff meeting is incomplete. Submit offseason priorities to continue.",
        route: { key: "StaffMeeting" },
      };
    }
    if (first.key === "DEPTH_CHART") {
      return {
        gateId: "GATE.STAFF_MEETING_DONE",
        message: "Advance blocked: Depth chart is not finalized. Open the roster and finalize depth chart.",
        route: { key: "Roster" },
      };
    }
    return {
      gateId: "GATE.STAFF_MEETING_DONE",
      message: "Advance blocked: Game not completed this week. Play or sim the game to continue.",
      route: { key: "Hub" },
    };
  }

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
