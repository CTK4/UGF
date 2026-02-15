/**
 * Coach contract helpers.
 *
 * - Reads existing contracts from canonical league db contracts.
 * - Provides "active contract" salary for a season.
 * - Creates new coach contracts on hire and stores them in gameState.staff.coachContractsById.
 */

import { getContracts } from "@/data/leagueDb";

export type ContractRow = {
  contractId?: string | number;
  entityType?: string;
  personId?: string | number;
  entityId?: string | number;
  teamId?: string | number | null;
  startSeason?: number | null;
  endSeason?: number | null;
  salaryY1?: number | null;
  salaryY2?: number | null;
  salaryY3?: number | null;
  salaryY4?: number | null;
};

export type CoachContract = {
  contractId: string;
  entityType: "PERSONNEL";
  personId: string;
  teamId: string;
  startSeason: number;
  endSeason: number;
  salaryBySeason: Record<number, number>;
};

function rows(): ContractRow[] {
  return getContracts() as unknown as ContractRow[];
}

function normEntityType(s: string | null | undefined): string {
  return String(s ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function findExistingCoachContractRow(contractId: string | number | null | undefined): ContractRow | null {
  if (contractId == null) return null;
  const id = String(contractId);
  return rows().find((r) => String(r.contractId ?? "") === id) ?? null;
}

export function contractRowToCoachContract(row: ContractRow): CoachContract | null {
  const entityType = normEntityType(row.entityType);
  if (entityType && entityType !== "PERSONNEL") return null;

  const contractId = String(row.contractId ?? "");
  const personId = String(row.personId ?? row.entityId ?? "");
  const teamId = String(row.teamId ?? "");
  const startSeason = Number(row.startSeason ?? NaN);
  const endSeason = Number(row.endSeason ?? NaN);

  if (!contractId || !personId || !teamId) return null;
  if (!Number.isFinite(startSeason) || !Number.isFinite(endSeason)) return null;

  const salaryBySeason: Record<number, number> = {};
  const s1 = Number(row.salaryY1 ?? 0);
  const s2 = Number(row.salaryY2 ?? 0);
  const s3 = Number(row.salaryY3 ?? 0);
  const s4 = Number(row.salaryY4 ?? 0);

  salaryBySeason[startSeason] = s1;
  if (endSeason >= startSeason + 1) salaryBySeason[startSeason + 1] = s2;
  if (endSeason >= startSeason + 2) salaryBySeason[startSeason + 2] = s3;
  if (endSeason >= startSeason + 3) salaryBySeason[startSeason + 3] = s4;

  return { contractId, entityType: "PERSONNEL", personId, teamId, startSeason, endSeason, salaryBySeason };
}

export function salaryForContractInSeason(contract: CoachContract, season: number): number {
  if (season < contract.startSeason || season > contract.endSeason) return 0;
  return Number(contract.salaryBySeason[season] ?? 0);
}

export function buildExistingContractsIndex(): Map<string, CoachContract> {
  const out = new Map<string, CoachContract>();
  for (const r of rows()) {
    const cc = contractRowToCoachContract(r);
    if (!cc) continue;
    out.set(cc.contractId, cc);
  }
  return out;
}

export function createNewCoachContract(args: {
  contractId: string;
  personId: string;
  teamId: string;
  startSeason: number;
  years: number;
  salaryY1: number;
}): CoachContract {
  const years = Math.max(1, Math.min(4, Math.floor(args.years)));
  const endSeason = args.startSeason + years - 1;

  const salaryBySeason: Record<number, number> = {};
  for (let i = 0; i < years; i++) {
    const season = args.startSeason + i;
    const growth = 1 + i * 0.03;
    salaryBySeason[season] = Math.round(args.salaryY1 * growth);
  }

  return {
    contractId: args.contractId,
    entityType: "PERSONNEL",
    personId: args.personId,
    teamId: args.teamId,
    startSeason: args.startSeason,
    endSeason,
    salaryBySeason,
  };
}
