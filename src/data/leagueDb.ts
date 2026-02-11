import leagueDbJson from "@/data/ugf_leagueDb.json";

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
  Archetype?: string;
  Traits?: string;
  notes?: string;
  [key: string]: unknown;
};

export type ContractRow = {
  contractId: string;
  entityType: "PLAYER" | "PERSONNEL" | string;
  entityId: string;
  teamId?: string;
  startSeason?: number;
  endSeason?: number;
  salaryY1?: number;
  salaryY2?: number;
  salaryY3?: number;
  salaryY4?: number;
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

type LeagueDbRoot = {
  sheets?: {
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

const root = leagueDbJson as LeagueDbRoot;
const sheets = root.sheets ?? {};

const league = Object.freeze([...(sheets.League ?? [])]);
const conferences = Object.freeze([...(sheets.Conferences ?? [])]);
const divisions = Object.freeze([...(sheets.Divisions ?? [])]);
const teams = Object.freeze([...(sheets.Teams ?? [])]);
const players = Object.freeze([...(sheets.Players ?? []).map(withDeterministicPlayerId)]);
const contracts = Object.freeze([...(sheets.Contracts ?? []).map(withDeterministicContractId)]);
const personnel = Object.freeze([...(sheets.Personnel ?? []).map(withDeterministicPersonnelId)]);
const draftOrder = Object.freeze([...(sheets.DraftOrder ?? [])]);
const finances = Object.freeze([...(sheets.TeamFinances ?? [])]);

const teamsById = new Map(teams.map((team) => [String(team.teamId), team]));
const playersById = new Map(players.map((player) => [String(player.playerId), player]));
const contractsById = new Map(contracts.map((contract) => [String(contract.contractId), contract]));
const contractsByEntityKey = new Map(contracts.map((contract) => [toEntityKey(contract.entityType, contract.entityId), contract]));

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeKey(key: string): string {
  const raw = String(key ?? "").trim();
  if (/^[A-Z0-9_]+$/.test(raw)) return raw;
  return raw.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function toEntityKey(entityType: string | undefined, entityId: string | undefined): string {
  return `${String(entityType ?? "").trim().toUpperCase()}:${String(entityId ?? "").trim()}`;
}

function withDeterministicPlayerId(row: PlayerRow): PlayerRow {
  if (row.playerId && String(row.playerId).trim()) return row;
  const key = `${row.fullName ?? "Unknown"}:${row.pos ?? "UNK"}:${row.teamId ?? "FREE_AGENT"}`;
  return { ...row, playerId: `PLY_${stableHash(key)}` };
}

function withDeterministicContractId(row: ContractRow): ContractRow {
  if (row.contractId && String(row.contractId).trim()) return row;
  const key = `${row.entityType ?? "UNKNOWN"}:${row.entityId ?? ""}:${row.teamId ?? ""}`;
  return { ...row, contractId: `CON_${stableHash(key)}` };
}

function withDeterministicPersonnelId(row: PersonnelRow): PersonnelRow {
  if (row.personId && String(row.personId).trim()) return row;
  const key = `${row.fullName ?? "Unknown"}:${row.role ?? "UNK"}:${row.teamId ?? "FREE_AGENT"}`;
  return { ...row, personId: `PERS_${stableHash(key)}` };
}

function teamMatch(team: TeamRow, key: string): boolean {
  const needle = normalizeKey(key);
  return normalizeKey(team.teamId) === needle || normalizeKey(team.abbrev ?? "") === needle || normalizeKey(team.name ?? "") === needle;
}

export function getLeague(): LeagueRow[] { return [...league]; }
export function getConferences(): ConferenceRow[] { return [...conferences]; }
export function getDivisions(): DivisionRow[] { return [...divisions]; }
export function getTeams(): TeamRow[] { return [...teams]; }
export function getTeamById(teamId: string): TeamRow | undefined { return teamsById.get(String(teamId)); }
export function getTeamByKey(teamKey: string): TeamRow | undefined { return teams.find((team) => teamMatch(team, teamKey)); }

export function getPlayers(): PlayerRow[] { return [...players]; }
export function getPlayerById(playerId: string): PlayerRow | undefined { return playersById.get(String(playerId)); }
export function getPlayersByTeam(teamLike: string): PlayerRow[] {
  const team = getTeamById(teamLike) ?? getTeamByKey(teamLike);
  if (!team) return [];
  return players.filter((player) => String(player.teamId ?? "") === team.teamId);
}
export function getFreeAgents(): PlayerRow[] {
  return players.filter((player) => {
    const teamId = String(player.teamId ?? "");
    return !teamId || teamId === "FREE_AGENT" || !teamsById.has(teamId);
  });
}

export function getContracts(): ContractRow[] { return [...contracts]; }
export function getContractById(contractId: string): ContractRow | undefined { return contractsById.get(String(contractId)); }
export function getContractsByPlayer(playerId: string): ContractRow[] {
  return contracts.filter((contract) => String(contract.entityType).toUpperCase() === "PLAYER" && String(contract.entityId) === String(playerId));
}
export function getExpiringPlayers(season = getCurrentSeason()): PlayerRow[] {
  return players.filter((player) => {
    const contract = player.contractId
      ? contractsById.get(String(player.contractId))
      : contractsByEntityKey.get(toEntityKey("PLAYER", String(player.playerId)));
    if (!contract) return false;
    if (Number.isFinite(Number(contract.endSeason))) {
      return Number(contract.endSeason) <= season;
    }
    const status = String(player.status ?? "").trim().toUpperCase();
    return status === "PENDING_FREE_AGENT" || status === "FREE_AGENT";
  });
}

export function getPersonnel(): PersonnelRow[] { return [...personnel]; }
export function getPersonnelFreeAgents(): PersonnelRow[] {
  return personnel.filter((person) => {
    const status = String(person.status ?? "").toUpperCase();
    const teamId = String(person.teamId ?? "");
    return status === "FREE_AGENT" || !teamId || teamId === "FREE_AGENT";
  });
}

export function getDraftOrder(season = getCurrentSeason()): DraftOrderRow[] {
  const forSeason = draftOrder.filter((row) => Number(row.season) === Number(season));
  return [...(forSeason.length ? forSeason : draftOrder)]
    .sort((a, b) => Number(a.round) - Number(b.round) || Number(a.pick) - Number(b.pick));
}

export function getCurrentDraftOrder(): DraftOrderRow[] {
  return getDraftOrder(getCurrentSeason());
}

export function getFinances(): TeamFinanceRow[] { return [...finances]; }

export function getCurrentSeason(): number {
  const season = Number(league[0]?.season ?? draftOrder[0]?.season ?? 2026);
  return Number.isFinite(season) ? season : 2026;
}

export function getSalaryCap(): number {
  const fromLeague = Number(league[0]?.salaryCap ?? 0);
  return Number.isFinite(fromLeague) && fromLeague > 0 ? fromLeague : 250_000_000;
}

if (import.meta.env.DEV) {
  for (const player of players) {
    const teamId = String(player.teamId ?? "").trim();
    if (teamId && teamId !== "FREE_AGENT" && !teamsById.has(teamId)) {
      console.warn("[leagueDb] Player references unknown teamId", { playerId: player.playerId, teamId });
    }
  }
  for (const contract of contracts) {
    const teamId = String(contract.teamId ?? "").trim();
    if (teamId && !teamsById.has(teamId)) {
      console.warn("[leagueDb] Contract references unknown teamId", {
        contractId: contract.contractId,
        entityType: contract.entityType,
        entityId: contract.entityId,
        teamId,
      });
    }
  }
}
