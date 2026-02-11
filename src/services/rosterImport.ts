import type { LeagueContract, LeaguePersonnel, LeaguePlayer, LeagueState, LeagueTeam } from "@/engine/gameState";
import { DEFAULT_SALARY_CAP, sumCapByTeam } from "@/engine/cap";
import { getContractById, getContracts, getCurrentSeason, getDraftOrder, getPersonnel, getPlayers, getSalaryCap, getTeamById, getTeamByKey, getTeams } from "@/data/leagueDb";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";

type HydrateInput = {
  teamKey: string;
  excelTeamKey?: string;
  season: number;
  salaryCap?: number;
};

export function sanitizeForbiddenName(value: string): string {
  return String(value ?? "").replace(/Gotham/gi, "Gothic").replace(/Voodoo/gi, "Hex");
}

function deterministicHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeTeamKey(teamLike: string): string {
  const sanitized = sanitizeForbiddenName(teamLike);
  const fromCanonical = getTeamById(sanitized) ?? getTeamByKey(sanitized);
  if (fromCanonical) return String(fromCanonical.teamId);
  const resolved = resolveTeamKey(sanitized);
  if (resolved && resolved !== "UNKNOWN_TEAM") {
    const resolvedCanonical = getTeamById(resolved) ?? getTeamByKey(resolved);
    if (resolvedCanonical) return String(resolvedCanonical.teamId);
  }
  const fromExcel = normalizeExcelTeamKey(sanitized);
  const excelCanonical = getTeamById(fromExcel) ?? getTeamByKey(fromExcel);
  return String(excelCanonical?.teamId ?? fromExcel);
}

function toPlayerId(raw: { playerId?: string; fullName?: string; pos?: string; teamId?: string }): string {
  if (raw.playerId && String(raw.playerId).trim()) return String(raw.playerId);
  return `PLY_${deterministicHash(`${raw.fullName ?? "Unknown"}:${raw.pos ?? "UNK"}:${raw.teamId ?? "FREE_AGENT"}`)}`;
}

const playerContractsByEntityId = new Map(
  getContracts()
    .filter((row) => String(row.entityType ?? "").trim().toUpperCase() === "PLAYER")
    .map((row) => [String(row.entityId ?? "").trim(), row]),
);

function playerContractFor(raw: ReturnType<typeof getPlayers>[number], playerId: string) {
  if (raw.contractId) {
    const byId = getContractById(String(raw.contractId));
    if (byId && String(byId.entityType ?? "").trim().toUpperCase() === "PLAYER") return byId;
  }
  return playerContractsByEntityId.get(String(playerId).trim());
}

function contractAmountFor(raw: ReturnType<typeof getPlayers>[number], playerId: string): number {
  const contract = playerContractFor(raw, playerId);
  return Number(contract?.salaryY1 ?? 0);
}

function yearsLeftFor(raw: ReturnType<typeof getPlayers>[number], playerId: string, season: number): number {
  const contract = playerContractFor(raw, playerId);
  const endSeason = Number(contract?.endSeason ?? season);
  return Math.max(1, endSeason - season + 1);
}

function toLeaguePlayer(raw: ReturnType<typeof getPlayers>[number], season: number): LeaguePlayer {
  const id = toPlayerId(raw);
  const teamKey = raw.teamId === "FREE_AGENT" ? "" : normalizeTeamKey(String(raw.teamId ?? ""));
  return {
    id,
    name: sanitizeForbiddenName(String(raw.fullName ?? "Unknown")),
    positionGroup: String(raw.pos ?? "UNK"),
    pos: String(raw.pos ?? "UNK"),
    teamKey,
    overall: Number(raw.overall ?? 65),
    age: Number(raw.age ?? 25),
    status: String(raw.status ?? "ACTIVE"),
    contract: {
      amount: contractAmountFor(raw, id),
      yearsLeft: yearsLeftFor(raw, id, season),
      expSeason: season + yearsLeftFor(raw, id, season),
    },
  };
}

function toLeagueTeam(raw: ReturnType<typeof getTeams>[number]): LeagueTeam {
  const teamId = String(raw.teamId ?? "");
  return {
    id: teamId,
    teamId,
    name: String(raw.name ?? raw.teamId ?? "Unknown Team"),
    conferenceId: raw.conferenceId ? String(raw.conferenceId) : undefined,
    divisionId: raw.divisionId ? String(raw.divisionId) : undefined,
    abbrev: raw.abbrev ? String(raw.abbrev) : undefined,
    region: raw.region ? String(raw.region) : undefined,
  };
}

function toContract(raw: ReturnType<typeof getContracts>[number]): LeagueContract {
  const contractId = String(raw.contractId ?? `CON_${deterministicHash(`${raw.entityType}:${raw.entityId}:${raw.teamId ?? ""}`)}`);
  return {
    id: contractId,
    contractId,
    entityType: String(raw.entityType ?? "UNKNOWN"),
    entityId: String(raw.entityId ?? ""),
    teamId: raw.teamId ? String(raw.teamId) : undefined,
    startSeason: Number.isFinite(Number(raw.startSeason)) ? Number(raw.startSeason) : undefined,
    endSeason: Number.isFinite(Number(raw.endSeason)) ? Number(raw.endSeason) : undefined,
    salaryY1: Number.isFinite(Number(raw.salaryY1)) ? Number(raw.salaryY1) : undefined,
    guaranteed: Number.isFinite(Number(raw.guaranteed)) ? Number(raw.guaranteed) : undefined,
    isExpired: Boolean(raw.isExpired),
  };
}

function toPersonnel(raw: ReturnType<typeof getPersonnel>[number]): LeaguePersonnel {
  const personId = String(raw.personId ?? `PERS_${deterministicHash(`${raw.fullName}:${raw.role}:${raw.teamId ?? "FREE_AGENT"}`)}`);
  return {
    id: personId,
    personId,
    fullName: String(raw.fullName ?? "Unknown"),
    role: raw.role ? String(raw.role) : undefined,
    teamId: raw.teamId ? String(raw.teamId) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    contractId: raw.contractId ? String(raw.contractId) : undefined,
  };
}

export async function loadLeagueRosterForTeam(input: HydrateInput): Promise<{ league: LeagueState; warning?: string }> {
  const season = Number(input.season || getCurrentSeason());
  const salaryCap = input.salaryCap ?? getSalaryCap() ?? DEFAULT_SALARY_CAP;
  const defaultTeamKey = normalizeTeamKey(input.teamKey || input.excelTeamKey || "");

  const players = getPlayers().map((raw) => toLeaguePlayer(raw, season));
  const playersById = Object.fromEntries(players.map((player) => [player.id, player]));

  const teamRosters: Record<string, string[]> = {};
  for (const player of players) {
    if (!player.teamKey) continue;
    if (!teamRosters[player.teamKey]) teamRosters[player.teamKey] = [];
    teamRosters[player.teamKey].push(player.id);
  }

  const teamsById = Object.fromEntries(getTeams().map((team) => {
    const mapped = toLeagueTeam(team);
    return [mapped.id, mapped];
  }));

  const contractsById = Object.fromEntries(getContracts().map((contract) => {
    const mapped = toContract(contract);
    return [mapped.id, mapped];
  }));

  const personnelById = Object.fromEntries(getPersonnel().map((person) => {
    const mapped = toPersonnel(person);
    return [mapped.id, mapped];
  }));

  const draftSeason = String(season);
  const draftOrderBySeason = {
    [draftSeason]: getDraftOrder(season).map((pick) => ({
      season: Number(pick.season),
      round: Number(pick.round),
      pick: Number(pick.pick),
      teamId: String(pick.teamId),
    })),
  };

  const league: LeagueState = {
    playersById,
    teamRosters,
    teamsById,
    contractsById,
    personnelById,
    draftOrderBySeason,
    cap: {
      salaryCap,
      capUsedByTeam: sumCapByTeam(playersById),
    },
  };

  if (!(teamRosters[defaultTeamKey]?.length ?? 0)) {
    return {
      league,
      warning: `Roster data missing for ${defaultTeamKey}, using current LeagueDB snapshot.`,
    };
  }

  return { league };
}
