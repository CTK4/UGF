import draftClassData from "@/data/generated/draftClass.json";
import proTraitsData from "@/data/generated/proTraits.json";
import positionSkillsData from "@/data/generated/positionSkills.json";
import {
  getConferences,
  getContracts,
  getDivisions,
  getDraftOrder,
  getFinances,
  getPersonnel,
  getPlayers,
  getSalaryCap,
  getTeams,
} from "@/data/leagueDb";

export type TeamSummaryRow = {
  Team: string;
  Conference: string;
  Division: string;
  Players: number;
  AvgRating: number;
  StartersAvgRating: number;
  ExpiringCount: number;
  AvgAge: number;
  "Current Cap Hits": number;
  "Cap Space": number;
  TotalContractValue_M: number;
};

export type RosterRow = {
  Team: string;
  Conference: string;
  Division: string;
  Market: string;
  PositionGroup: string;
  Position: string;
  Role: string;
  "Depth Chart": string;
  PlayerName: string;
  "Player ID": string;
  Age: number;
  Rating: number;
  AAV: number;
  Traits: string;
  Archetype: string;
  Status?: string;
};

export type PersonnelRow = Record<string, unknown>;
export type DraftClassRow = Record<string, unknown>;
export type LeagueContextRow = { Field: string; Value: string | number | null; "AAV Averages"?: string | null; "Unnamed: 7"?: string | null };
export type DraftOrderRow = { Pick: number; Team: string; Player: string; Pos: string; College: string; "Unnamed: 7"?: string | null };
export type TeamPersonnelRow = Record<string, string | null>;
export type PersonnelIdLookupRow = Record<string, unknown>;
export type ProTraitRow = Record<string, unknown>;
export type PositionSkillRow = Record<string, unknown>;

const draftClass = draftClassData as DraftClassRow[];
const proTraits = proTraitsData as ProTraitRow[];
const positionSkills = positionSkillsData as PositionSkillRow[];

function canonicalTeamName(teamName: string): string {
  if (teamName === "New Orleans Voodoo") return "New Orleans Hex";
  if (teamName === "New York Gotham Guardians") return "New York Gothic Guardians";
  return teamName;
}

function toTeamId(teamName: string): string {
  return teamName.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const teamById = new Map(getTeams().map((team) => [team.teamId, team]));
const conferenceById = new Map(getConferences().map((row) => [row.conferenceId, row]));
const divisionById = new Map(getDivisions().map((row) => [row.divisionId, row]));
const contractsByEntityId = new Map(getContracts().map((contract) => [String(contract.entityId ?? ""), contract]));

const teamNames = getTeams().map((team) => canonicalTeamName(String(team.name))).filter(Boolean).sort((a, b) => a.localeCompare(b));
const teamNameToId = new Map(teamNames.map((name) => [name, toTeamId(name)]));
const teamIdToName = new Map(getTeams().map((team) => [team.teamId, canonicalTeamName(String(team.name))]));

function conferenceName(teamId: string): string {
  const team = teamById.get(teamId);
  return String(conferenceById.get(String(team?.conferenceId ?? ""))?.name ?? "Independent");
}

function divisionName(teamId: string): string {
  const team = teamById.get(teamId);
  return String(divisionById.get(String(team?.divisionId ?? ""))?.name ?? "Independent");
}

const rosters: RosterRow[] = getPlayers().map((player) => {
  const teamName = String(teamById.get(String(player.teamId ?? ""))?.name ?? "Free Agent");
  const contract = contractsByEntityId.get(player.playerId);
  const aav = Number(contract?.salaryY1 ?? 0);
  return {
    Team: canonicalTeamName(teamName),
    Conference: conferenceName(String(player.teamId ?? "")),
    Division: divisionName(String(player.teamId ?? "")),
    Market: String(teamById.get(String(player.teamId ?? ""))?.region ?? "League"),
    PositionGroup: String(player.pos ?? "UNK"),
    Position: String(player.pos ?? "UNK"),
    Role: "Starter",
    "Depth Chart": "1",
    PlayerName: String(player.fullName ?? "Unknown Player"),
    "Player ID": String(player.playerId ?? ""),
    Age: Number(player.age ?? 24),
    Rating: Number(player.overall ?? 65),
    AAV: Number.isFinite(aav) ? aav : 0,
    Traits: String(player.notes ?? ""),
    Archetype: String(player.archetype ?? "Balanced"),
    Status: String(player.status ?? "ACTIVE"),
  };
});

const personnel: PersonnelRow[] = getPersonnel().map((person, index) => {
  const role = String(person.role ?? "ASST");
  const position = role === "STC" ? "ST Coordinator" : role;
  return {
    ID: index + 1,
    personId: person.personId,
    DisplayName: String(person.fullName ?? "Unknown Coach"),
    Name: String(person.fullName ?? "Unknown Coach"),
    Position: position,
    Team: String(person.teamId ?? "FREE_AGENT"),
    Status: String(person.status ?? "ACTIVE"),
    Traits: String(person.notes ?? ""),
    Scheme: String(person.scheme ?? "Balanced"),
    Role: role,
    Wexp: Number(person.reputation ?? 0) / 100,
  };
});

const teamSummary: TeamSummaryRow[] = getTeams().map((team) => {
  const teamPlayers = getPlayers().filter((player) => String(player.teamId ?? "") === team.teamId);
  const ratingSum = teamPlayers.reduce((sum, player) => sum + Number(player.overall ?? 0), 0);
  const avg = teamPlayers.length ? ratingSum / teamPlayers.length : 0;
  const avgAge = teamPlayers.length ? teamPlayers.reduce((sum, player) => sum + Number(player.age ?? 24), 0) / teamPlayers.length : 0;
  const capHits = getContracts()
    .filter((contract) => String(contract.teamId ?? "") === team.teamId && String(contract.entityType ?? "") === "PLAYER")
    .reduce((sum, contract) => sum + Number(contract.salaryY1 ?? 0), 0);
  const capSpace = Number(getFinances().find((f) => f.teamId === team.teamId)?.capSpace ?? getSalaryCap() - capHits);
  const expiringCount = getContracts().filter((contract) => String(contract.teamId ?? "") === team.teamId && Number(contract.endSeason ?? 0) <= Number(leagueSeason())).length;
  return {
    Team: canonicalTeamName(String(team.name ?? team.teamId)),
    Conference: conferenceName(team.teamId),
    Division: divisionName(team.teamId),
    Players: teamPlayers.length,
    AvgRating: Math.round(avg * 10) / 10,
    StartersAvgRating: Math.round(avg * 10) / 10,
    ExpiringCount: expiringCount,
    AvgAge: Math.round(avgAge * 10) / 10,
    "Current Cap Hits": capHits,
    "Cap Space": capSpace,
    TotalContractValue_M: Math.round((capHits / 1_000_000) * 10) / 10,
  };
});

const draftOrder: DraftOrderRow[] = getDraftOrder().map((row) => ({
  Pick: Number(row.pick ?? 0),
  Team: canonicalTeamName(String(teamIdToName.get(String(row.teamId ?? "")) ?? row.teamId ?? "")),
  Player: "",
  Pos: "",
  College: "",
}));

const teamPersonnel: TeamPersonnelRow[] = getTeams().map((team) => {
  const staff = getPersonnel().filter((person) => String(person.teamId ?? "") === team.teamId && String(person.status ?? "").toUpperCase() !== "FREE_AGENT");
  const owner = staff.find((p) => String(p.role ?? "").toUpperCase() === "OWNER");
  const gm = staff.find((p) => String(p.role ?? "").toUpperCase() === "GM");
  const hc = staff.find((p) => String(p.role ?? "").toUpperCase() === "HC");
  const oc = staff.find((p) => String(p.role ?? "").toUpperCase() === "OC");
  const dc = staff.find((p) => String(p.role ?? "").toUpperCase() === "DC");
  return {
    "Unnamed: 0": canonicalTeamName(String(team.name ?? team.teamId)),
    "Unnamed: 1": String(owner?.fullName ?? ""),
    "Unnamed: 2": String(gm?.fullName ?? ""),
    "Unnamed: 3": String(hc?.fullName ?? ""),
    "Unnamed: 4": String(oc?.fullName ?? ""),
    "Unnamed: 5": String(dc?.fullName ?? ""),
  };
});

const personnelIdLookup: PersonnelIdLookupRow[] = [
  { Role: "Head Coach", AnchorSalary: 10_000_000 },
  { Role: "OC", AnchorSalary: 5_000_000 },
  { Role: "DC", AnchorSalary: 5_000_000 },
  { Role: "STC", AnchorSalary: 2_000_000 },
];

function leagueSeason(): number {
  const draftSeason = Number(getDraftOrder()[0]?.season ?? 2026);
  return Number.isFinite(draftSeason) ? draftSeason : 2026;
}

const leagueContext: LeagueContextRow[] = [
  { Field: "Salary Cap", Value: getSalaryCap() },
  { Field: "Season", Value: leagueSeason() },
];

export function getTeamSummaryRows(): TeamSummaryRow[] { return teamSummary; }
export function getRosterRows(): RosterRow[] { return rosters; }
export function getRosterByTeam(teamName: string): RosterRow[] { return rosters.filter((row) => row.Team === teamName); }
export function getPersonnelRows(): PersonnelRow[] { return personnel; }
export function getDraftClassRows(): DraftClassRow[] { return draftClass; }
export function getLeagueContextRows(): LeagueContextRow[] { return leagueContext; }
export function getDraftOrderRows(): DraftOrderRow[] { return draftOrder; }
export function getTeamPersonnelRows(): TeamPersonnelRow[] { return teamPersonnel; }
export function getPersonnelIdLookupRows(): PersonnelIdLookupRow[] { return personnelIdLookup; }
export function getProTraitRows(): ProTraitRow[] { return proTraits; }
export function getPositionSkillRows(): PositionSkillRow[] { return positionSkills; }

export function getAllTeamNames(): string[] { return teamNames; }
export function getTeamDisplayName(teamKey: string): string { return canonicalTeamName(teamIdToName.get(teamKey) ?? teamKey); }
export function getTeamIdByName(teamName: string): string {
  const canonical = canonicalTeamName(teamName);
  return teamNameToId.get(canonical) ?? toTeamId(canonical);
}
export function getTeamNameById(teamId: string): string {
  return canonicalTeamName(teamIdToName.get(teamId) ?? teamId);
}
