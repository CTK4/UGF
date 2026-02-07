import type { GateFailure } from "./types";

export class GateBlockedError extends Error {
  readonly kind = "GATE_BLOCKED" as const;
  constructor(public readonly failures: GateFailure[]) {
    super("Phase gating blocked advancement.");
  }
}

export class PhaseVersionMismatchError extends Error {
  readonly kind = "PHASE_VERSION_MISMATCH" as const;
  constructor(
    public readonly expectedPhaseVersion: number,
    public readonly actualPhaseVersion: number
  ) {
    super(`PhaseVersion mismatch: expected ${expectedPhaseVersion}, actual ${actualPhaseVersion}`);
  }
}
