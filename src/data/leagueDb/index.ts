import leagueDbRaw from "@/data/leagueDb/leagueDB.json";

type LeagueSheetRow = {
  leagueId: string;
  season: number;
  salaryCap: number;
  currency?: string;
  notes?: string;
};

type ConferenceSheetRow = {
  conferenceId: string;
  name: string;
  sortOrder?: number;
};

type DivisionSheetRow = {
  divisionId: string;
  conferenceId: string;
  name: string;
  sortOrder?: number;
};

type TeamSheetRow = {
  teamId: string;
  abbrev?: string;
  name: string;
  region?: string;
  conferenceId?: string;
  divisionId?: string;
  stadium?: string;
  logoKey?: string;
  isActive?: boolean;
};

type PersonnelSheetRow = {
  personId: string;
  fullName: string;
  role?: string;
  teamId?: string;
  status?: string;
  age?: number;
  reputation?: number;
  contractId?: string;
  notes?: string;
  scheme?: string;
};

type PlayerSheetRow = {
  playerId: string;
  fullName: string;
  pos?: string;
  teamId?: string;
  status?: string;
  age?: number;
  overall?: number;
  potential?: number;
  college?: string;
  contractId?: string;
  notes?: string;
  archetype?: string;
};

type ContractSheetRow = {
  contractId: string;
  entityType: string;
  entityId: string;
  teamId: string;
  startSeason?: number;
  endSeason?: number;
  salaryY1?: number;
  salaryY2?: number;
  salaryY3?: number;
  salaryY4?: number;
  guaranteed?: number;
  isExpired?: boolean;
};

type DraftOrderSheetRow = {
  season?: number;
  round?: number;
  pick?: number;
  teamId?: string;
};

type TeamFinanceSheetRow = {
  teamId: string;
  season?: number;
  capSpace?: number;
  cash?: number;
  revenue?: number;
  expenses?: number;
};

type DraftPickSheetRow = {
  pickId?: string;
  season?: number;
  round?: number;
  originalTeamId?: string;
  currentTeamId?: string;
  isUsed?: boolean;
};

type LeagueDbTables = {
    League: LeagueSheetRow[];
    Conferences: ConferenceSheetRow[];
    Divisions: DivisionSheetRow[];
    Teams: TeamSheetRow[];
    Personnel: PersonnelSheetRow[];
    Players: PlayerSheetRow[];
    Contracts: ContractSheetRow[];
    DraftOrder: DraftOrderSheetRow[];
    DraftPicks: DraftPickSheetRow[];
    TeamFinances: TeamFinanceSheetRow[];
};

type LeagueDb = {
  sheets?: LeagueDbTables;
  tables?: LeagueDbTables;
};

const leagueDb = leagueDbRaw as LeagueDb;
const dbTables = leagueDb.sheets ?? leagueDb.tables ?? {};

function copyRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

export function getLeague(): LeagueSheetRow[] {
  return copyRows(dbTables.League ?? []);
}

export function getConferences(): ConferenceSheetRow[] {
  return copyRows(dbTables.Conferences ?? []);
}

export function getDivisions(): DivisionSheetRow[] {
  return copyRows(dbTables.Divisions ?? []);
}

export function getTeams(): TeamSheetRow[] {
  return copyRows(dbTables.Teams ?? []);
}

export function getPersonnel(): PersonnelSheetRow[] {
  return copyRows(dbTables.Personnel ?? []);
}

export function getPlayers(): PlayerSheetRow[] {
  return copyRows(dbTables.Players ?? []);
}

export function getContracts(): ContractSheetRow[] {
  return copyRows(dbTables.Contracts ?? []);
}

export function getDraftOrder(): DraftOrderSheetRow[] {
  return copyRows(dbTables.DraftOrder ?? []);
}

export function getDraftPicks(): DraftPickSheetRow[] {
  return copyRows(dbTables.DraftPicks ?? []);
}

export function getFinances(): TeamFinanceSheetRow[] {
  return copyRows(dbTables.TeamFinances ?? []);
}

export function getSalaryCap(fallback = 255_400_000): number {
  const value = Number(dbTables.League?.[0]?.salaryCap);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
