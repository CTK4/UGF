import type { LeaguePlayer } from "@/engine/gameState";

export const DEFAULT_SALARY_CAP = 200_000_000;

export function sumCapByTeam(playersById: Record<string, LeaguePlayer>): Record<string, number> {
  const capUsedByTeam: Record<string, number> = {};
  for (const player of Object.values(playersById)) {
    const teamKey = player.teamKey;
    capUsedByTeam[teamKey] = (capUsedByTeam[teamKey] ?? 0) + Number(player.contract.amount ?? 0);
  }
  return capUsedByTeam;
}

export function capSpaceForTeam(teamKey: string, capUsedByTeam: Record<string, number>, salaryCap = DEFAULT_SALARY_CAP): number {
  return salaryCap - (capUsedByTeam[teamKey] ?? 0);
}
