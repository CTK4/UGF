import type { LeagueContract, LeagueState } from "@/engine/gameState";

function isActivePlayerContract(contract: LeagueContract, season: number): boolean {
  const endSeason = Number(contract.endSeason);
  const hasFutureTerm = Number.isFinite(endSeason) && endSeason >= season;
  return hasFutureTerm || contract.isExpired !== true;
}

export function validateLeagueDb(world: LeagueState): string[] {
  const errors: string[] = [];

  const teamIds = new Set(Object.keys(world.teamsById ?? {}));
  const playerIds = new Set(Object.keys(world.playersById ?? {}));
  const personnelIds = new Set(Object.keys(world.personnelById ?? {}));

  const playerIdToRosterTeams = new Map<string, string[]>();
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

      const teams = playerIdToRosterTeams.get(playerId) ?? [];
      teams.push(teamKey);
      playerIdToRosterTeams.set(playerId, teams);
    }
  }

  for (const [playerId, teams] of playerIdToRosterTeams.entries()) {
    if (teams.length > 1) {
      errors.push(`Roster exclusivity violation: player ${playerId} appears in multiple team rosters (${teams.join(", ")})`);
    }
  }

  for (const [playerId, player] of Object.entries(world.playersById ?? {})) {
    if (player.teamKey && !teamIds.has(player.teamKey)) {
      errors.push(`Player ${playerId} references unknown team ${player.teamKey}`);
    }

    if (!player.teamKey) continue;
    const rosterTeams = playerIdToRosterTeams.get(playerId) ?? [];
    if (rosterTeams.length !== 1) {
      errors.push(`Roster coverage violation: player ${playerId} with teamKey=${player.teamKey} appears in ${rosterTeams.length} rosters`);
    }
  }

  const contractIdCounts = new Map<string, number>();
  const activePlayerContractsByPlayerId = new Map<string, string[]>();
  for (const [contractId, contract] of Object.entries(world.contractsById ?? {})) {
    const effectiveId = String(contract.contractId ?? contractId).trim();
    contractIdCounts.set(effectiveId, (contractIdCounts.get(effectiveId) ?? 0) + 1);

    if (!contract.entityId) errors.push(`Contract ${contractId} missing entityId.`);
    if (contract.teamId && !teamIds.has(contract.teamId)) {
      errors.push(`Contract ${contractId} references unknown team ${contract.teamId}`);
    }

    const type = String(contract.entityType ?? "").toUpperCase();
    if (type === "PLAYER") {
      if (!playerIds.has(contract.entityId)) {
        errors.push(`Player contract ${contractId} references missing player ${contract.entityId}`);
      }
      if (isActivePlayerContract(contract, Number(world.draftOrderBySeason?.[Object.keys(world.draftOrderBySeason ?? {})[0]]?.[0]?.season ?? 2026))) {
        const ids = activePlayerContractsByPlayerId.get(contract.entityId) ?? [];
        ids.push(effectiveId || contractId);
        activePlayerContractsByPlayerId.set(contract.entityId, ids);
      }
    }
    if (type === "PERSONNEL" && !personnelIds.has(contract.entityId)) {
      errors.push(`Personnel contract ${contractId} references missing personnel ${contract.entityId}`);
    }
  }

  for (const [effectiveId, count] of contractIdCounts.entries()) {
    if (!effectiveId) {
      errors.push("Contract ID collision: empty contractId detected in contractsById map values.");
      continue;
    }
    if (count > 1) {
      errors.push(`Contract ID collision: contractId ${effectiveId} appears ${count} times in contractsById values`);
    }
  }

  for (const [playerId, contractIds] of activePlayerContractsByPlayerId.entries()) {
    if (contractIds.length > 1) {
      errors.push(`Active contract uniqueness violation for player ${playerId}: ${contractIds.join(", ")}`);
    }
  }

  for (const [personId, person] of Object.entries(world.personnelById ?? {})) {
    if (person.teamId && person.teamId !== "FREE_AGENT" && !teamIds.has(person.teamId)) {
      errors.push(`Personnel ${personId} references unknown team ${person.teamId}`);
    }
  }

  const draftSlotSeen = new Set<string>();
  for (const [season, picks] of Object.entries(world.draftOrderBySeason ?? {})) {
    for (const pick of picks) {
      if (!teamIds.has(pick.teamId)) {
        errors.push(`Draft order ${season} R${pick.round}P${pick.pick} references unknown team ${pick.teamId}`);
      }
      const slotKey = `${pick.season}:${pick.round}:${pick.pick}`;
      if (draftSlotSeen.has(slotKey)) {
        errors.push(`Draft order uniqueness violation: duplicate slot ${slotKey}`);
      }
      draftSlotSeen.add(slotKey);
    }
  }

  const playerValueIds = new Map<string, number>();
  for (const [playerMapKey, player] of Object.entries(world.playersById ?? {})) {
    const id = String(player.id ?? playerMapKey);
    playerValueIds.set(id, (playerValueIds.get(id) ?? 0) + 1);
  }
  for (const [id, count] of playerValueIds.entries()) {
    if (count > 1) {
      errors.push(`Player ID collision: player.id ${id} appears ${count} times in playersById values`);
    }
  }

  const personnelValueIds = new Map<string, number>();
  for (const [personMapKey, person] of Object.entries(world.personnelById ?? {})) {
    const id = String(person.personId ?? person.id ?? personMapKey);
    personnelValueIds.set(id, (personnelValueIds.get(id) ?? 0) + 1);
  }
  for (const [id, count] of personnelValueIds.entries()) {
    if (count > 1) {
      errors.push(`Personnel ID collision: personId ${id} appears ${count} times in personnelById values`);
    }
  }

  if (Number(world.cap?.salaryCap ?? 0) !== 250_000_000) {
    errors.push(`Salary cap mismatch: expected 250000000, got ${world.cap?.salaryCap}`);
  }

  return errors;
}
