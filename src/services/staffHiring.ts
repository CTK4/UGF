import personnelData from "@/data/generated/personnel.json";
import teamPersonnelData from "@/data/generated/teamPersonnel.json";
import teamSummaryData from "@/data/generated/teamSummary.json";
import { ASSISTANT_STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { Candidate, OwnerStandard, SaveData, Standards } from "@/ui/types";

type PersonnelRow = { ID: number; DisplayName?: string; Name?: string; Position?: string; Traits?: string; Scheme?: string };
type TeamSummaryRow = { Team?: string; "Cap Space"?: number };

const personnel = personnelData as PersonnelRow[];
const teamPersonnel = teamPersonnelData as Array<Record<string, unknown>>;
const teamSummary = teamSummaryData as TeamSummaryRow[];

const BASE_SALARY_BY_ROLE: Record<StaffRole, number> = {
  HC: 10_000_000,
  OC: 5_000_000,
  DC: 5_000_000,
  STC: 2_000_000,
  QB: 1_200_000,
  RB: 1_200_000,
  WR: 1_200_000,
  OL: 1_200_000,
  DL: 1_200_000,
  LB: 1_200_000,
  DB: 1_200_000,
  ASST: 900_000,
};

function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

function parseTraits(raw: string | undefined): string[] {
  return String(raw ?? "").split(/[|,]/).map((x) => x.trim()).filter(Boolean);
}

function roleFromPosition(position: string | undefined, id: number): StaffRole {
  const p = String(position ?? "").toLowerCase();
  if (p.includes("head coach") || p === "hc") return "HC";
  if (p.includes("offensive coordinator") || p === "oc") return "OC";
  if (p.includes("defensive coordinator") || p === "dc") return "DC";
  if (p.includes("special teams") || p.includes("st coordinator") || p === "st") return "STC";
  if (p.includes("qb coach") || p.includes("quarterback")) return "QB";
  if (p.includes("rb coach") || p.includes("running back")) return "RB";
  if (p.includes("wr coach") || p.includes("wide receiver")) return "WR";
  if (p.includes("ol coach") || p.includes("offensive line")) return "OL";
  if (p.includes("dl coach") || p.includes("defensive line")) return "DL";
  if (p.includes("lb coach") || p.includes("linebacker")) return "LB";
  if (p.includes("db coach") || p.includes("secondary")) return "DB";
  if (p.includes("wr/rb")) return hashUnit(`${id}:wr-rb`) < 0.5 ? "WR" : "RB";
  if (p.includes("assistant") || p.includes("position coach") || p.includes("coordinator")) return "ASST";
  return "ASST";
}

function fitLabel(primaryRole: StaffRole, targetRole: StaffRole): Candidate["fitLabel"] {
  if (primaryRole === targetRole) return "Natural Fit";
  if (ASSISTANT_STAFF_ROLES.includes(primaryRole) && ASSISTANT_STAFF_ROLES.includes(targetRole)) return "Cross-Train";
  if (["OC", "DC", "STC"].includes(primaryRole) && ASSISTANT_STAFF_ROLES.includes(targetRole)) return "Cross-Train";
  if (ASSISTANT_STAFF_ROLES.includes(primaryRole) && ["OC", "DC", "STC"].includes(targetRole)) return "Cross-Train";
  return "Out-of-Role";
}

function demandFor(candidate: { id: string; traits: string[]; primaryRole: StaffRole }, targetRole: StaffRole): number {
  let mult = 1;
  const t = candidate.traits.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("veteran") || x.includes("former hc"))) mult += 0.2;
  if (t.some((x) => x.includes("young"))) mult -= 0.1;
  if (t.some((x) => x.includes("high ego") || x.includes("ego"))) mult += 0.15;
  if (t.some((x) => x.includes("teacher"))) mult += 0.05;

  const fit = fitLabel(candidate.primaryRole, targetRole);
  if (fit === "Cross-Train") mult -= 0.05;
  if (fit === "Out-of-Role") mult += 0.2;

  const noise = (hashUnit(`${candidate.id}:${targetRole}:demand`) - 0.5) * 0.16;
  mult += noise;
  return Math.max(250_000, Math.round(BASE_SALARY_BY_ROLE[targetRole] * mult));
}

function employedNamesFromTeamPersonnel(): Set<string> {
  const names = new Set<string>();
  for (const row of teamPersonnel) {
    for (const key of ["Unnamed: 1", "Unnamed: 2", "Unnamed: 3", "Unnamed: 4", "Unnamed: 5"]) {
      const cell = String((row as Record<string, unknown>)[key] ?? "").trim();
      const m = cell.match(/^(.+?)\s*\(/);
      const name = (m ? m[1] : cell).trim();
      if (name && name !== "Team" && !name.startsWith("Unnamed")) names.add(name);
    }
  }
  return names;
}

function recommendedOffer(demand: number, ownerStandard: OwnerStandard): number {
  if (ownerStandard === "Cheap") return Math.round(demand * 0.95);
  if (ownerStandard === "Premium") return Math.round(demand * 1.05);
  return demand;
}

function standardsRisk(standards: Standards, traits: string[]): { meets: boolean; note: string; perceivedRisk: number } {
  const lower = traits.map((t) => t.toLowerCase());
  let risk = 10;
  if (standards.ownerStandard === "Cheap" && lower.some((x) => x.includes("high ego"))) risk += 20;
  if (standards.disciplineStandard === "Strict" && lower.some((x) => x.includes("volatile") || x.includes("impatient"))) risk += 20;
  if (standards.schemeStandard === "Aggressive" && lower.some((x) => x.includes("conservative"))) risk += 10;
  const meets = risk <= 20;
  return { meets, note: meets ? "Meets Standards" : "Risky Hire", perceivedRisk: risk };
}

export function deriveCoachBudgetTotal(franchiseId: string, ownerStandard: OwnerStandard): number {
  const row = teamSummary.find((r) => String(r.Team ?? "") === franchiseId);
  const capSpace = Number(row?.["Cap Space"] ?? 0);
  const baseline = ownerStandard === "Cheap" ? 18_000_000 : ownerStandard === "Premium" ? 40_000_000 : 28_000_000;
  if (Number.isFinite(capSpace) && capSpace > 0) return Math.round(Math.max(baseline, capSpace * 0.35));
  return baseline;
}

export function buildMarketCandidates(save: SaveData, targetRole: StaffRole): Candidate[] {
  const assignedIds = new Set(Object.values(save.staffAssignments).map((x) => x.coachId));
  const employedNames = employedNamesFromTeamPersonnel();

  const all = personnel
    .filter((r) => {
      const pos = String(r.Position ?? "").toLowerCase();
      return pos.includes("coach") || pos.includes("coordinator") || pos === "hc" || pos === "oc" || pos === "dc";
    })
    .map((row) => {
      const id = `coach:${row.ID}`;
      const name = String(row.DisplayName ?? row.Name ?? `Coach ${row.ID}`);
      const primaryRole = roleFromPosition(row.Position, row.ID);
      const traits = parseTraits(row.Traits).slice(0, 3);
      const freeAgent = !assignedIds.has(id) && !employedNames.has(name);
      const fit = fitLabel(primaryRole, targetRole);
      const demand = demandFor({ id, traits, primaryRole }, targetRole);
      const standards = standardsRisk(save.standards, traits);
      return {
        id,
        name,
        role: targetRole,
        primaryRole,
        traits,
        philosophy: String(row.Scheme ?? "Balanced"),
        fitLabel: fit,
        salaryDemand: demand,
        recommendedOffer: recommendedOffer(demand, save.standards.ownerStandard),
        availability: freeAgent ? "FREE_AGENT" : "EMPLOYED",
        standardsNote: standards.note,
        perceivedRisk: standards.perceivedRisk,
        defaultContractYears: ["HC", "OC", "DC"].includes(targetRole) ? 4 : 3,
      } satisfies Candidate;
    });

  const sorted = all.sort((a, b) => {
    if (a.availability !== b.availability) return a.availability === "FREE_AGENT" ? -1 : 1;
    if (a.fitLabel !== b.fitLabel) return a.fitLabel.localeCompare(b.fitLabel);
    return a.name.localeCompare(b.name);
  });

  const top = sorted.slice(0, 20);
  if (top.some((c) => c.availability === "FREE_AGENT")) return top;

  const placeholders: Candidate[] = Array.from({ length: 8 }).map((_, i) => {
    const id = `placeholder:${targetRole}:${i + 1}`;
    const demand = Math.round(BASE_SALARY_BY_ROLE[targetRole] * (0.9 + i * 0.04));
    return {
      id,
      name: `Generated ${targetRole} Coach ${i + 1}`,
      role: targetRole,
      primaryRole: targetRole,
      traits: ["Teacher", "Disciplined"],
      philosophy: "Balanced",
      fitLabel: "Natural Fit",
      salaryDemand: demand,
      recommendedOffer: recommendedOffer(demand, save.standards.ownerStandard),
      availability: "FREE_AGENT",
      standardsNote: "Meets Standards",
      perceivedRisk: 10,
      defaultContractYears: ["HC", "OC", "DC"].includes(targetRole) ? 4 : 3,
    };
  });
  return placeholders;
}
