import type { StaffRole } from "@/domain/staffRoles";
import { loadCoachFreeAgents } from "@/services/staffFreeAgents";
import { createNewCoachContract, salaryForContractInSeason, type CoachContract } from "@/services/coachContracts";

const CPU_COORD_ROLES: StaffRole[] = ["OC", "DC", "STC"];
const CPU_ASSIST_ROLES: StaffRole[] = ["QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];

function isOffseason(gameState: any): boolean {
  const phase = String(gameState?.time?.phase ?? gameState?.phase ?? "").toLowerCase();
  if (phase.includes("offseason") || phase.includes("january") || phase.includes("free") || phase.includes("draft") || phase.includes("preseason")) return true;
  const week = Number(gameState?.time?.week ?? 1);
  return week >= 1 && week <= 4;
}

function recomputeBudgetUsed(staff: any, season: number) {
  const contracts: Record<string, CoachContract> = staff.coachContractsById ?? {};
  let used = 0;
  for (const c of Object.values(contracts)) used += salaryForContractInSeason(c, season);
  staff.budgetUsed = used;
}

function getTeams(gameState: any): Array<{ teamId: string; staff: any }> {
  const byTeam = gameState?.staff?.byTeamId;
  if (!byTeam || typeof byTeam !== "object") return [];
  return Object.entries(byTeam).map(([teamId, staff]) => ({ teamId, staff }));
}

function demandForRole(role: StaffRole): number {
  if (role === "OC" || role === "DC") return 2_100_000;
  if (role === "STC") return 1_200_000;
  if (role === "ASST") return 700_000;
  return 900_000;
}

function chooseCandidate(role: StaffRole, pool: ReturnType<typeof loadCoachFreeAgents>, remaining: number) {
  const fit = pool.find((fa) => fa.role === role && remaining >= demandForRole(role));
  return fit ?? null;
}

function maybeHireRole(gameState: any, teamId: string, staff: any, role: StaffRole, pool: ReturnType<typeof loadCoachFreeAgents>, season: number) {
  if (staff.assignments?.[role]) return;
  const remaining = Number(staff.budgetTotal ?? 0) - Number(staff.budgetUsed ?? 0);
  if (remaining <= 0) return;
  const pick = chooseCandidate(role, pool, remaining);
  if (!pick) return;

  staff.nextCoachContractId = Number(staff.nextCoachContractId ?? 1);
  const contractId = `CPU_COACH_CONTRACT_${teamId}_${staff.nextCoachContractId++}`;
  const cc = createNewCoachContract({
    contractId,
    entityId: String(pick.id),
    teamId,
    startSeason: season,
    years: role === "OC" || role === "DC" ? 3 : 2,
    salaryY1: demandForRole(role),
  });

  staff.coachContractsById = staff.coachContractsById ?? {};
  staff.coachContractsById[contractId] = cc;
  staff.assignments = staff.assignments ?? {};
  staff.assignments[role] = {
    coachId: String(pick.id),
    coachName: pick.name,
    role,
    coachContractId: contractId,
  };
}

export function runCpuStaffHiring(gameState: any) {
  const season = Number(gameState?.time?.season ?? gameState?.season ?? 2026);
  const offseason = isOffseason(gameState);
  const teams = getTeams(gameState);
  if (!teams.length) return;

  const faPool = loadCoachFreeAgents().filter((fa) => fa.role !== "HC");

  for (const { teamId, staff } of teams) {
    staff.assignments = staff.assignments ?? {};
    staff.coachContractsById = staff.coachContractsById ?? {};
    recomputeBudgetUsed(staff, season);

    for (const role of CPU_COORD_ROLES) maybeHireRole(gameState, teamId, staff, role, faPool, season);
    if (!offseason) continue;
    for (const role of CPU_ASSIST_ROLES) maybeHireRole(gameState, teamId, staff, role, faPool, season);

    recomputeBudgetUsed(staff, season);
  }
}
