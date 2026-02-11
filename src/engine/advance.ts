import { buildTimeLabel, getAdvanceTarget, getBeat } from "@/engine/calendar";
import type { GameState, GamePhase } from "@/engine/gameState";
import type { GateFailure } from "@/engine/gates";
import { validateBeatGates } from "@/engine/gates";
import { syncJanuaryTasks } from "@/engine/tasks";

export type AdvanceOutcome =
  | { ok: true; gameState: GameState }
  | { ok: false; blocked: GateFailure; gameState: GameState };

export function getAdvanceBlocker(state: GameState): GateFailure | null {
  const currentBeat = getBeat(state.time.season, state.time.week);
  return validateBeatGates(state, currentBeat.gates ?? []);
}

function phaseForBeatIndex(weekIndex: number): GamePhase {
  if (weekIndex <= 0) return "PRECAREER";
  if (weekIndex <= 4) return "JANUARY_OFFSEASON";
  if (weekIndex === 5) return "DRAFT";
  return "REGULAR_SEASON";
}

export function advanceDay(state: GameState): AdvanceOutcome {
  const blocked = getAdvanceBlocker(state);
  if (blocked) return { ok: false, blocked, gameState: state };

  const target = getAdvanceTarget(state.time);
  const phaseVersion = state.time.phaseVersion + 1;
  const label = buildTimeLabel(target.season, target.week, target.dayIndex);
  const phase = phaseForBeatIndex(target.week);

  const nextState: GameState = {
    ...state,
    time: { ...state.time, season: target.season, week: target.week, dayIndex: target.dayIndex, phaseVersion, label },
    phase,
    checkpoints: [...state.checkpoints, { ts: Date.now(), label, week: target.week, phaseVersion }],
    lastUiError: null,
  };

  return {
    ok: true,
    gameState: phase === "JANUARY_OFFSEASON" ? { ...nextState, tasks: syncJanuaryTasks(nextState) } : nextState,
  };
}
