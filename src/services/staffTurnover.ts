import { salaryForContractInSeason, type CoachContract } from "@/services/coachContracts";

type TeamStaffState = {
  assignments: Record<string, any>;
  coachContractsById?: Record<string, CoachContract>;
  budgetUsed: number;
  budgetTotal: number;
};

function recomputeBudgetUsed(staff: TeamStaffState, season: number) {
  const contracts = staff.coachContractsById ?? {};
  let used = 0;
  for (const c of Object.values(contracts)) used += salaryForContractInSeason(c, season);
  staff.budgetUsed = used;
}

export function applyContractExpiryTurnover(gameState: any) {
  const season = Number(gameState?.time?.season ?? gameState?.season ?? 2026);
  const byTeam = gameState?.staff?.byTeamId;
  if (!byTeam || typeof byTeam !== "object") return;

  for (const staff of Object.values(byTeam) as TeamStaffState[]) {
    staff.assignments = staff.assignments ?? {};
    staff.coachContractsById = staff.coachContractsById ?? {};

    for (const [role, a] of Object.entries(staff.assignments)) {
      if (!a) continue;
      const contractId = String((a as any).coachContractId ?? (a as any).contractId ?? "");
      if (!contractId) continue;

      const c = staff.coachContractsById[contractId];
      if (!c) continue;
      if (Number(c.endSeason) < season) {
        delete staff.assignments[role];
        delete staff.coachContractsById[contractId];
      }
    }

    recomputeBudgetUsed(staff, season);
  }
}
