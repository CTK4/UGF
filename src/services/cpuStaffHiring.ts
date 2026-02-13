import { ASSISTANT_STAFF_ROLES, MANDATORY_STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { GameState, StaffAssignment } from "@/engine/gameState";
import { createNewCoachContract, salaryForContractInSeason, type CoachContract } from "@/services/coachContracts";
import { loadCoachFreeAgents, type CoachFreeAgent } from "@/services/staffFreeAgents";

function hash(seed: number, s: string): number {
  let h = seed ^ 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 0xffffffff;
}

function isOffseason(gameState: GameState): boolean {
  return gameState.phase !== "REGULAR_SEASON";
}

function deriveRating(fa: CoachFreeAgent, role: StaffRole, seed: number): number {
  const rep = Number(fa.reputation ?? 60);
  const ageAdj = Number(fa.age ?? 45) > 64 ? -4 : 0;
  const fit = fa.role === role || (role === "ASST" && fa.role !== "HC") ? 5 : -3;
  return Math.max(45, Math.min(99, Math.round(rep + ageAdj + fit + hash(seed, `${fa.id}:${role}`) * 6)));
}

function salaryFor(role: StaffRole, rating: number): number {
  const base = role === "OC" || role === "DC" ? 2_200_000 : role === "STC" ? 1_200_000 : role === "QB" ? 950_000 : role === "ASST" ? 700_000 : 800_000;
  return Math.max(350_000, Math.round(base + (rating - 70) * 18_000));
}

function isVacant(bucket: any, role: StaffRole): boolean {
  return !bucket.assignments?.[role];
}

export function runCpuStaffHiring(gameState: GameState): GameState {
  const staff = gameState.staff as any;
  const week = Number(gameState.time.week ?? 1);
  const season = Number(gameState.time.season ?? 2026);
  if (Number(staff.lastCpuHiringWeek ?? -1) === week) return gameState;

  const byTeamId = staff.byTeamId ?? {};
  const userTeamId = String(gameState.franchise.ugfTeamKey || gameState.franchise.excelTeamKey || "");
  const weeklyPool = loadCoachFreeAgents().filter((fa) => fa.role !== "HC");

  for (const [teamId, bucket] of Object.entries<any>(byTeamId)) {
    if (teamId === userTeamId) continue;
    bucket.assignments = bucket.assignments ?? {};
    bucket.coachContractsById = bucket.coachContractsById ?? {};
    bucket.nextCoachContractId = Number(bucket.nextCoachContractId ?? 1);

    for (const [contractId, contract] of Object.entries<CoachContract>(bucket.coachContractsById)) {
      if (season <= Number(contract.endSeason ?? season)) continue;
      delete bucket.coachContractsById[contractId];
      for (const role of Object.keys(bucket.assignments)) {
        const assigned = bucket.assignments[role] as (StaffAssignment & { coachContractId?: string }) | null;
        if (assigned?.coachContractId === contractId) bucket.assignments[role] = null;
      }
    }

    bucket.budgetUsed = Object.values<CoachContract>(bucket.coachContractsById).reduce((sum, contract) => sum + salaryForContractInSeason(contract, season), 0);

    const fillRoles = [...MANDATORY_STAFF_ROLES, ...(isOffseason(gameState) ? ASSISTANT_STAFF_ROLES : [])];
    for (const role of fillRoles) {
      if (!isVacant(bucket, role)) continue;
      const candidates = weeklyPool
        .map((fa) => {
          const rating = deriveRating(fa, role, season);
          const salary = salaryFor(role, rating);
          const value = rating / Math.max(1, salary / 1_000_000);
          return { fa, rating, salary, value, tie: hash(season, `${teamId}:${role}:${fa.id}`) };
        })
        .sort((a, b) => b.value - a.value || b.rating - a.rating || b.tie - a.tie);

      const chosen = candidates.find((c) => bucket.budgetUsed + c.salary <= Number(bucket.budgetTotal ?? 18_000_000));
      if (!chosen) continue;
      const index = weeklyPool.findIndex((fa) => fa.id === chosen.fa.id);
      if (index >= 0) weeklyPool.splice(index, 1);

      const years = role === "OC" || role === "DC" ? 3 : 2;
      const contractId = `CPU_COACH_CONTRACT_${teamId}_${bucket.nextCoachContractId++}`;
      const cc = createNewCoachContract({ contractId, entityId: chosen.fa.id, teamId, startSeason: season, years, salaryY1: chosen.salary });
      bucket.coachContractsById[contractId] = cc;
      bucket.budgetUsed += chosen.salary;
      bucket.assignments[role] = {
        candidateId: chosen.fa.id,
        coachName: chosen.fa.name,
        salary: chosen.salary,
        years,
        hiredWeek: week,
        coachContractId: contractId,
      };
    }
  }

  staff.lastCpuHiringWeek = week;
  return gameState;
}
