import { getRosterRows } from "@/data/generatedData";
import { getSalaryCap } from "@/data/leagueDb";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";

export const ROSTER_CAP_LIMIT = getSalaryCap();

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

export async function loadRosterPlayersForTeam(teamLookup: string): Promise<{ players: RosterPlayerRecord[]; warning?: string }> {
  const resolvedTeamKey = resolveTeamKey(teamLookup);
  const rows = getRosterRows() as GenericRow[];
  if (!rows.length) {
    return { players: [], warning: "LeagueDB roster source has no rows." };
  }

  const teamRows = rows.filter((row) => {
    const teamValue = firstString(row, ["Team", "team", "TeamName", "franchise", "club"]);
    const normalizedKey = resolveTeamKey(teamValue || normalizeExcelTeamKey(teamValue));
    return normalizedKey === resolvedTeamKey;
  });

  if (!teamRows.length) {
    return { players: [], warning: `No roster rows matched team ${resolvedTeamKey}.` };
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
