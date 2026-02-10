import { getTeamIdByName, getTeamSummaryRows, type TeamSummaryRow } from "@/data/generatedData";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { UGF_TEAM_BY_KEY } from "@/data/ugfTeams";
import { FRANCHISES } from "@/ui/data/franchises";

const UNKNOWN_TEAM_KEY = "UNKNOWN_TEAM";

const FRANCHISE_ID_TO_TEAM_KEY = new Map(
  FRANCHISES.map((franchise) => [String(franchise.id).trim().toUpperCase(), normalizeExcelTeamKey(franchise.fullName)]),
);

function sanitizeTeamKey(candidate: string): string {
  const normalized = String(candidate ?? "").trim().toUpperCase();
  const patched = normalized.includes("VOODOO")
    ? "NEW_ORLEANS_HEX"
    : normalized.startsWith("NEW_YORK_") && normalized.endsWith("_GUARDIANS") && normalized !== "NEW_YORK_GOTHIC_GUARDIANS"
      ? "NEW_YORK_GOTHIC_GUARDIANS"
      : normalized;

  if (import.meta.env.DEV && (patched.includes("VOODOO") || (patched.startsWith("NEW_YORK_") && patched.endsWith("_GUARDIANS") && patched !== "NEW_YORK_GOTHIC_GUARDIANS"))) {
    console.error("[teamKey] Forbidden identifier leaked into resolver:", {
      candidate,
      normalized,
      patched,
    });
  }

  return patched;
}

export function resolveTeamKey(idOrName: string): string {
  const raw = String(idOrName ?? "").trim();
  if (!raw) {
    if (import.meta.env.DEV) {
      console.error("[teamKey] resolveTeamKey received an empty identifier.", { idOrName });
    }
    return UNKNOWN_TEAM_KEY;
  }

  const normalizedInput = sanitizeTeamKey(raw.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase());

  if (UGF_TEAM_BY_KEY.has(normalizedInput)) return normalizedInput;

  const fromLegacyId = FRANCHISE_ID_TO_TEAM_KEY.get(normalizedInput);
  if (fromLegacyId && UGF_TEAM_BY_KEY.has(fromLegacyId)) return sanitizeTeamKey(fromLegacyId);

  const fromTeamMap = sanitizeTeamKey(normalizeExcelTeamKey(raw));
  if (UGF_TEAM_BY_KEY.has(fromTeamMap)) return fromTeamMap;

  const fromTeamName = sanitizeTeamKey(getTeamIdByName(raw));
  if (UGF_TEAM_BY_KEY.has(fromTeamName)) return fromTeamName;

  if (import.meta.env.DEV) {
    console.error("[teamKey] Could not resolve team identifier to TEAM_KEY.", {
      idOrName,
      normalizedInput,
      fromTeamMap,
      fromTeamName,
    });
  }

  return UNKNOWN_TEAM_KEY;
}

export function getTeamDisplayName(teamKey: string): string {
  const resolvedTeamKey = resolveTeamKey(teamKey);
  return UGF_TEAM_BY_KEY.get(resolvedTeamKey)?.team ?? String(teamKey ?? "").trim();
}

export function findTeamSummaryRow(teamKey: string): TeamSummaryRow | undefined {
  const resolvedTeamKey = resolveTeamKey(teamKey);
  if (resolvedTeamKey === UNKNOWN_TEAM_KEY) return undefined;

  return getTeamSummaryRows().find((row) => resolveTeamKey(String(row.Team ?? "")) === resolvedTeamKey);
}
