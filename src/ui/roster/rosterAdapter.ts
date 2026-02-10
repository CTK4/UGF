import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";

export const ROSTER_CAP_LIMIT = 255_000_000;

export type RosterPlayerStatus = "ACTIVE" | "RELEASED";

export type RosterPlayerRecord = {
  id: string;
  name: string;
  pos: string;
  age: number;
  overall: number;
  yearsLeft: number;
  salary: number;
  bonus: number;
  capHit: number;
  status: RosterPlayerStatus;
};

type GenericRow = Record<string, unknown>;

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function firstString(row: GenericRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function firstNumber(row: GenericRow, keys: string[]): number {
  for (const key of keys) {
    const value = row[key];
    const parsed = asNumber(value);
    if (parsed) return parsed;
    if (value === 0) return 0;
  }
  return 0;
}

function parseRosterRows(payload: unknown): GenericRow[] {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is GenericRow => typeof row === "object" && row !== null);
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.rows)) {
      return obj.rows.filter((row): row is GenericRow => typeof row === "object" && row !== null);
    }
    if (Array.isArray(obj.players)) {
      return obj.players.filter((row): row is GenericRow => typeof row === "object" && row !== null);
    }
  }
  return [];
}

export async function loadRosterPlayersForTeam(teamLookup: string): Promise<{ players: RosterPlayerRecord[]; warning?: string }> {
  const resolvedTeamKey = resolveTeamKey(teamLookup);
  const rosterRes = await fetch("/rosters");
  if (!rosterRes.ok) {
    const warning = `Roster data is unavailable (${rosterRes.status}).`;
    if (import.meta.env.DEV) {
      console.warn("[rosterAdapter] Failed to load /rosters", { status: rosterRes.status });
    }
    return { players: [], warning };
  }

  const raw = (await rosterRes.json()) as unknown;
  const rows = parseRosterRows(raw);
  if (!rows.length) {
    const warning = "Roster source loaded but no rows were found.";
    if (import.meta.env.DEV) {
      console.warn("[rosterAdapter] Parsed zero rows from /rosters.");
    }
    return { players: [], warning };
  }

  const teamRows = rows.filter((row) => {
    const teamValue = firstString(row, ["Team", "team", "TeamName", "franchise", "club"]);
    const normalizedKey = resolveTeamKey(teamValue || normalizeExcelTeamKey(teamValue));
    return normalizedKey === resolvedTeamKey;
  });

  if (!teamRows.length) {
    const warning = `No roster rows matched team ${resolvedTeamKey}.`;
    if (import.meta.env.DEV) {
      const sampleTeams = rows.slice(0, 8).map((row) => firstString(row, ["Team", "team", "TeamName"]));
      console.warn("[rosterAdapter] Team match failed.", { teamLookup, resolvedTeamKey, sampleTeams });
    }
    return { players: [], warning };
  }

  const players = teamRows.map((row, index): RosterPlayerRecord => {
    const id = firstString(row, ["Player ID", "playerId", "id", "PlayerId"]) || `${resolvedTeamKey}-${index + 1}`;
    const salary = firstNumber(row, ["AAV", "Salary", "salary", "CapHit", "capHit"]);
    const bonus = firstNumber(row, ["Total_Guarantee", "Bonus", "bonus", "SigningBonus"]);
    const capHit = firstNumber(row, ["CapHit", "capHit", "AAV", "salary"]) || salary;

    return {
      id,
      name: firstString(row, ["PlayerName", "name", "player", "Name"]) || `Player ${index + 1}`,
      pos: firstString(row, ["Position", "pos", "Pos", "PositionGroup"]) || "UNK",
      age: Math.round(firstNumber(row, ["Age", "age"])),
      overall: Math.round(firstNumber(row, ["Rating", "overall", "OVR"])),
      yearsLeft: Math.max(0, Math.round(firstNumber(row, ["ContractYearsRemaining", "yearsLeft", "YearsLeft"]))),
      salary,
      bonus,
      capHit,
      status: "ACTIVE",
    };
  });

  return { players };
}

export function calculateRosterCap(players: RosterPlayerRecord[], deadMoney: Array<{ amount: number }>, capLimit: number) {
  const payroll = players.filter((p) => p.status !== "RELEASED").reduce((sum, player) => sum + player.capHit, 0);
  const dead = deadMoney.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const totalPayroll = payroll + dead;
  return {
    capLimit,
    payroll: totalPayroll,
    capSpace: capLimit - totalPayroll,
  };
}
