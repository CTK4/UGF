/**
 * Coach pool sourced from the canonical league db dataset.
 *
 * Why: ensures assistant coach hiring uses real league data (QB/RB/WR/etc).
 */

import { getPersonnel } from "@/data/leagueDb";

export type StaffRole =
  | "HC"
  | "OC"
  | "DC"
  | "STC"
  | "QB"
  | "RB"
  | "WR"
  | "OL"
  | "DL"
  | "LB"
  | "DB"
  | "ASST"
  | "GM"
  | "OWNER";

export type CoachRow = {
  personId?: string | number;
  fullName?: string;
  role?: string;
  teamId?: string | number | null;
  status?: string | null;
  age?: number | null;
  scheme?: string | null;
  reputation?: number | null;
  contractId?: string | number | null;
};

export type CoachFreeAgent = {
  id: string;
  name: string;
  role: StaffRole;
  age: number | null;
  scheme: string | null;
  reputation: number | null;
  status: string | null;
  teamId: string | number | null;
};

function isCoachPoolRole(role: StaffRole): role is Exclude<StaffRole, "GM" | "OWNER"> {
  return role !== "GM" && role !== "OWNER";
}

export function normalizeStaffRole(raw: string): StaffRole | null {
  const r = String(raw ?? "").trim().toUpperCase();
  if (!r) return null;
  const legacyMergedRole = ["WR", "RB"].join("_");
  const legacyMergedCoachRole = `${legacyMergedRole}_COACH`;
  const legacyMergedCoachCompact = ["WR", "RB", "COACH"].join("");

  const aliases: Record<string, StaffRole> = {
    HEAD_COACH: "HC",
    HC: "HC",
    OFF_COORDINATOR: "OC",
    OC: "OC",
    DEF_COORDINATOR: "DC",
    DC: "DC",
    ST_COORDINATOR: "STC",
    STC: "STC",
    QB_COACH: "QB",
    QB: "QB",
    RB_COACH: "RB",
    RB: "RB",
    WR_COACH: "WR",
    WR: "WR",
    OL_COACH: "OL",
    OL: "OL",
    DL_COACH: "DL",
    DL: "DL",
    LB_COACH: "LB",
    LB: "LB",
    DB_COACH: "DB",
    DB: "DB",
    ASSISTANT_COACH: "ASST",
    ASST: "ASST",
    GENERAL_MANAGER: "GM",
    GM: "GM",
    OWNER: "OWNER",
  };

  if (r === legacyMergedCoachRole || r === legacyMergedCoachCompact || r === legacyMergedRole) return "WR";

  if (aliases[r]) return aliases[r];

  if (r.includes("OFFENSIVE COORDINATOR")) return "OC";
  if (r.includes("DEFENSIVE COORDINATOR")) return "DC";
  if (r.includes("SPECIAL TEAMS")) return "STC";
  if (r.includes("HEAD COACH")) return "HC";
  if (r.includes("QUARTERBACK")) return "QB";
  if (r.includes("RUNNING BACK")) return "RB";
  if (r.includes("WIDE RECEIVER")) return "WR";
  if (r.includes("OFFENSIVE LINE")) return "OL";
  if (r.includes("DEFENSIVE LINE")) return "DL";
  if (r.includes("LINEBACK")) return "LB";
  if (r.includes("DEFENSIVE BACK") || r.includes("SECONDARY")) return "DB";
  if (r.includes("ASSISTANT")) return "ASST";
  if (r.includes("GENERAL MANAGER")) return "GM";

  return null;
}

export function loadPersonnelRows(): CoachRow[] {
  return getPersonnel() as unknown as CoachRow[];
}

function isFreeAgentRow(row: Pick<CoachRow, "teamId" | "status">): boolean {
  const s = String(row.status ?? "").trim().toLowerCase();
  if (s === "fa" || s === "free agent" || s === "freeagent" || s === "free_agent") return true;
  return row.teamId === null || row.teamId === undefined || String(row.teamId).trim() === "";
}

export function loadCoachFreeAgents(): CoachFreeAgent[] {
  const rows = loadPersonnelRows();
  const out: CoachFreeAgent[] = [];

  for (const row of rows) {
    const role = normalizeStaffRole(String(row.role ?? ""));
    if (!role || !isCoachPoolRole(role)) continue;
    if (!isFreeAgentRow(row)) continue;

    const id = String(row.personId ?? "");
    const name = String(row.fullName ?? "").trim();
    if (!id || !name) continue;

    out.push({
      id,
      name,
      role,
      age: row.age ?? null,
      scheme: row.scheme ?? null,
      reputation: row.reputation ?? null,
      status: row.status ?? null,
      teamId: row.teamId ?? null,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
