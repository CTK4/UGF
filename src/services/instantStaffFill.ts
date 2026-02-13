import type { StaffRole } from "@/domain/staffRoles";
import type { GameState, StaffAssignment } from "@/engine/gameState";
import { buildExistingContractsIndex, contractRowToCoachContract, findExistingCoachContractRow, salaryForContractInSeason, type CoachContract } from "@/services/coachContracts";
import { buildStaffAssignmentsForTeam, buildLeagueCoordinatorAssignments } from "@/services/staffAssignments";
import { loadPersonnelRows } from "@/services/staffFreeAgents";

export type TeamStaffBucket = {
  assignments: Partial<Record<StaffRole, (StaffAssignment & { coachContractId?: string; contractId?: string }) | null>>;
  budgetTotal: number;
  budgetUsed: number;
  coachContractsById: Record<string, CoachContract>;
  nextCoachContractId: number;
};

export function hydrateLeagueStaffFromPersonnel(gameState: GameState): void {
  const rows = loadPersonnelRows();
  const contracts = buildExistingContractsIndex();
  const teamIds = Array.from(new Set(rows.map((r) => String(r.teamId ?? "")).filter(Boolean)));
  const season = Number(gameState.time.season ?? 2026);
  const byTeamId: Record<string, TeamStaffBucket> = {};
  const requiredRoles: StaffRole[] = ["OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];
  const contractsByPersonId = new Map<string, CoachContract[]>();

  for (const contract of contracts.values()) {
    const key = String(contract.personId ?? "").trim();
    if (!key) continue;
    const arr = contractsByPersonId.get(key) ?? [];
    arr.push(contract);
    contractsByPersonId.set(key, arr);
  }

  for (const teamId of teamIds) {
    const assignments = buildStaffAssignmentsForTeam(teamId, Number(gameState.world?.leagueSeed ?? 1337));
    const coachContractsById: Record<string, CoachContract> = {};
    let budgetUsed = 0;

    for (const assignment of Object.values(assignments)) {
      if (!assignment) continue;
      const contractId = String((assignment as any).contractId ?? "");
      const existing = contractId
        ? (
        contracts.get(contractId) ??
        (() => {
          const row = findExistingCoachContractRow(contractId);
          return row ? contractRowToCoachContract(row) ?? undefined : undefined;
        })()
      )
        : contractsByPersonId
            .get(String(assignment.coachId ?? ""))
            ?.find((c) => String(c.teamId) === teamId && season >= Number(c.startSeason) && season <= Number(c.endSeason));
      if (!existing) continue;
      coachContractsById[existing.contractId] = existing;
      budgetUsed += salaryForContractInSeason(existing, season);
    }

    const missingRoles = requiredRoles.filter((role) => !assignments[role]);
    if (missingRoles.length) {
      console.warn(`[staff] team ${teamId} missing required personnel roles: ${missingRoles.join(", ")}`);
    }

    byTeamId[teamId] = {
      assignments: assignments as TeamStaffBucket["assignments"],
      budgetTotal: Number(gameState.staff.budgetTotal ?? 18_000_000),
      budgetUsed,
      coachContractsById,
      nextCoachContractId: 1,
    };
  }

  (gameState.staff as any).byTeamId = byTeamId;
  (gameState.staff as any).leagueAssignmentsByTeamId = buildLeagueCoordinatorAssignments(Number(gameState.world?.leagueSeed ?? 1337));
}

export function hydrateUserStaffFromTeamBucket(gameState: GameState, teamId: string): void {
  const bucket = (gameState.staff as any).byTeamId?.[teamId] as TeamStaffBucket | undefined;
  if (!bucket) return;

  gameState.staff.assignments = {
    ...gameState.staff.assignments,
    ...(bucket.assignments as Record<StaffRole, StaffAssignment | null>),
  };
  (gameState.staff as any).coachContractsById = {
    ...((gameState.staff as any).coachContractsById ?? {}),
    ...bucket.coachContractsById,
  };
  gameState.staff.budgetUsed = bucket.budgetUsed;
}
