import type { GateCode } from "./gateCodes";
import type { RecoverRouteKey } from "./gateRouting";

export type GateFailure = {
  gateCode: GateCode;
  message: string;
  recoverRouteKey: RecoverRouteKey;
  severity: "BLOCK" | "WARN";
};

export type DomainEvent =
  | { type: "CHECKPOINT_CREATED"; checkpointId: string }
  | { type: "PHASE_CHANGED"; from: string; to: string }
  | { type: string; [k: string]: any };

export type AdvanceCommand =
  | { type: "ADVANCE_WEEK"; expectedPhaseVersion: number }
  | { type: "ADVANCE_PHASE"; expectedPhaseVersion: number }
  | { type: "ADVANCE_DAY"; expectedPhaseVersion: number }
  | { type: "DRAFT_MAKE_PICK"; expectedPhaseVersion: number; playerId: string }
  | { type: "DRAFT_SKIP_PICK"; expectedPhaseVersion: number }
  | { type: "SIM_WEEK"; expectedPhaseVersion: number }
  | { type: "RESOLVE_PENDING"; expectedPhaseVersion: number }
  | { type: "FORCE_AUTOFILL_REQUIREMENTS"; expectedPhaseVersion: number };

export type LeagueState = {
  phaseVersion: number;
  rng: { masterSeed: string };

  clock: {
    season: number;
    phase: string;
    week: number;
    day: number;
    draftRound?: number;
    draftPick?: number;
    draftOverallPick?: number;
  };

  user: { franchiseTeamId: string | null };
  teams: Array<{ id: string; hcId: string | null; gmId: string | null }>;

  config: {
    freeAgency: { totalWeeks: number; daysPerWeek: number; granularity: "WEEK" | "DAY" };
    trainingCamp: { totalWeeks: number };
    regularSeason: { totalWeeks: number };
    draft: { totalPicks: number };
  };

  market: { pendingOffers: any[]; udfaWindowClosed: boolean };
  draft: {
    orderFinalized: boolean;
    pickOwnershipLocked: boolean;
    totalPicks: number;
    currentOverallPick: number;
    onClockTeamId: string;
    eligiblePlayerIds: string[];
    draftedPlayerIds: Set<string>;
  };

  rosters: { allTeamsAtFinalSize: boolean; offseasonCutsComplete: boolean };
  playoffs?: { championTeamId: string | null };
  awards?: { complete: boolean };
  ownerEvaluations?: { complete: boolean };
  retirements?: { resolved: boolean };
  contracts?: { restructuresResolved: boolean };
};
