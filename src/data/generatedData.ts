import teamSummaryData from "@/data/generated/teamSummary.json";
import rostersData from "@/data/generated/rosters.json";
import personnelData from "@/data/generated/personnel.json";
import draftClassData from "@/data/generated/draftClass.json";
import leagueContextData from "@/data/generated/leagueContext.json";
import draftOrderData from "@/data/generated/draftOrder.json";
import teamPersonnelData from "@/data/generated/teamPersonnel.json";
import personnelIdLookupData from "@/data/generated/personnelIdLookup.json";
import proTraitsData from "@/data/generated/proTraits.json";
import positionSkillsData from "@/data/generated/positionSkills.json";

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
  DraftCapital_2026_Owned?: string;
  DraftCapital_2027_Owned?: string;
  DraftCapital_2028_Owned?: string;
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
};

export type PersonnelRow = Record<string, unknown>;
export type DraftClassRow = Record<string, unknown>;
export type LeagueContextRow = { Field: string; Value: string | number | null; "AAV Averages"?: string | null; "Unnamed: 7"?: string | null };
export type DraftOrderRow = { Pick: number; Team: string; Player: string; Pos: string; College: string; "Unnamed: 7"?: string | null };
export type TeamPersonnelRow = Record<string, string | null>;
export type PersonnelIdLookupRow = Record<string, unknown>;
export type ProTraitRow = Record<string, unknown>;
export type PositionSkillRow = Record<string, unknown>;

const teamSummary = teamSummaryData as TeamSummaryRow[];
const rosters = rostersData as RosterRow[];
const personnel = personnelData as PersonnelRow[];
const draftClass = draftClassData as DraftClassRow[];
const leagueContext = leagueContextData as LeagueContextRow[];
const draftOrder = draftOrderData as DraftOrderRow[];
const teamPersonnel = teamPersonnelData as TeamPersonnelRow[];
const personnelIdLookup = personnelIdLookupData as PersonnelIdLookupRow[];
const proTraits = proTraitsData as ProTraitRow[];
const positionSkills = positionSkillsData as PositionSkillRow[];

const teamNames = [...new Set(teamSummary.map((row) => row.Team).filter(Boolean))].sort((a, b) => a.localeCompare(b));

function toTeamId(teamName: string): string {
  return teamName.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const teamNameToId = new Map(teamNames.map((name) => [name, toTeamId(name)]));
const teamIdToName = new Map(teamNames.map((name) => [toTeamId(name), name]));

export function getTeamSummaryRows(): TeamSummaryRow[] {
  return teamSummary;
}

export function getRosterRows(): RosterRow[] {
  return rosters;
}

export function getRosterByTeam(teamName: string): RosterRow[] {
  return rosters.filter((row) => row.Team === teamName);
}

export function getPersonnelRows(): PersonnelRow[] { return personnel; }
export function getDraftClassRows(): DraftClassRow[] { return draftClass; }
export function getLeagueContextRows(): LeagueContextRow[] { return leagueContext; }
export function getDraftOrderRows(): DraftOrderRow[] { return draftOrder; }
export function getTeamPersonnelRows(): TeamPersonnelRow[] { return teamPersonnel; }
export function getPersonnelIdLookupRows(): PersonnelIdLookupRow[] { return personnelIdLookup; }
export function getProTraitRows(): ProTraitRow[] { return proTraits; }
export function getPositionSkillRows(): PositionSkillRow[] { return positionSkills; }

export function getAllTeamNames(): string[] {
  return teamNames;
}

export function getTeamDisplayName(teamKey: string): string {
  return teamIdToName.get(teamKey) ?? teamKey;
}

export function getTeamIdByName(teamName: string): string {
  return teamNameToId.get(teamName) ?? toTeamId(teamName);
}

export function getTeamNameById(teamId: string): string {
  return teamIdToName.get(teamId) ?? teamId;
}
