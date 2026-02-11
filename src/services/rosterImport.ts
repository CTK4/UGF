import type { LeaguePlayer, LeagueState } from "@/engine/gameState";
import { DEFAULT_SALARY_CAP, sumCapByTeam } from "@/engine/cap";
import { getContracts, getPlayers, getSalaryCap } from "@/data/leagueDb";
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
  const resolved = resolveTeamKey(sanitized);
  if (resolved && resolved !== "UNKNOWN_TEAM") return resolved;
  return normalizeExcelTeamKey(sanitized);
}

function contractAmountFor(playerId: string): number {
  const contract = getContracts().find((row) => String(row.entityId ?? "") === playerId);
  return Number(contract?.salaryY1 ?? 0);
}

function yearsLeftFor(playerId: string, season: number): number {
  const contract = getContracts().find((row) => String(row.entityId ?? "") === playerId);
  const endSeason = Number(contract?.endSeason ?? season);
  return Math.max(1, endSeason - season + 1);
}

function toLeaguePlayer(raw: ReturnType<typeof getPlayers>[number], season: number): LeaguePlayer {
  const teamKey = raw.teamId === "FREE_AGENT" ? "" : normalizeTeamKey(String(raw.teamId ?? ""));
  return {
    id: String(raw.playerId ?? `p_${deterministicHash(String(raw.fullName ?? ""))}`),
    name: sanitizeForbiddenName(String(raw.fullName ?? "Unknown")),
    positionGroup: String(raw.pos ?? "UNK"),
    pos: String(raw.pos ?? "UNK"),
    teamKey,
    overall: Number(raw.overall ?? 65),
    age: Number(raw.age ?? 25),
    contract: {
      amount: contractAmountFor(String(raw.playerId ?? "")),
      yearsLeft: yearsLeftFor(String(raw.playerId ?? ""), season),
      expSeason: season + yearsLeftFor(String(raw.playerId ?? ""), season),
    },
  };
}

export async function loadLeagueRosterForTeam(input: HydrateInput): Promise<{ league: LeagueState; warning?: string }> {
  const salaryCap = input.salaryCap ?? getSalaryCap() ?? DEFAULT_SALARY_CAP;
  const defaultTeamKey = normalizeTeamKey(input.teamKey || input.excelTeamKey || "");

  const players = getPlayers().map((raw) => toLeaguePlayer(raw, input.season));
  const playersById = Object.fromEntries(players.map((player) => [player.id, player]));
  const teamRosters: Record<string, string[]> = {};
  for (const player of players) {
    if (!player.teamKey) continue;
    if (!teamRosters[player.teamKey]) teamRosters[player.teamKey] = [];
    teamRosters[player.teamKey].push(player.id);
  }

  const league: LeagueState = {
    playersById,
    teamRosters,
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
