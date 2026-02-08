import { getAllTeamNames, getTeamIdByName, getTeamPersonnelRows } from "@/data/generatedData";
import { getUgfTeamByExcelKey } from "@/data/teamMap";

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

function splitCityName(fullName: string): { city: string; name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { city: fullName, name: "" };
  return { city: parts.slice(0, -1).join(" "), name: parts[parts.length - 1] };
}

function parsePersonnelByTeam() {
  const rows = getTeamPersonnelRows();
  const out = new Map<string, { owner: string; gm: string; hc: string }>();
  for (const row of rows) {
    const teamName = String(row["Unnamed: 0"] ?? "").trim();
    if (!teamName || teamName === "Team") continue;
    out.set(teamName, {
      owner: String(row["Unnamed: 1"] ?? "").trim(),
      gm: String(row["Unnamed: 2"] ?? "").trim(),
      hc: String(row["Unnamed: 3"] ?? "").trim(),
    });
  }
  return out;
}

const personnelByTeam = parsePersonnelByTeam();

// Keep save compatibility with older ugf.save.v1 files that stored legacy NFL-style
// franchise IDs (e.g. ARI, DAL, PIT) before we switched to generated UGF IDs.
const LEGACY_ID_BY_TEAM_NAME: Record<string, string> = {
  "Phoenix Scorch": "ARI",
  "Atlanta Apex": "ATL",
  "Baltimore Admirals": "BAL",
  "Buffalo Northwind": "BUF",
  "Charlotte Crown": "CAR",
  "Chicago Union": "CHI",
  "Cleveland Forge": "CLE",
  "Dallas Imperials": "DAL",
  "Denver Summit": "DEN",
  "Detroit Assembly": "DET",
  "Houston Launch": "HOU",
  "Indianapolis Crossroads": "IND",
  "Jacksonville Fleet": "JAX",
  "Las Vegas Syndicate": "LV",
  "Los Angeles Stars": "LAR",
  "Miami Tide": "MIA",
  "New Orleans Voodoo": "NO",
  "Pittsburgh Ironclads": "PIT",
  "Seattle Evergreens": "SEA",
  "Washington Sentinels": "WAS",
};

function getFranchiseId(teamName: string): string {
  return LEGACY_ID_BY_TEAM_NAME[teamName] ?? getTeamIdByName(teamName);
}

export const FRANCHISES: Franchise[] = getAllTeamNames().map((teamName, i) => {
  const parsed = splitCityName(teamName);
  const p = personnelByTeam.get(teamName);
  return {
    id: getFranchiseId(teamName),
    city: parsed.city,
    name: parsed.name,
    fullName: teamName,
    owner: p?.owner || `${teamName} Ownership Group`,
    traits: i % 2 === 0 ? ["Win-now", "Media-heavy"] : ["Patient", "Development"],
    jobSecurity: (["Very Low", "Low", "Medium", "High", "Very High"] as const)[i % 5],
    gmPhilosophy: p?.gm || (i % 2 === 0 ? "Aggressive roster churn" : "Draft-and-develop"),
    hcArchetype: p?.hc || (i % 3 === 0 ? "Culture Builder" : i % 3 === 1 ? "Scheme Innovator" : "CEO"),
    expectation: i % 2 === 0 ? "Compete for playoffs now." : "Build a sustainable contender over 2 seasons.",
  };
});

export function getFranchise(id: string): Franchise | undefined {
  const found = FRANCHISES.find((f) => f.id === id);
  if (found) return found;
  const ugf = getUgfTeamByExcelKey(id);
  if (!ugf) return undefined;
  const [city, ...rest] = ugf.team.split(" ");
  return {
    id,
    city,
    name: rest.join(" "),
    fullName: ugf.team,
    owner: `${city} Sports Group`,
    traits: ["Development"],
    jobSecurity: "Medium",
    gmPhilosophy: "Balanced",
    hcArchetype: "CEO",
    expectation: "Build a sustainable contender.",
  };
}
