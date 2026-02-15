import { getContracts, getCurrentSeason, getPlayers, getSalaryCap, getTeamById, getTeamByKey } from "@/data/leagueDb";
import type { LeagueState } from "@/engine/gameState";
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


const contractsById = new Map(getContracts().map((row) => [String(row.contractId ?? "").trim(), row]));

const playerContractsByEntityId = new Map(
  getContracts()
    .filter((row) => String(row.entityType ?? "").trim().toUpperCase() === "PLAYER")
    .map((row) => [String(row.entityId ?? "").trim(), row]),
);

function resolveCanonicalTeamId(teamLookup: string): string {
  const raw = String(teamLookup ?? "").trim();
  const direct = getTeamById(raw) ?? getTeamByKey(raw);
  if (direct) return String(direct.teamId);

  const resolved = resolveTeamKey(raw);
  const fromResolved = getTeamById(resolved) ?? getTeamByKey(resolved);
  if (fromResolved) return String(fromResolved.teamId);

  const fromExcel = normalizeExcelTeamKey(raw);
  const excelCanonical = getTeamById(fromExcel) ?? getTeamByKey(fromExcel);
  return String(excelCanonical?.teamId ?? fromExcel);
}

function contractForPlayer(playerId: string, contractId?: string) {
  if (contractId) {
    const byId = contractsById.get(String(contractId));
    if (byId && String(byId.entityType ?? "").trim().toUpperCase() === "PLAYER") return byId;
  }
  return playerContractsByEntityId.get(String(playerId).trim());
}

export async function loadRosterPlayersForTeam(teamLookup: string, league?: LeagueState): Promise<{ players: RosterPlayerRecord[]; warning?: string }> {
  const canonicalTeamId = resolveCanonicalTeamId(teamLookup);
  const teamPlayers = league
    ? Object.values(league.playersById).filter((row) => String(row.teamKey ?? "") === canonicalTeamId).map((row) => ({
        playerId: row.id,
        fullName: row.name,
        pos: row.pos,
        age: row.age,
        overall: row.overall,
      }))
    : getPlayers().filter((row) => String(row.teamId ?? "") === canonicalTeamId);
  if (!teamPlayers.length) {
    return { players: [], warning: `No roster rows matched team ${canonicalTeamId}.` };
  }

  const players = teamPlayers.map((row): RosterPlayerRecord => {
    const id = String(row.playerId ?? "").trim();
    const contract = league
      ? Object.values(league.contractsById ?? {}).find((c) => String(c.entityType ?? "").toUpperCase() === "PLAYER" && String(c.entityId ?? "") === id)
      : contractForPlayer(id, String((row as { contractId?: string }).contractId ?? ""));
    const yearsLeft = Number.isFinite(Number(contract?.endSeason)) ? Math.max(0, Number(contract?.endSeason) - getCurrentSeason() + 1) : 1;
    const salary = Math.max(0, Number(contract?.salaryY1 ?? 0));
    return {
      id,
      name: String(row.fullName ?? "Unknown Player"),
      pos: String(row.pos ?? "UNK"),
      age: Math.max(0, Number(row.age ?? 0)),
      overall: Math.max(0, Number(row.overall ?? 0)),
      yearsLeft,
      salary,
      bonus: Math.max(0, Number(contract?.guaranteed ?? 0)),
      capHit: salary,
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
