import type { GameState, PlayerContractRow } from "@/engine/gameState";
import { getPlayers, getTeams } from "@/data/leagueDb";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";
import { sanitizeForbiddenName } from "@/services/rosterImport";

const MAX_FREE_AGENTS = 150;

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fa_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function askYearsFromOverall(overall: number): number {
  if (overall >= 88) return 4;
  if (overall >= 78) return 3;
  if (overall >= 68) return 2;
  return 1;
}

function askSalaryFromOverall(overall: number): number {
  const safeOverall = Math.max(40, Math.min(99, Math.round(overall)));
  return 550_000 + safeOverall * 130_000;
}

export function calculateCapSummary(rows: PlayerContractRow[], capLimit: number) {
  const payroll = rows.reduce((sum, row) => sum + Math.max(0, row.salary), 0);
  return { payroll, capLimit, capSpace: capLimit - payroll };
}

export function playerContractRowFromLeague(state: GameState, playerId: string): PlayerContractRow | null {
  const player = state.league.playersById[playerId];
  if (!player) return null;
  const overall = Math.max(40, Math.min(99, Math.round(player.overall ?? 65)));
  const source = getPlayers().find((row) => String(row.playerId) === playerId);
  const pending = String(source?.status ?? "").toUpperCase() === "PENDING_FREE_AGENT";
  return {
    id: player.id,
    playerName: sanitizeForbiddenName(player.name),
    position: player.pos || player.positionGroup || "UNK",
    overall,
    age: Math.max(18, Math.round(player.age ?? 25)),
    years: Math.max(1, Math.round(player.contract.yearsLeft ?? 1)),
    salary: Math.max(0, Math.round(player.contract.amount ?? askSalaryFromOverall(overall))),
    teamKey: player.teamKey || null,
    contractStatus: player.teamKey ? "ACTIVE" : "FREE_AGENT",
    needsResign: pending,
  };
}

export function buildTeamRosterRows(state: GameState, teamKey: string): PlayerContractRow[] {
  const ids = state.league.teamRosters[teamKey] ?? [];
  return ids
    .map((id) => playerContractRowFromLeague(state, id))
    .filter((row): row is PlayerContractRow => row !== null)
    .sort((a, b) => b.overall - a.overall || a.playerName.localeCompare(b.playerName));
}

export function buildFreeAgentPool(state: GameState): PlayerContractRow[] {
  const userTeam = resolveTeamKey(state.franchise.ugfTeamKey || state.franchise.excelTeamKey || "");
  const onUserRoster = new Set(state.league.teamRosters[userTeam] ?? []);
  const teamNameById = new Map(getTeams().map((team) => [team.teamId, team.name]));

  const fromData = getPlayers().map((row) => {
    const name = sanitizeForbiddenName(String(row.fullName ?? "").trim());
    const position = String(row.pos ?? "UNK").trim() || "UNK";
    const overall = toNumber(row.overall, 65);
    const age = toNumber(row.age, 25);
    const teamKey = resolveTeamKey(String(teamNameById.get(String(row.teamId ?? "")) ?? row.teamId ?? ""));
    const rowTeam = row.teamId === "FREE_AGENT" || teamKey === "UNKNOWN_TEAM" ? null : teamKey;
    const id = String(row.playerId ?? stableHash(`${name}:${position}:${age}`));
    const pending = String(row.status ?? "").toUpperCase() === "PENDING_FREE_AGENT";
    return {
      id,
      playerName: name,
      position,
      overall,
      age,
      years: askYearsFromOverall(overall),
      salary: Math.max(0, Math.round(askSalaryFromOverall(overall))),
      teamKey: rowTeam,
      contractStatus: rowTeam ? "ACTIVE" : "FREE_AGENT",
      needsResign: pending,
    } satisfies PlayerContractRow;
  });

  const leagueFreeAgents = Object.values(state.league.playersById)
    .filter((player) => !player.teamKey || !state.league.teamRosters[player.teamKey]?.includes(player.id))
    .map((player) => playerContractRowFromLeague(state, player.id))
    .filter((row): row is PlayerContractRow => row !== null)
    .map((row) => ({ ...row, teamKey: null, contractStatus: "FREE_AGENT" as const }));

  const releasedFromGameplay = state.freeAgency?.freeAgents ?? [];
  const combined = [...fromData.filter((row) => row.contractStatus === "FREE_AGENT"), ...leagueFreeAgents, ...releasedFromGameplay]
    .filter((row) => row.playerName)
    .filter((row) => !onUserRoster.has(row.id))
    .map((row) => ({ ...row, teamKey: null, contractStatus: "FREE_AGENT" as const }));

  const unique = new Map<string, PlayerContractRow>();
  for (const row of combined) {
    const key = row.id || stableHash(`${row.playerName}:${row.position}:${row.age}`);
    if (!unique.has(key)) unique.set(key, { ...row, id: key });
  }

  return [...unique.values()].sort((a, b) => b.overall - a.overall || a.playerName.localeCompare(b.playerName)).slice(0, MAX_FREE_AGENTS);
}
