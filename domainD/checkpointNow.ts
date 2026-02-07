import type { LeagueState, DomainEvent } from "../phaseEngine/types";

/**
 * Port-only boundary. Implemented by Domain E adapter at runtime.
 * Domain D must not import Domain E.
 */
export type CheckpointNowPort = {
  checkpointNow: (args: {
    saveId: string;
    state: LeagueState;
    txLog: DomainEvent[];
  }) => Promise<{ checkpointId: string }>;
};
