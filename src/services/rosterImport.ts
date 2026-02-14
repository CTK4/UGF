import { leagueDb } from "@/data/leagueDb";

export function sanitizeForbiddenName(value: string): string {
  return String(value ?? "").replace(/Gotham/gi, "Gothic").replace(/Voodoo/gi, "Hex");
}

function normalizeRow(player: any, season: number) {
  if (!player.playerId) {
    throw new Error(`Missing playerId: ${player.fullName}`);
  }

  const contract = leagueDb.contracts.find(
    (c) =>
      c.entityType === "PLAYER" &&
      (c.entityId === player.playerId || c.personId === player.playerId)
  );

  const amount = contract?.amount ?? contract?.salaryY1 ?? 0;
  const yearsLeft = contract?.yearsLeft ?? 0;

  return {
    id: player.playerId,
    name: player.fullName,
    pos: player.pos,
    teamKey: player.teamId,
    overall: player.overall,
    age: player.age,
    contract: {
      amount,
      yearsLeft,
      expSeason: yearsLeft > 0 ? season + yearsLeft : undefined,
    },
  };
}

export async function loadLeagueRosterForTeam(input: {
  teamKey: string;
  season: number;
  salaryCap?: number;
}) {
  const players = leagueDb.players
    .filter(p => p.teamId === input.teamKey)
    .map(p => normalizeRow(p, input.season));

  const playersById = Object.fromEntries(
    players.map(p => [p.id, p])
  );

  return {
    league: {
      playersById,
      teamRosters: {
        [input.teamKey]: players.map(p => p.id),
      },
    },
  };
}
