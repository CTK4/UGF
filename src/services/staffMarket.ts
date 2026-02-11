import { getPersonnelIdLookupRows, getPersonnelRows, getTeamPersonnelRows, getTeamSummaryRows } from "@/data/generatedData";
import type { SaveData } from "@/ui/types";
import { ASSISTANT_ROLES, STAFF_ROLE_LABELS, type StaffRole } from "@/domain/staffRoles";

export type FitLabel = "Natural Fit" | "Cross-Train" | "Out-of-Role";

type PersonnelRow = Record<string, unknown>;
type TeamPersonnelRow = Record<string, string | null>;
type TeamSummaryRow = Record<string, unknown>;

const personnel = getPersonnelRows() as PersonnelRow[];
const teamPersonnel = getTeamPersonnelRows() as TeamPersonnelRow[];
const lookup = getPersonnelIdLookupRows() as PersonnelRow[];
const teamSummary = getTeamSummaryRows() as TeamSummaryRow[];

const ROLE_BASE: Record<StaffRole, number> = {
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

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ratio(seed: string): number {
  return (hash(seed) % 1000) / 1000;
}

function cleanName(value: string): string {
  return value.replace(/\s*\(.*\)\s*$/, "").trim();
}

function normalizePrimaryRole(position: string): StaffRole | null {
  const pos = position.toLowerCase();
  if (pos === "head coach" || pos === "hc") return "HC";
  if (pos === "oc") return "OC";
  if (pos === "dc") return "DC";
  if (pos.includes("st")) return "STC";
  if (pos.includes("owner") || pos === "gm") return null;
  if (pos.includes("qb")) return "QB";
  if (pos.includes("ol")) return "OL";
  if (pos.includes("dl")) return "DL";
  if (pos.includes("lb")) return "LB";
  if (pos.includes("db")) return "DB";
  if (pos.includes("wr/rb")) return "WR";
  if (pos.includes("wr")) return "WR";
  if (pos.includes("rb")) return "RB";
  if (pos.includes("assistant") || pos.includes("coach")) return "ASST";
  return null;
}

function fitLabel(primaryRole: StaffRole, targetRole: StaffRole): FitLabel {
  if (primaryRole === targetRole) return "Natural Fit";
  if ((["OC", "DC", "STC"].includes(primaryRole) && ASSISTANT_ROLES.includes(targetRole)) || (ASSISTANT_ROLES.includes(primaryRole) && ["OC", "DC", "STC"].includes(targetRole))) {
    return "Cross-Train";
  }
  return "Out-of-Role";
}

function parseTraits(row: PersonnelRow): string[] {
  return String(row.Traits ?? "")
    .split(/[|,]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function experienceModifier(row: PersonnelRow): number {
  const wexp = Number(row.Wexp ?? 0);
  if (wexp >= 0.7) return 0.2;
  if (wexp <= 0.35) return -0.1;
  return 0;
}

function traitModifier(traits: string[]): number {
  const blob = traits.join(" ").toLowerCase();
  let mod = 0;
  if (blob.includes("ego")) mod += 0.15;
  if (blob.includes("teacher")) mod += 0.05;
  if (blob.includes("disciplined")) mod += 0.03;
  return mod;
}

function fitModifier(fit: FitLabel): number {
  if (fit === "Cross-Train") return 0.05;
  if (fit === "Out-of-Role") return 0.2;
  return 0;
}

function ownerBudget(ownerStandard: SaveData["standards"]["ownerStandard"]): number {
  if (ownerStandard === "Cheap") return 18_000_000;
  if (ownerStandard === "Premium") return 40_000_000;
  return 28_000_000;
}

export function ensureFinancials(save: SaveData): SaveData {
  const teamRow = teamSummary.find((r) => String(r.Team) === save.franchiseId);
  const capProxy = Number(teamRow?.["Cap Space"] ?? 0);
  const savedTotal = Number(save.finances.coachBudgetTotal ?? 0);
  const computedDefault = capProxy > 0 ? Math.max(ownerBudget(save.standards.ownerStandard), Math.min(45_000_000, capProxy * 0.5)) : ownerBudget(save.standards.ownerStandard);
  const total = savedTotal > 0 ? savedTotal : computedDefault;
  const used = Object.values(save.staffAssignments).reduce((sum, slot) => sum + (slot?.salary ?? 0), 0);
  return { ...save, finances: { coachBudgetTotal: Math.round(total), coachBudgetUsed: Math.round(used) } };
}

function employedNames(save: SaveData): Set<string> {
  const names = new Set<string>();
  for (const row of teamPersonnel) {
    for (const key of ["Unnamed: 3", "Unnamed: 4", "Unnamed: 5"]) {
      const value = String(row[key] ?? "").trim();
      if (value) names.add(cleanName(value).toLowerCase());
    }
  }
  for (const slot of Object.values(save.staffAssignments)) if (slot?.coachName) names.add(slot.coachName.toLowerCase());
  return names;
}

function contractYearsFor(role: StaffRole): number {
  if (role === "HC") return 4;
  if (["OC", "DC"].includes(role)) return 3;
  return 2;
}

function standardsAssessment(save: SaveData, traits: string[]): { meets: boolean; risk: number; note: string } {
  const blob = traits.join(" ").toLowerCase();
  const ownerClash = save.standards.ownerStandard === "Cheap" && blob.includes("ego");
  const disciplineClash = save.standards.disciplineStandard === "Strict" && (blob.includes("player-first") || blob.includes("lenient"));
  const risk = (ownerClash ? 15 : 0) + (disciplineClash ? 10 : 0);
  return {
    meets: risk === 0,
    risk,
    note: risk === 0 ? "Meets Standards" : "Risky Hire",
  };
}

function placeholder(targetRole: StaffRole, index: number, weekSeed: string): SaveData["market"]["byWeek"][string]["candidates"][number] {
  const id = `placeholder-${targetRole}-${index}`;
  const demand = Math.round(ROLE_BASE[targetRole] * (1 + ratio(`${weekSeed}:${id}`) * 0.3));
  return {
    id,
    name: `Generated ${STAFF_ROLE_LABELS[targetRole]} ${index + 1}`,
    primaryRole: targetRole,
    targetRole,
    traits: ["Adaptive", "Reliable", "Teacher"],
    philosophy: "Deterministic emergency candidate",
    availability: "FREE_AGENT",
    fitLabel: "Natural Fit",
    salaryDemand: demand,
    recommendedOffer: demand,
    contractYears: contractYearsFor(targetRole),
    standardsNote: "Meets Standards",
    perceivedRisk: 5,
    meetsStandards: true,
  };
}

export function buildMarketForRole(save: SaveData, targetRole: StaffRole): SaveData["market"]["byWeek"][string] {
  const weekSeed = `${save.league.season}-${save.league.week}-${targetRole}`;
  const employed = employedNames(save);
  const rows = personnel.filter((row) => {
    const pos = String(row.Position ?? "");
    const primary = normalizePrimaryRole(pos);
    if (!primary) return false;
    return targetRole === "HC" ? ["HC", "OC", "DC"].includes(primary) : targetRole === "OC" ? ["OC", "HC", "QB", "WR", "RB", "ASST"].includes(primary) : targetRole === "DC" ? ["DC", "HC", "DL", "LB", "DB", "ASST"].includes(primary) : targetRole === "STC" ? ["STC", "ASST"].includes(primary) : true;
  });

  const roleAnchor = Number(lookup.find((r) => String(r.Role) === STAFF_ROLE_LABELS[targetRole])?.AnchorSalary ?? 0);
  const candidates = rows.slice(0, 40).map((row) => {
    const name = String(row.DisplayName ?? row.Name ?? "Unknown Coach");
    const id = String(row.ID ?? hash(name));
    const primaryRole = normalizePrimaryRole(String(row.Position ?? "")) ?? "ASST";
    const freeAgent = !employed.has(name.toLowerCase());
    const assistantOpen = ASSISTANT_ROLES.includes(targetRole);
    const availability = freeAgent ? "FREE_AGENT" : assistantOpen ? "EMPLOYED" : "INELIGIBLE";
    const fit = fitLabel(primaryRole, targetRole);
    const traits = parseTraits(row);
    const demandBase = roleAnchor > 0 ? roleAnchor : ROLE_BASE[targetRole];
    const demand = Math.round(demandBase * (1 + experienceModifier(row) + traitModifier(traits) + fitModifier(fit)));
    const standards = standardsAssessment(save, traits);
    return {
      id: `p-${id}`,
      name,
      primaryRole,
      targetRole,
      traits,
      philosophy: String(row.Scheme ?? "Balanced"),
      availability,
      fitLabel: fit,
      salaryDemand: Math.max(350_000, demand),
      recommendedOffer: Math.max(350_000, demand),
      contractYears: contractYearsFor(targetRole),
      standardsNote: standards.note,
      perceivedRisk: standards.risk,
      meetsStandards: standards.meets,
    };
  });

  const freeAgents = candidates.filter((c) => c.availability === "FREE_AGENT");
  const base = freeAgents.length ? freeAgents : candidates;
  const dedup = Array.from(new Map(base.map((c) => [c.id, c])).values()).slice(0, 12);
  while (dedup.length < 4) dedup.push(placeholder(targetRole, dedup.length, weekSeed));

  return { weekKey: `${save.league.season}-${save.league.week}`, role: targetRole, candidates: dedup };
}

export function canAfford(save: SaveData, salary: number): { ok: boolean; exceededBy: number } {
  const nextUsed = save.finances.coachBudgetUsed + salary;
  if (nextUsed <= save.finances.coachBudgetTotal) return { ok: true, exceededBy: 0 };
  return { ok: false, exceededBy: nextUsed - save.finances.coachBudgetTotal };
}
