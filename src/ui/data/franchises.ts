import { UGF_TEAMS, getUGFTeamByKey } from "@/data/ugfTeams";

export type Franchise = {
  id: string;
  city: string;
  name: string;
  owner: string;
  traits: string[];
  jobSecurity: "Very Low" | "Low" | "Medium" | "High" | "Very High";
  gmPhilosophy: string;
  hcArchetype: string;
  expectation: string;
};

export const FRANCHISES: Franchise[] = UGF_TEAMS.map((team, i) => {
  const [city, ...rest] = team.displayName.split(" ");
  return {
    id: team.key,
    city,
    name: rest.join(" "),
    owner: `${city} Sports Group`,
    traits: i % 2 === 0 ? ["Win-now", "Media-heavy"] : ["Patient", "Development"],
    jobSecurity: (["Very Low", "Low", "Medium", "High", "Very High"] as const)[i % 5],
    gmPhilosophy: i % 2 === 0 ? "Aggressive roster churn" : "Draft-and-develop",
    hcArchetype: i % 3 === 0 ? "Culture Builder" : i % 3 === 1 ? "Scheme Innovator" : "CEO",
    expectation: i % 2 === 0 ? "Compete for playoffs now." : "Build a sustainable contender over 2 seasons.",
  };
});

export function getFranchise(id: string): Franchise | undefined {
  const found = FRANCHISES.find((f) => f.id === id);
  if (found) return found;
  const ugf = getUGFTeamByKey(id);
  if (!ugf) return undefined;
  const [city, ...rest] = ugf.displayName.split(" ");
  return {
    id: ugf.key,
    city,
    name: rest.join(" "),
    owner: `${city} Sports Group`,
    traits: ["Development"],
    jobSecurity: "Medium",
    gmPhilosophy: "Balanced",
    hcArchetype: "CEO",
    expectation: "Build a sustainable contender.",
  };
}
