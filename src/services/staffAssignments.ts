/**
 * Hydrates initial staff assignments for teams from leagueDB Personnel rows.
 *
 * - buildStaffAssignmentsForTeam(teamId): OC/DC/STC + assistants if available.
 * - buildLeagueCoordinatorAssignments(): OC/DC/STC for all teams (CPU realism).
 */

import type { StaffRole } from "@/domain/staffRoles";
import { loadPersonnelRows, normalizeStaffRole, type CoachRow } from "@/services/staffFreeAgents";

export type StaffAssignment = {
  coachId: string;
  coachName: string;
  role: StaffRole;
  scheme?: string | null;
  reputation?: number | null;
  age?: number | null;
  contractId?: string | null;
};

export type StaffAssignments = Partial<Record<StaffRole, StaffAssignment>>;

function seededTieBreak(seed: number, s: string): number {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
    h >>>= 0;
  }
  return h / 0xffffffff;
}

function repScore(row: CoachRow): number {
  return Number(row.reputation ?? 50);
}

function pickBest(rows: CoachRow[], seed: number): CoachRow | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => {
    const da = repScore(a);
    const db = repScore(b);
    if (db !== da) return db - da;
    return seededTieBreak(seed, String(b.personId ?? b.fullName ?? "")) - seededTieBreak(seed, String(a.personId ?? a.fullName ?? ""));
  });
  return sorted[0] ?? null;
}

function assignmentFromRow(role: StaffRole, row: CoachRow): StaffAssignment {
  return {
    coachId: String(row.personId ?? ""),
    coachName: String(row.fullName ?? "Coach"),
    role,
    scheme: row.scheme ?? null,
    reputation: row.reputation ?? null,
    age: row.age ?? null,
    contractId: row.contractId != null ? String(row.contractId) : null,
  };
}

export function buildStaffAssignmentsForTeam(teamId: string | number, seed: number): StaffAssignments {
  const all = loadPersonnelRows();
  const teamRows = all.filter((r) => String(r.teamId ?? "") === String(teamId ?? ""));

  const byRole = new Map<StaffRole, CoachRow[]>();
  for (const r of teamRows) {
    const role = normalizeStaffRole(String(r.role ?? ""));
    if (!role) continue;
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)?.push(r);
  }

  const want: StaffRole[] = ["OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];

  const out: StaffAssignments = {};
  for (const role of want) {
    const pick = pickBest(byRole.get(role) ?? [], seed + want.indexOf(role) * 101);
    if (!pick) continue;
    out[role] = assignmentFromRow(role, pick);
  }

  return out;
}

export function buildLeagueCoordinatorAssignments(seed: number): Record<string, StaffAssignments> {
  const all = loadPersonnelRows();
  const teamIds = Array.from(new Set(all.map((r) => String(r.teamId ?? "")).filter((x) => x && x !== "null")));

  const out: Record<string, StaffAssignments> = {};
  for (const teamId of teamIds) {
    const teamRows = all.filter((r) => String(r.teamId ?? "") === teamId);
    const byRole = new Map<StaffRole, CoachRow[]>();
    for (const r of teamRows) {
      const role = normalizeStaffRole(String(r.role ?? ""));
      if (!role) continue;
      if (!byRole.has(role)) byRole.set(role, []);
      byRole.get(role)?.push(r);
    }

    const want: StaffRole[] = ["OC", "DC", "STC"];
    const assn: StaffAssignments = {};
    for (const role of want) {
      const pick = pickBest(byRole.get(role) ?? [], seed + want.indexOf(role) * 777);
      if (!pick) continue;
      assn[role] = assignmentFromRow(role, pick);
    }
    out[teamId] = assn;
  }

  return out;
}
