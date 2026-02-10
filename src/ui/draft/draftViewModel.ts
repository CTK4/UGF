import type { UIState } from "@/ui/types";
import { FRANCHISES } from "@/ui/data/franchises";
import { getTeamDisplayName, resolveTeamKey } from "@/ui/data/teamKeyResolver";
import { sanitizeForbiddenName } from "@/services/rosterImport";

export type DraftProspectVM = {
  id: string;
  name: string;
  pos: string;
  school: string;
  age?: number;
  height?: string;
  weight?: number;
  overall: number;
  grade?: number;
  traits?: Record<string, number>;
};

export type DraftBoardVM = {
  round: number;
  pickInRound: number;
  teamOnClockKey: string;
  teamOnClockName: string;
  prospects: DraftProspectVM[];
  selectedProspectId: string;
};

type PartialDraftState = {
  round?: number;
  pickInRound?: number;
  teamOnClockKey?: string;
  teamOnClockName?: string;
  prospects?: unknown[];
  selectedProspectId?: string;
};

const MOCK_PROSPECTS_BASE: Array<Omit<DraftProspectVM, "overall" | "grade" | "traits"> & { seedOverall: number }> = [
  { id: "dp-001", name: "Mason Rivers", pos: "QB", school: "Texas A&M", age: 22, height: `6'3"`, weight: 218, seedOverall: 86 },
  { id: "dp-002", name: "Darius Vale", pos: "WR", school: "USC", age: 21, height: `6'1"`, weight: 198, seedOverall: 84 },
  { id: "dp-003", name: "Noah Strickland", pos: "EDGE", school: "Penn State", age: 22, height: `6'5"`, weight: 258, seedOverall: 83 },
  { id: "dp-004", name: "Caleb Denton", pos: "OT", school: "Alabama", age: 23, height: `6'6"`, weight: 315, seedOverall: 82 },
  { id: "dp-005", name: "Jalen Mercer", pos: "CB", school: "Florida State", age: 21, height: `6'0"`, weight: 191, seedOverall: 81 },
  { id: "dp-006", name: "Avery Maddox", pos: "RB", school: "Georgia", age: 22, height: `5'11"`, weight: 210, seedOverall: 80 },
  { id: "dp-007", name: "Tyrese Harlan", pos: "DT", school: "LSU", age: 22, height: `6'4"`, weight: 302, seedOverall: 79 },
  { id: "dp-008", name: "Kellan Bryce", pos: "S", school: "Michigan", age: 22, height: `6'1"`, weight: 205, seedOverall: 78 },
  { id: "dp-009", name: "Roman Pierce", pos: "TE", school: "Notre Dame", age: 22, height: `6'5"`, weight: 249, seedOverall: 78 },
  { id: "dp-010", name: "Isaiah Finch", pos: "LB", school: "Oklahoma", age: 21, height: `6'2"`, weight: 238, seedOverall: 77 },
  { id: "dp-011", name: "Colin Bauer", pos: "IOL", school: "Wisconsin", age: 23, height: `6'4"`, weight: 309, seedOverall: 77 },
  { id: "dp-012", name: "Devin Kade", pos: "QB", school: "Oregon", age: 22, height: `6'2"`, weight: 214, seedOverall: 76 },
  { id: "dp-013", name: "Zane Holloway", pos: "WR", school: "Tennessee", age: 21, height: `6'0"`, weight: 193, seedOverall: 76 },
  { id: "dp-014", name: "Mekhi Turner", pos: "CB", school: "Miami", age: 22, height: `5'11"`, weight: 186, seedOverall: 75 },
  { id: "dp-015", name: "Blake Harmon", pos: "RB", school: "Iowa", age: 22, height: `6'0"`, weight: 221, seedOverall: 75 },
  { id: "dp-016", name: "Jasper Quinn", pos: "EDGE", school: "Auburn", age: 22, height: `6'4"`, weight: 255, seedOverall: 74 },
  { id: "dp-017", name: "Owen Lockett", pos: "DT", school: "Clemson", age: 23, height: `6'3"`, weight: 297, seedOverall: 74 },
  { id: "dp-018", name: "Vince Rowan", pos: "OT", school: "Ohio State", age: 22, height: `6'6"`, weight: 311, seedOverall: 73 },
  { id: "dp-019", name: "Tariq Logan", pos: "S", school: "Utah", age: 22, height: `6'0"`, weight: 202, seedOverall: 73 },
  { id: "dp-020", name: "Milo Ramsey", pos: "LB", school: "Kansas State", age: 22, height: `6'2"`, weight: 234, seedOverall: 72 },
  { id: "dp-021", name: "Nate Wilder", pos: "TE", school: "UCLA", age: 21, height: `6'4"`, weight: 244, seedOverall: 72 },
  { id: "dp-022", name: "Bryson Cole", pos: "IOL", school: "TCU", age: 22, height: `6'3"`, weight: 301, seedOverall: 71 },
  { id: "dp-023", name: "Dante Shaw", pos: "WR", school: "Ole Miss", age: 22, height: `6'2"`, weight: 206, seedOverall: 71 },
  { id: "dp-024", name: "Cameron Pike", pos: "CB", school: "Baylor", age: 21, height: `5'11"`, weight: 188, seedOverall: 70 },
  { id: "dp-025", name: "Rhett Boone", pos: "QB", school: "Mississippi State", age: 23, height: `6'4"`, weight: 226, seedOverall: 70 },
];

function clampRating(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hashText(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deriveTraits(id: string, overall: number): Record<string, number> {
  const seed = hashText(id);
  const delta = (shift: number, span: number) => ((seed >> shift) % span) - Math.floor(span / 2);

  return {
    SPD: clampRating(overall + delta(2, 12)),
    STR: clampRating(overall + delta(6, 12)),
    AWR: clampRating(overall + delta(10, 14)),
    AGI: clampRating(overall + delta(14, 14)),
    ACC: clampRating(overall + delta(18, 12)),
    FIN: clampRating(overall + delta(22, 10)),
    IQ: clampRating(overall + delta(5, 16)),
    CTH: clampRating(overall + delta(9, 14)),
  };
}

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toProspectVM(raw: unknown): DraftProspectVM | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? row["Player ID"] ?? "").trim();
  const name = sanitizeForbiddenName(String(row.name ?? row.Name ?? "").trim());
  if (!id || !name) return null;

  const overall = clampRating(toNumber(row.overall ?? row.Overall ?? row.Rank) ?? 70);
  return {
    id,
    name,
    pos: String(row.pos ?? row.POS ?? "ATH").trim() || "ATH",
    school: String(row.school ?? row.College ?? "Unknown").trim() || "Unknown",
    age: toNumber(row.age ?? row.Age),
    height: String(row.height ?? row.Hgt ?? "").trim() || undefined,
    weight: toNumber(row.weight ?? row.Wgt),
    overall,
    grade: clampRating(toNumber(row.grade ?? row.Grade ?? overall) ?? overall),
    traits: typeof row.traits === "object" && row.traits ? row.traits as Record<string, number> : deriveTraits(id, overall),
  };
}

function buildMockProspects(): DraftProspectVM[] {
  return MOCK_PROSPECTS_BASE.map((prospect) => {
    const overall = clampRating(prospect.seedOverall);
    return {
      id: prospect.id,
      name: sanitizeForbiddenName(prospect.name),
      pos: prospect.pos,
      school: prospect.school,
      age: prospect.age,
      height: prospect.height,
      weight: prospect.weight,
      overall,
      grade: overall,
      traits: deriveTraits(prospect.id, overall),
    };
  });
}

function guardForbiddenTeamName(teamName: string): string {
  const cleanName = sanitizeForbiddenName(teamName);
  if (import.meta.env.DEV && /(voodoo|gotham)/i.test(cleanName)) {
    console.error("[DraftBoard] Forbidden team name detected.", { teamName, cleanName });
  }
  return cleanName;
}

export function getDraftBoardVM(state: UIState): DraftBoardVM {
  const rawDraft = (state.save?.gameState?.draft as unknown as PartialDraftState | undefined) ?? {};

  const prospectsFromState = Array.isArray(rawDraft.prospects)
    ? rawDraft.prospects.map((prospect) => toProspectVM(prospect)).filter((prospect): prospect is DraftProspectVM => Boolean(prospect))
    : [];

  const prospects = prospectsFromState.length > 0 ? prospectsFromState : buildMockProspects();

  const fallbackTeamKey = resolveTeamKey(
    state.save?.gameState?.franchise?.ugfTeamKey
    ?? state.save?.gameState?.franchise?.excelTeamKey
    ?? "SEATTLE_EVERGREENS",
  );

  const fallbackRound = 2;
  const fallbackPickInRound = 4;
  const fallbackTeamName = guardForbiddenTeamName(getTeamDisplayName(fallbackTeamKey) || FRANCHISES[0]?.fullName || "Seattle Evergreens");

  const round = Math.max(1, Math.round(toNumber(rawDraft.round) ?? fallbackRound));
  const pickInRound = Math.max(1, Math.round(toNumber(rawDraft.pickInRound) ?? fallbackPickInRound));
  const teamOnClockKey = resolveTeamKey(String(rawDraft.teamOnClockKey ?? fallbackTeamKey));
  const teamOnClockName = guardForbiddenTeamName(
    String(rawDraft.teamOnClockName ?? getTeamDisplayName(teamOnClockKey) ?? fallbackTeamName),
  );

  const selectedProspectId = prospects.some((prospect) => prospect.id === rawDraft.selectedProspectId)
    ? String(rawDraft.selectedProspectId)
    : prospects[0]?.id ?? "";

  return {
    round,
    pickInRound,
    teamOnClockKey,
    teamOnClockName,
    prospects,
    selectedProspectId,
  };
}
