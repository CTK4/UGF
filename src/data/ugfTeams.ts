export type UgfConference = "AC" | "NC";
export type UgfDivision = "East" | "West" | "North" | "South";

export type UgfTeam = {
  key: string;
  team: string;
  conference: UgfConference;
  division: UgfDivision;
};

function toTeamKey(team: string): string {
  return team
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const UGF_TEAMS: UgfTeam[] = [
  ["Atlanta Apex", "NC", "East"],
  ["Dallas Imperials", "AC", "West"],
  ["Jacksonville Fleet", "AC", "South"],
  ["Boston Harbormen", "AC", "East"],
  ["St. Petersburg Pelicans", "AC", "South"],
  ["Indianapolis Crossroads", "NC", "North"],
  ["Philadelphia Founders", "AC", "East"],
  ["New York Gotham Guardians", "AC", "East"],
  ["Houston Launch", "AC", "West"],
  ["Detroit Assembly", "AC", "North"],
  ["St. Louis Archons", "NC", "North"],
  ["New Orleans Voodoo", "NC", "South"],
  ["Charlotte Crown", "NC", "East"],
  ["Nashville Sound", "NC", "South"],
  ["Seattle Evergreens", "NC", "West"],
  ["Austin Empire", "NC", "South"],
  ["Buffalo Northwind", "AC", "North"],
  ["Las Vegas Syndicate", "NC", "West"],
  ["Miami Tide", "AC", "South"],
  ["Phoenix Scorch", "AC", "West"],
  ["Baltimore Admirals", "AC", "East"],
  ["Denver Summit", "AC", "West"],
  ["San Diego Armada", "NC", "West"],
  ["Birmingham Vulcans", "NC", "East"],
  ["Milwaukee Northshore", "NC", "North"],
  ["Chicago Union", "NC", "North"],
  ["Cleveland Forge", "AC", "North"],
  ["Los Angeles Stars", "NC", "West"],
  ["Orlando Kingdom", "AC", "South"],
  ["Pittsburgh Ironclads", "AC", "North"],
  ["Washington Sentinels", "NC", "East"],
  ["Memphis Blues", "NC", "South"],
].map(([team, conference, division]) => ({
  key: toTeamKey(team),
  team,
  conference,
  division,
}));

export const UGF_TEAM_BY_KEY = new Map(UGF_TEAMS.map((team) => [team.key, team]));
