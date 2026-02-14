import raw from "./leagueDB.json";
import { validateLeagueDb } from "./validate";

export type LeagueRow = {
  leagueId: string;
  season: number;
  salaryCap: number;
  currency?: string;
  notes?: string;
};

export type ConferenceRow = { conferenceId: string; name: string; sortOrder?: number };
export type DivisionRow = { divisionId: string; conferenceId: string; name: string; sortOrder?: number };

export type TeamRow = {
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

export type PlayerRow = {
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
  archetype?: string;
  Archetype?: string;
  Traits?: string;
  notes?: string;
  [key: string]: unknown;
};

export type ContractRow = {
  contractId: string;
  entityType: "PLAYER" | "PERSONNEL" | string;
  entityId?: string;
  personId?: string;
  teamId?: string;
  startSeason?: number;
  endSeason?: number;
  salaryY1?: number;
  salaryY2?: number;
  salaryY3?: number;
  salaryY4?: number;
  amount?: number;
  yearsLeft?: number;
  guaranteed?: number;
  isExpired?: boolean;
  [key: string]: unknown;
};

export type PersonnelRow = {
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
  [key: string]: unknown;
};

export type DraftOrderRow = { season: number; round: number; pick: number; teamId: string };
export type TeamFinanceRow = { teamId: string; season: number; capSpace?: number; cash?: number; revenue?: number; expenses?: number };
export type TeamSummaryProjectionRow = {
  teamId: string;
  Team: string;
  Conference: string;
  Division: string;
  OVERALL: number;
  Wins: number;
  Losses: number;
  "Cap Space": number;
};

type LeagueDbRoot = {
  teams?: TeamRow[];
  players?: PlayerRow[];
  contracts?: ContractRow[];
  personnel?: PersonnelRow[];
  conferences?: ConferenceRow[];
  divisions?: DivisionRow[];
  league?: LeagueRow[];
  draftOrder?: DraftOrderRow[];
  teamFinances?: TeamFinanceRow[];
  tables?: {
    League?: LeagueRow[];
    Conferences?: ConferenceRow[];
    Divisions?: DivisionRow[];
    Teams?: TeamRow[];
    Personnel?: PersonnelRow[];
    Players?: PlayerRow[];
    Contracts?: ContractRow[];
    DraftOrder?: DraftOrderRow[];
    TeamFinances?: TeamFinanceRow[];
  };
};

const root = raw as LeagueDbRoot;

const league = Object.freeze([...(root.league ?? root.tables?.League ?? [])]);
const conferences = Object.freeze([...(root.conferences ?? root.tables?.Conferences ?? [])]);
const divisions = Object.freeze([...(root.divisions ?? root.tables?.Divisions ?? [])]);
const teams = Object.freeze([...(root.teams ?? root.tables?.Teams ?? [])]);
const players = Object.freeze([...(root.players ?? root.tables?.Players ?? [])]);
const contracts = Object.freeze([...(root.contracts ?? root.tables?.Contracts ?? [])]);
const personnel = Object.freeze([...(root.personnel ?? root.tables?.Personnel ?? [])]);
const draftOrder = Object.freeze([...(root.draftOrder ?? root.tables?.DraftOrder ?? [])]);
const finances = Object.freeze([...(root.teamFinances ?? root.tables?.TeamFinances ?? [])]);

const issues = validateLeagueDb({ teams, players, contracts, personnel });
if (issues.length) {
  throw new Error(
    "leagueDB.json validation failed:\n" +
      issues.map(i => `- ${i.path}: ${i.message}`).join("\n")
  );
}

const teamsById = new Map(teams.map((team) => [String(team.teamId), team]));
const contractsById = new Map(contracts.map((contract) => [String(contract.contractId), contract]));
const playersById = new Map(players.map((player) => [String(player.playerId), player]));
const conferencesById = new Map(conferences.map((conference) => [String(conference.conferenceId), conference]));
const divisionsById = new Map(divisions.map((division) => [String(division.divisionId), division]));

function normalizeKey(key: string): string {
  const rawKey = String(key ?? "").trim();
  if (/^[A-Z0-9_]+$/.test(rawKey)) return rawKey;
  return rawKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function teamMatch(team: TeamRow, key: string): boolean {
  const needle = normalizeKey(key);
  return normalizeKey(team.teamId) === needle || normalizeKey(team.abbrev ?? "") === needle || normalizeKey(team.name ?? "") === needle;
}

export const leagueDb = { ...root, league, conferences, divisions, teams, players, contracts, personnel, draftOrder, teamFinances: finances };

export function getLeague(): LeagueRow[] { return [...league]; }
export function getConferences(): ConferenceRow[] { return [...conferences]; }
export function getDivisions(): DivisionRow[] { return [...divisions]; }
export function getTeams(): TeamRow[] { return [...teams]; }
export function getTeamById(teamId: string): TeamRow | undefined { return teamsById.get(String(teamId)); }
export function getTeamByKey(teamKey: string): TeamRow | undefined { return teams.find((team) => teamMatch(team, teamKey)); }

export function getPlayers(): PlayerRow[] { return [...players]; }
export function getPlayerById(playerId: string): PlayerRow | undefined { return playersById.get(String(playerId)); }

export function getContracts(): ContractRow[] { return [...contracts]; }
export function getContractById(contractId: string): ContractRow | undefined { return contractsById.get(String(contractId)); }

export function getPersonnel(): PersonnelRow[] { return [...personnel]; }
export function getFinances(): TeamFinanceRow[] { return [...finances]; }

export function getCurrentSeason(): number {
  const season = Number(league[0]?.season ?? draftOrder[0]?.season ?? 2026);
  return Number.isFinite(season) ? season : 2026;
}

export function getSalaryCap(): number {
  const fromLeague = Number(league[0]?.salaryCap ?? 0);
  return Number.isFinite(fromLeague) && fromLeague > 0 ? fromLeague : 250_000_000;
}

export function getDraftOrder(season = getCurrentSeason()): DraftOrderRow[] {
  const forSeason = draftOrder.filter((row) => Number(row.season) === Number(season));
  return [...(forSeason.length ? forSeason : draftOrder)]
    .sort((a, b) => Number(a.round) - Number(b.round) || Number(a.pick) - Number(b.pick));
}

export function getTeamSummaryProjectionRows(season = getCurrentSeason(), leagueSeed = season): TeamSummaryProjectionRow[] {
  return teams.map((team) => {
    const teamId = String(team.teamId);
    const teamPlayers = players.filter((player) => String(player.teamId ?? "") === teamId);
    const overall = teamPlayers.length
      ? Math.round((teamPlayers.reduce((sum, player) => sum + Number(player.overall ?? 0), 0) / teamPlayers.length) * 10) / 10
      : 0;

    const seedHash = Number.parseInt(stableHash(`${leagueSeed}:${teamId}`), 16);
    const wins = Number.isFinite(seedHash) ? seedHash % 18 : 0;
    const losses = Math.max(0, 17 - wins);

    const capHits = contracts
      .filter((contract) => String(contract.entityType ?? "").toUpperCase() === "PLAYER" && String(contract.teamId ?? "") === teamId)
      .reduce((sum, contract) => sum + Number(contract.salaryY1 ?? contract.amount ?? 0), 0);
    const capSpace = Number(finances.find((finance) => finance.teamId === teamId && Number(finance.season) === Number(season))?.capSpace ?? (getSalaryCap() - capHits));

    return {
      teamId,
      Team: String(team.name ?? teamId),
      Conference: String(conferencesById.get(String(team.conferenceId ?? ""))?.name ?? "Independent"),
      Division: String(divisionsById.get(String(team.divisionId ?? ""))?.name ?? "Independent"),
      OVERALL: overall,
      Wins: wins,
      Losses: losses,
      "Cap Space": Number.isFinite(capSpace) ? capSpace : 0,
    };
  });
}
