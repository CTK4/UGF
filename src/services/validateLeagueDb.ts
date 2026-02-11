import type { LeagueState } from "@/engine/gameState";

export function validateLeagueDb(world: LeagueState): string[] {
  const errors: string[] = [];

  const teamIds = new Set(Object.keys(world.teamsById ?? {}));
  const playerIds = new Set(Object.keys(world.playersById ?? {}));
  const personnelIds = new Set(Object.keys(world.personnelById ?? {}));
  const seenContractIds = new Set<string>();

  for (const [teamKey, roster] of Object.entries(world.teamRosters ?? {})) {
    if (!roster.length) continue;
    if (!teamKey) errors.push("Team roster entry has empty team key.");
    for (const playerId of roster) {
      const player = world.playersById[playerId];
      if (!player) {
        errors.push(`Roster references missing player: ${playerId}`);
        continue;
      }
      if (player.teamKey !== teamKey) {
        errors.push(`Player ${playerId} team mismatch: player.teamKey=${player.teamKey}, rosterTeam=${teamKey}`);
      }
    }
  }

  for (const [playerId, player] of Object.entries(world.playersById ?? {})) {
    if (player.teamKey && !teamIds.has(player.teamKey)) {
      errors.push(`Player ${playerId} references unknown team ${player.teamKey}`);
    }
  }

  for (const [contractId, contract] of Object.entries(world.contractsById ?? {})) {
    const effectiveId = String(contract.contractId ?? contractId);
    if (seenContractIds.has(effectiveId) && import.meta.env.DEV) {
      console.warn("[validateLeagueDb] Duplicate contractId detected.", { contractId: effectiveId });
    }
    seenContractIds.add(effectiveId);
    if (!contract.entityId) errors.push(`Contract ${contractId} missing entityId.`);
    if (contract.teamId && !teamIds.has(contract.teamId)) {
      errors.push(`Contract ${contractId} references unknown team ${contract.teamId}`);
    }
    const type = String(contract.entityType ?? "").toUpperCase();
    if (type === "PLAYER" && !playerIds.has(contract.entityId)) {
      errors.push(`Player contract ${contractId} references missing player ${contract.entityId}`);
    }
    if (type === "PERSONNEL" && !personnelIds.has(contract.entityId)) {
      errors.push(`Personnel contract ${contractId} references missing personnel ${contract.entityId}`);
    }
  }

  for (const [personId, person] of Object.entries(world.personnelById ?? {})) {
    if (person.teamId && person.teamId !== "FREE_AGENT" && !teamIds.has(person.teamId)) {
      errors.push(`Personnel ${personId} references unknown team ${person.teamId}`);
    }
  }

  for (const [season, picks] of Object.entries(world.draftOrderBySeason ?? {})) {
    for (const pick of picks) {
      if (!teamIds.has(pick.teamId)) {
        errors.push(`Draft order ${season} R${pick.round}P${pick.pick} references unknown team ${pick.teamId}`);
      }
    }
  }

  if (Number(world.cap?.salaryCap ?? 0) !== 250_000_000) {
    errors.push(`Salary cap mismatch: expected 250000000, got ${world.cap?.salaryCap}`);
  }

  return errors;
}
