import type { AdvanceCommand, DomainEvent, LeagueState } from "./types";
import { GateBlockedError } from "./errors";
import { assertPhaseVersion } from "./assertPhaseVersion";
import { evaluateGates } from "./gates";
import { shouldCheckpoint } from "./checkpoints";
import type { CheckpointNowPort } from "../domainD/checkpointNow";

export type AdvanceResult = {
  state: LeagueState;
  events: DomainEvent[];
  checkpoint: { checkpointId: string } | null;
};

export async function advanceAsync(
  state: LeagueState,
  cmd: AdvanceCommand,
  deps: { saveId: string; checkpointPort: CheckpointNowPort }
): Promise<AdvanceResult> {
  // REQUIRED: first line is phaseVersion assertion
  assertPhaseVersion(state, cmd.expectedPhaseVersion);

  const gates = evaluateGates(state);
  if (!gates.ok && cmd.type !== "FORCE_AUTOFILL_REQUIREMENTS") {
    throw new GateBlockedError(gates.missing);
  }

  const events: DomainEvent[] = [];

  // placeholder pipeline: record command
  events.push({ type: "ENGINE_COMMAND_RECEIVED", commandType: cmd.type });

  const doCheckpoint = shouldCheckpoint(state, cmd.type, events);
  const checkpoint = doCheckpoint
    ? await deps.checkpointPort.checkpointNow({ saveId: deps.saveId, state, txLog: events })
    : null;

  if (checkpoint) events.push({ type: "CHECKPOINT_CREATED", checkpointId: checkpoint.checkpointId });

  // success-only increment (exactly once)
  state.phaseVersion += 1;

  return { state, events, checkpoint };
}
