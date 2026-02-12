import leagueDb from "@/data/leagueDb/leagueDB.json";

export type ContractRow = {
  contractId?: string | number;
  entityType?: string;
  entityId?: string | number;
  teamId?: string | number | null;
  startSeason?: number | null;
  endSeason?: number | null;
  salaryY1?: number | null;
  salaryY2?: number | null;
  salaryY3?: number | null;
  salaryY4?: number | null;
};

type LeagueDbJson = { tables?: { Contracts?: ContractRow[] } };

export type CoachContract = {
  contractId: string;
  entityType: "PERSONNEL";
  entityId: string;
  teamId: string;
  startSeason: number;
  endSeason: number;
  salaryBySeason: Record<number, number>;
};

function rows(): ContractRow[] {
  const db = leagueDb as unknown as LeagueDbJson;
  return db.tables?.Contracts ?? [];
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
  const entityId = String(row.entityId ?? "");
  const teamId = String(row.teamId ?? "");
  const startSeason = Number(row.startSeason ?? NaN);
  const endSeason = Number(row.endSeason ?? NaN);
  if (!contractId || !entityId || !teamId) return null;
  if (!Number.isFinite(startSeason) || !Number.isFinite(endSeason)) return null;

  const salaryBySeason: Record<number, number> = {};
  salaryBySeason[startSeason] = Number(row.salaryY1 ?? 0);
  if (endSeason >= startSeason + 1) salaryBySeason[startSeason + 1] = Number(row.salaryY2 ?? 0);
  if (endSeason >= startSeason + 2) salaryBySeason[startSeason + 2] = Number(row.salaryY3 ?? 0);
  if (endSeason >= startSeason + 3) salaryBySeason[startSeason + 3] = Number(row.salaryY4 ?? 0);

  return { contractId, entityType: "PERSONNEL", entityId, teamId, startSeason, endSeason, salaryBySeason };
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
  entityId: string;
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
    salaryBySeason[season] = Math.round(args.salaryY1 * (1 + i * 0.03));
  }

  return {
    contractId: args.contractId,
    entityType: "PERSONNEL",
    entityId: args.entityId,
    teamId: args.teamId,
    startSeason: args.startSeason,
    endSeason,
    salaryBySeason,
  };
}
