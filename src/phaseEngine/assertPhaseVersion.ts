import type { LeagueState } from "./types";
import { PhaseVersionMismatchError } from "./errors";

export function assertPhaseVersion(state: LeagueState, expected: number) {
  if (state.phaseVersion !== expected) {
    throw new PhaseVersionMismatchError(expected, state.phaseVersion);
  }
}
