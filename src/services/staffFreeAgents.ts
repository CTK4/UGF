/**
 * Coach pool sourced from src/data/leagueDb/leagueDB.json.
 */

import leagueDb from "@/data/leagueDb/leagueDB.json";

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
  | "ASST";

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
  contractId: string | number | null;
};

type LeagueDbJson = {
  tables?: {
    Personnel?: CoachRow[];
  };
};

export function normalizeStaffRole(raw: string): StaffRole | null {
  const r = String(raw ?? "").trim().toLowerCase();
  if (!r) return null;

  if (r === "oc" || r.includes("offensive coordinator")) return "OC";
  if (r === "dc" || r.includes("defensive coordinator")) return "DC";
  if (r === "stc" || r.includes("special teams")) return "STC";

  if (r === "qb" || r.includes("qb")) return "QB";
  if (r === "rb" || r.includes("rb")) return "RB";
  if (r === "wr" || r.includes("wr")) return "WR";
  if (r === "ol" || r.includes("ol")) return "OL";
  if (r === "dl" || r.includes("dl")) return "DL";
  if (r === "lb" || r.includes("lb")) return "LB";
  if (r === "db" || r.includes("db")) return "DB";

  if (r === "hc" || r.includes("head coach")) return "HC";

  if (r === "asst" || r.includes("assistant")) return "ASST";

  return null;
}

export function loadPersonnelRows(): CoachRow[] {
  const db = leagueDb as unknown as LeagueDbJson;
  return db.tables?.Personnel ?? [];
}

function isFreeAgentRow(row: Pick<CoachRow, "teamId" | "status">): boolean {
  const s = String(row.status ?? "").trim().toLowerCase();
  if (s === "fa" || s === "free agent" || s === "freeagent") return true;
  return row.teamId === null || row.teamId === undefined || String(row.teamId).trim() === "";
}

export function loadCoachFreeAgents(): CoachFreeAgent[] {
  const rows = loadPersonnelRows();
  const out: CoachFreeAgent[] = [];

  for (const row of rows) {
    const role = normalizeStaffRole(String(row.role ?? ""));
    if (!role) continue;
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
      contractId: row.contractId ?? null,
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
