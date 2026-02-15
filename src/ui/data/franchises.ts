import { getPersonnel, getTeams, type PersonnelRow, type TeamRow } from "@/data/leagueDb";
import { getUgfTeamByExcelKey, normalizeExcelTeamKey } from "@/data/teamMap";

export type Franchise = {
  id: string;
  city: string;
  name: string;
  fullName: string;
  owner: string;
  traits: string[];
  jobSecurity: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  gmPhilosophy: string;
  hcArchetype: string;
  expectation: string;
};

export type FranchiseLookup = Franchise & {
  teamKey: string;
  lookupValue: string;
};

function splitCityName(fullName: string): { city: string; name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { city: fullName, name: "" };
  return { city: parts.slice(0, -1).join(" "), name: parts[parts.length - 1] };
}

function roleForTeam(personnel: PersonnelRow[], teamId: string, role: string): string {
  return String(
    personnel.find((person) => String(person.teamId ?? "") === teamId && String(person.role ?? "").toUpperCase() === role)?.fullName ?? "",
  ).trim();
}

function sortedTeams(): TeamRow[] {
  return getTeams().slice().sort((a, b) => String(a.name ?? a.teamId).localeCompare(String(b.name ?? b.teamId)) || String(a.teamId).localeCompare(String(b.teamId)));
}

const activePersonnel = getPersonnel().filter((person) => String(person.status ?? "").toUpperCase() !== "FREE_AGENT");

export const FRANCHISES: Franchise[] = sortedTeams().map((team, i) => {
  const fullName = String(team.name ?? team.teamId);
  const parsed = splitCityName(fullName);
  const owner = roleForTeam(activePersonnel, String(team.teamId), "OWNER");
  const gm = roleForTeam(activePersonnel, String(team.teamId), "GM");
  const hc = roleForTeam(activePersonnel, String(team.teamId), "HC");
  return {
    id: String(team.teamId),
    city: parsed.city,
    name: parsed.name,
    fullName,
    owner: owner || `${parsed.city} Ownership Group`,
    traits: i % 2 === 0 ? ["Win-now", "Media-heavy"] : ["Patient", "Development"],
    jobSecurity: (["Very Low", "Low", "Medium", "High", "Very High"] as const)[i % 5],
    gmPhilosophy: gm || (i % 2 === 0 ? "Aggressive roster churn" : "Draft-and-develop"),
    hcArchetype: hc || (i % 3 === 0 ? "Culture Builder" : i % 3 === 1 ? "Scheme Innovator" : "CEO"),
    expectation: i % 2 === 0 ? "Compete for playoffs now." : "Build a sustainable contender over 2 seasons.",
  };
});

const FRANCHISE_BY_ID = new Map(FRANCHISES.map((franchise) => [franchise.id, franchise]));
const FRANCHISE_BY_TEAM_KEY = new Map(
  FRANCHISES.map((franchise) => [normalizeExcelTeamKey(franchise.fullName), franchise]),
);
const FRANCHISE_BY_FULL_NAME = new Map(
  FRANCHISES.map((franchise) => [franchise.fullName.trim().toLowerCase(), franchise]),
);

function toLookup(value: string): string {
  return String(value ?? "").trim();
}

export function resolveFranchiseLike(value: string): FranchiseLookup | undefined {
  const lookupValue = toLookup(value);
  if (!lookupValue) return undefined;

  const byId = FRANCHISE_BY_ID.get(lookupValue);
  if (byId) {
    return { ...byId, teamKey: normalizeExcelTeamKey(byId.fullName), lookupValue };
  }

  const normalizedTeamKey = normalizeExcelTeamKey(lookupValue);
  const byTeamKey = FRANCHISE_BY_TEAM_KEY.get(normalizedTeamKey);
  if (byTeamKey) {
    return { ...byTeamKey, teamKey: normalizedTeamKey, lookupValue };
  }

  const byFullName = FRANCHISE_BY_FULL_NAME.get(lookupValue.toLowerCase());
  if (byFullName) {
    return { ...byFullName, teamKey: normalizeExcelTeamKey(byFullName.fullName), lookupValue };
  }

  const mapped = getUgfTeamByExcelKey(lookupValue);
  if (!mapped) return undefined;

  const parsed = splitCityName(mapped.team);
  return {
    id: mapped.key,
    city: parsed.city,
    name: parsed.name,
    fullName: mapped.team,
    owner: `${parsed.city} Sports Group`,
    traits: ["Development"],
    jobSecurity: "Medium",
    gmPhilosophy: "Balanced",
    hcArchetype: "CEO",
    expectation: "Build a sustainable contender.",
    teamKey: mapped.key,
    lookupValue,
  };
}

export function getFranchise(id: string): Franchise | undefined {
  return resolveFranchiseLike(id);
}
