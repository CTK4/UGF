import leagueDbRaw from "@/data/leagueDb/leagueDb.json";

export type LeagueTeam = { teamId: string; name: string; conferenceId?: string; divisionId?: string; abbrev?: string; [k: string]: unknown };
export type LeaguePlayer = { playerId: string; fullName: string; teamId?: string; status?: string; pos?: string; age?: number; overall?: number; contractId?: string; [k: string]: unknown };
export type LeagueContract = { contractId: string; entityType?: string; entityId?: string; teamId?: string; startSeason?: number; endSeason?: number; [k: string]: unknown };
export type LeaguePersonnel = { personId: string; fullName: string; role?: string; teamId?: string; status?: string; age?: number; contractId?: string; [k: string]: unknown };
export type LeagueDraftOrder = { season?: number; round?: number; pick: number; teamId: string; [k: string]: unknown };
export type LeagueConference = { conferenceId: string; name: string; sortOrder?: number; [k: string]: unknown };
export type LeagueDivision = { divisionId: string; conferenceId: string; name: string; sortOrder?: number; [k: string]: unknown };
export type LeagueFinance = { teamId: string; season?: number; capSpace?: number; cash?: number; revenue?: number; expenses?: number; [k: string]: unknown };

type LeagueDbShape = {
  league?: Array<{ salaryCap?: number; season?: number; [k: string]: unknown }>;
  teams?: LeagueTeam[];
  players?: LeaguePlayer[];
  contracts?: LeagueContract[];
  personnel?: LeaguePersonnel[];
  draftOrder?: LeagueDraftOrder[];
  conferences?: LeagueConference[];
  divisions?: LeagueDivision[];
  teamFinances?: LeagueFinance[];
};

const FORBIDDEN_TEAM_NAME_PATTERNS = [/\bvoodoo\b/i, /new york gotham guardians/i];
const leagueDb = leagueDbRaw as LeagueDbShape;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function assertNoForbiddenTeamNames(): void {
  const offenders = getTeams().filter((team) => FORBIDDEN_TEAM_NAME_PATTERNS.some((pattern) => pattern.test(String(team.name ?? ""))));
  if (!offenders.length) return;
  const names = offenders.map((team) => String(team.name)).join(", ");
  const message = `[leagueDb] Forbidden team name(s) found: ${names}`;
  if (import.meta.env.DEV) throw new Error(message);
  console.error(message);
}

export function getTeams(): LeagueTeam[] { return asArray<LeagueTeam>(leagueDb.teams); }
export function getPlayers(): LeaguePlayer[] { return asArray<LeaguePlayer>(leagueDb.players); }
export function getContracts(): LeagueContract[] { return asArray<LeagueContract>(leagueDb.contracts); }
export function getPersonnel(): LeaguePersonnel[] { return asArray<LeaguePersonnel>(leagueDb.personnel); }
export function getDraftOrder(): LeagueDraftOrder[] { return asArray<LeagueDraftOrder>(leagueDb.draftOrder); }
export function getConferences(): LeagueConference[] { return asArray<LeagueConference>(leagueDb.conferences); }
export function getDivisions(): LeagueDivision[] { return asArray<LeagueDivision>(leagueDb.divisions); }
export function getFinances(): LeagueFinance[] { return asArray<LeagueFinance>(leagueDb.teamFinances); }
export function getSalaryCap(): number {
  const cap = Number(leagueDb.league?.[0]?.salaryCap ?? 250_000_000);
  return Number.isFinite(cap) && cap > 0 ? cap : 250_000_000;
}

assertNoForbiddenTeamNames();
