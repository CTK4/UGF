import { buildTimeLabel, getAdvanceTarget, getBeat } from "@/engine/calendar";
import type { GameState } from "@/engine/gameState";
import type { GateFailure } from "@/engine/gates";
import { validateBeatGates } from "@/engine/gates";
import { syncJanuaryTasks } from "@/engine/tasks";

export type AdvanceOutcome =
  | { ok: true; gameState: GameState }
  | { ok: false; blocked: GateFailure; gameState: GameState };

export function advanceDay(state: GameState): AdvanceOutcome {
  const currentBeat = getBeat(state.time.season, state.time.week);
  const blocked = validateBeatGates(state, currentBeat.gates ?? []);
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
