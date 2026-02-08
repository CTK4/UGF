import { getAllTeamNames, getTeamIdByName, getTeamPersonnelRows } from "@/data/generatedData";

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

export const FRANCHISES: Franchise[] = getAllTeamNames().map((teamName, i) => {
  const parsed = splitCityName(teamName);
  const p = personnelByTeam.get(teamName);
  return {
    id: getTeamIdByName(teamName),
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
  return FRANCHISES.find((f) => f.id === id);
}
