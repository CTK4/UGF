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

export const FRANCHISES: Franchise[] = [
  ["ARI","Arizona","Cardinals"],["ATL","Atlanta","Falcons"],["BAL","Baltimore","Ravens"],["BUF","Buffalo","Bills"],
  ["CAR","Carolina","Panthers"],["CHI","Chicago","Bears"],["CIN","Cincinnati","Bengals"],["CLE","Cleveland","Browns"],
  ["DAL","Dallas","Cowboys"],["DEN","Denver","Broncos"],["DET","Detroit","Lions"],["GB","Green Bay","Packers"],
  ["HOU","Houston","Texans"],["IND","Indianapolis","Colts"],["JAX","Jacksonville","Jaguars"],["KC","Kansas City","Chiefs"],
  ["LV","Las Vegas","Raiders"],["LAC","Los Angeles","Chargers"],["LAR","Los Angeles","Rams"],["MIA","Miami","Dolphins"],
  ["MIN","Minnesota","Vikings"],["NE","New England","Patriots"],["NO","New Orleans","Saints"],["NYG","New York","Giants"],
  ["NYJ","New York","Jets"],["PHI","Philadelphia","Eagles"],["PIT","Pittsburgh","Steelers"],["SF","San Francisco","49ers"],
  ["SEA","Seattle","Seahawks"],["TB","Tampa Bay","Buccaneers"],["TEN","Tennessee","Titans"],["WAS","Washington","Commanders"],
].map((t, i) => ({
  id: t[0],
  city: t[1],
  name: t[2],
  owner: `Owner ${t[2]}`,
  traits: i % 2 === 0 ? ["Win-now", "Media-heavy"] : ["Patient", "Development"],
  jobSecurity: (["Very Low", "Low", "Medium", "High", "Very High"] as const)[i % 5],
  gmPhilosophy: i % 2 === 0 ? "Aggressive roster churn" : "Draft-and-develop",
  hcArchetype: i % 3 === 0 ? "Culture Builder" : i % 3 === 1 ? "Scheme Innovator" : "CEO",
  expectation: i % 2 === 0 ? "Compete for playoffs now." : "Build a sustainable contender over 2 seasons.",
}));

export function getFranchise(id: string): Franchise | undefined {
  return FRANCHISES.find((f) => f.id === id);
}
