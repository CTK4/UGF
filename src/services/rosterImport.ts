import type { LeaguePlayer, LeagueState } from "@/engine/gameState";
import { DEFAULT_SALARY_CAP, sumCapByTeam } from "@/engine/cap";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";

type RawRosterRow = Record<string, unknown>;

type HydrateInput = {
  teamKey: string;
  excelTeamKey?: string;
  season: number;
  salaryCap?: number;
};

export function sanitizeForbiddenName(value: string): string {
  return String(value ?? "").replace(/Gotham/gi, "Gothic").replace(/Voodoo/gi, "Hex");
}

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function getString(row: RawRosterRow, keys: string[]): string {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  }
  return "";
}

function getNumber(row: RawRosterRow, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = toNumber(row[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function deterministicHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function derivePlayerId(teamKey: string, name: string, pos: string, age?: number): string {
  return `p_${deterministicHash(`${teamKey}:${name}:${pos}:${age ?? "na"}`)}`;
}

function normalizeTeamKey(teamLike: string): string {
  const sanitized = sanitizeForbiddenName(teamLike);
  const resolved = resolveTeamKey(sanitized);
  if (resolved && resolved !== "UNKNOWN_TEAM") return resolved;
  return normalizeExcelTeamKey(sanitized);
}

function deriveContractAmount(overall: number | undefined): number {
  const safeOverall = Math.max(40, Math.min(99, Math.round(overall ?? 65)));
  return 450_000 + safeOverall * 140_000;
}

function normalizeRow(row: RawRosterRow, defaultTeamKey: string, season: number): LeaguePlayer | null {
  const name = sanitizeForbiddenName(getString(row, ["PlayerName", "Name", "playerName"]));
  if (!name) return null;

  const positionGroup = getString(row, ["PositionGroup", "Position", "Pos", "positionGroup", "position"]);
  const pos = getString(row, ["Position", "Pos", "position", "PositionGroup"]) || positionGroup || "UNK";
  const teamFromRow = getString(row, ["Team", "team", "TeamName"]);
  const teamKey = teamFromRow ? normalizeTeamKey(teamFromRow) : defaultTeamKey;

  const overall = getNumber(row, ["Rating", "Overall", "OVR", "overall"]);
  const age = getNumber(row, ["Age", "age"]);
  const yearsLeft = Math.max(
    1,
    Math.round(getNumber(row, ["ContractYearsRemaining", "ContractYearsLeft", "YearsLeft", "Original Contract Length", "contractYearsLeft"]) ?? 1),
  );

  const amountRaw = getNumber(row, ["AAV", "CapHit", "ContractAmount", "Salary", "ContractTotalValue_M"]);
  const amount = amountRaw !== undefined
    ? amountRaw < 10_000 ? amountRaw * 1_000_000 : amountRaw
    : deriveContractAmount(overall);

  const expSeason = season + yearsLeft;
  const rawId = getString(row, ["Player ID", "playerId", "id"]);
  const id = rawId ? `p_${deterministicHash(`${teamKey}:${rawId}`)}` : derivePlayerId(teamKey, name, pos, age);

  return {
    id,
    name,
    positionGroup: positionGroup || pos,
    pos,
    teamKey,
    overall,
    age,
    contract: {
      amount: Math.max(0, Math.round(amount)),
      yearsLeft,
      expSeason,
    },
  };
}

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function asArrayPayload(value: unknown): RawRosterRow[] {
  return Array.isArray(value) ? (value.filter((row) => row && typeof row === "object") as RawRosterRow[]) : [];
}

export async function loadLeagueRosterForTeam(input: HydrateInput): Promise<{ league: LeagueState; warning?: string }> {
  const salaryCap = input.salaryCap ?? DEFAULT_SALARY_CAP;
  const defaultTeamKey = normalizeTeamKey(input.teamKey || input.excelTeamKey || "");
  const keyCandidates = [defaultTeamKey, input.excelTeamKey ?? ""].filter(Boolean);
  const fileCandidates = [...new Set(keyCandidates.map((key) => `/rosters/${normalizeExcelTeamKey(key)}.json`))];

  let rows: RawRosterRow[] = [];
  for (const path of fileCandidates) {
    const payload = asArrayPayload(await fetchJson(path));
    if (payload.length) {
      rows = payload;
      break;
    }
  }

  if (!rows.length) {
    const aggregate = asArrayPayload(await fetchJson("/rosters"));
    rows = aggregate.filter((row) => normalizeTeamKey(getString(row, ["Team", "team", "TeamName"])) === defaultTeamKey);
  }

  const players = rows
    .map((row) => normalizeRow(row, defaultTeamKey, input.season))
    .filter((player): player is LeaguePlayer => player !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  const playersById = Object.fromEntries(players.map((player) => [player.id, player]));
  const teamRosters: Record<string, string[]> = {};
  for (const player of players) {
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

  if (!players.length) {
    return {
      league,
      warning: `Roster data missing for ${defaultTeamKey}, using empty roster.`,
    };
  }

  return { league };
}
