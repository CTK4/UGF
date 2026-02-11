import { getTeamById, getTeamSummaryProjectionRows, getTeams, type TeamSummaryProjectionRow } from "@/data/leagueDb";
import { normalizeExcelTeamKey } from "@/data/teamMap";

const UNKNOWN_TEAM_KEY = "UNKNOWN_TEAM";

type TeamResolverEntry = {
  teamId: string;
  teamName: string;
  normalizedName: string;
  normalizedId: string;
  normalizedAbbrev: string;
};

function normalizeValue(value: string): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizePhrase(value: string): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function regionBase(region: string | undefined): string {
  return String(region ?? "").split(",")[0]?.trim() ?? "";
}

const teamResolverEntries: TeamResolverEntry[] = getTeams().map((team) => {
  const teamName = String(team.name ?? team.teamId);
  const nickname = teamName.split(/\s+/).slice(1).join(" ");
  const regionLike = regionBase(team.region);
  const composite = regionLike && nickname ? `${regionLike} ${nickname}` : teamName;
  return {
    teamId: String(team.teamId),
    teamName,
    normalizedName: normalizePhrase(composite),
    normalizedId: normalizeValue(String(team.teamId)),
    normalizedAbbrev: normalizeValue(String(team.abbrev ?? "")),
  };
});

export function resolveTeamKey(idOrName: string): string {
  const raw = String(idOrName ?? "").trim();
  if (!raw) return UNKNOWN_TEAM_KEY;

  const normalizedInput = normalizeValue(raw);
  if (getTeamById(normalizedInput)) return normalizedInput;

  const byId = teamResolverEntries.find((entry) => entry.normalizedId === normalizedInput);
  if (byId) return byId.teamId;

  const fromTeamMap = normalizeValue(normalizeExcelTeamKey(raw));
  const byMappedId = teamResolverEntries.find((entry) => entry.normalizedId === fromTeamMap);
  if (byMappedId) return byMappedId.teamId;

  const byAbbrev = teamResolverEntries.find((entry) => entry.normalizedAbbrev === normalizedInput);
  if (byAbbrev) return byAbbrev.teamId;

  const normalizedPhrase = normalizePhrase(raw);
  const byName = teamResolverEntries.find((entry) => normalizePhrase(entry.teamName) === normalizedPhrase || entry.normalizedName === normalizedPhrase);
  if (byName) return byName.teamId;

  if (import.meta.env.DEV) {
    console.error("[teamKey] Could not resolve team identifier to CITY_TEAM.", {
      idOrName,
      normalizedInput,
      normalizedPhrase,
      fromTeamMap,
    });
  }

  return UNKNOWN_TEAM_KEY;
}

export function getTeamDisplayName(teamKey: string): string {
  const resolvedTeamKey = resolveTeamKey(teamKey);
  return getTeamById(resolvedTeamKey)?.name ?? String(teamKey ?? "").trim();
}

export function findTeamSummaryRow(teamKey: string): TeamSummaryProjectionRow | undefined {
  const resolvedTeamKey = resolveTeamKey(teamKey);
  if (resolvedTeamKey === UNKNOWN_TEAM_KEY) return undefined;
  return getTeamSummaryProjectionRows().find((row) => row.teamId === resolvedTeamKey);
}
