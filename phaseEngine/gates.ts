import type { LeagueState, GateFailure } from "./types";
import { GateCode } from "./gateCodes";
import { RecoverRouteKey } from "./gateRouting";

type Gate = {
  phase: string | "ANY";
  predicate: (s: LeagueState) => boolean;
  failure: GateFailure;
};

export const GateRegistry: Gate[] = [
  {
    phase: "ANY",
    predicate: (s) => !!s.rng?.masterSeed,
    failure: {
      gateCode: GateCode.MISSING_MASTER_SEED,
      message: "League RNG seed missing.",
      recoverRouteKey: RecoverRouteKey.FATAL,
      severity: "BLOCK",
    },
  },
  {
    phase: "preseason_setup",
    predicate: (s) => s.user.franchiseTeamId !== null,
    failure: {
      gateCode: GateCode.FRANCHISE_NOT_SELECTED,
      message: "Select a franchise to continue.",
      recoverRouteKey: RecoverRouteKey.SETUP_CHOOSE_FRANCHISE,
      severity: "BLOCK",
    },
  },
  {
    phase: "staffing",
    predicate: (s) => s.teams.every((t) => t.hcId !== null && t.gmId !== null),
    failure: {
      gateCode: GateCode.HC_GM_REQUIRED,
      message: "All teams must have a Head Coach and GM (or apply auto-interim).",
      recoverRouteKey: RecoverRouteKey.STAFFING_BLOCKING,
      severity: "BLOCK",
    },
  },
];

export function evaluateGates(state: LeagueState): { ok: boolean; missing: GateFailure[] } {
  const missing: GateFailure[] = [];
  for (const g of GateRegistry) {
    if (g.phase !== "ANY" && g.phase !== state.clock.phase) continue;
    if (!g.predicate(state)) missing.push(g.failure);
  }
  return { ok: missing.length === 0, missing };
}
