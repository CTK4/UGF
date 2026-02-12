import { buildLeagueCoordinatorAssignments, buildStaffAssignmentsForTeam } from "@/services/staffAssignments";

const DEFAULT_TEAM_STAFF_BUDGET = 10_000_000;

export function instantFillLeagueStaff(gameState: any) {
  const seed = Number(gameState?.seed ?? gameState?.leagueSeed ?? gameState?.world?.leagueSeed ?? 1337);

  gameState.staff = gameState.staff ?? {};
  gameState.staff.byTeamId = gameState.staff.byTeamId ?? {};

  const coordinatorMap = buildLeagueCoordinatorAssignments(seed);
  const teamIds = Array.from(new Set([...Object.keys(coordinatorMap), ...Object.keys(gameState.staff.byTeamId ?? {})]));

  for (const teamId of teamIds) {
    const teamStaff = (gameState.staff.byTeamId[teamId] =
      gameState.staff.byTeamId[teamId] ?? {
        assignments: {},
        budgetTotal: Number(gameState.staff.budgetTotal ?? DEFAULT_TEAM_STAFF_BUDGET),
        budgetUsed: 0,
        coachContractsById: {},
        nextCoachContractId: 1,
      });

    const assn = buildStaffAssignmentsForTeam(teamId, seed);
    teamStaff.assignments = { ...(teamStaff.assignments ?? {}), ...assn };
  }

  gameState.staff.leagueAssignmentsByTeamId = coordinatorMap;
}
