export type UGFConference = "Eastern" | "Western";
export type UGFDivision = "North" | "South";

export type UGFTeam = {
  key: string;
  displayName: string;
  conference: UGFConference;
  division: UGFDivision;
  logoKey: string;
};

const TEAMS: Array<Omit<UGFTeam, "key">> = [
  { displayName: "Atlanta Apex", conference: "Eastern", division: "South", logoKey: "ATLANTA_APEX" },
  { displayName: "Baltimore Admirals", conference: "Eastern", division: "North", logoKey: "BALTIMORE_ADMIRALS" },
  { displayName: "Birmingham Vulcans", conference: "Eastern", division: "South", logoKey: "BIRMINGHAM_VULCANS" },
  { displayName: "Boston Harbormen", conference: "Eastern", division: "North", logoKey: "BOSTON_HARBORMEN" },
  { displayName: "Buffalo Northwind", conference: "Eastern", division: "North", logoKey: "BUFFALO_NORTHWIND" },
  { displayName: "Charlotte Crown", conference: "Eastern", division: "South", logoKey: "CHARLOTTE_CROWN" },
  { displayName: "Chicago Union", conference: "Western", division: "North", logoKey: "CHICAGO_UNION" },
  { displayName: "Cleveland Forge", conference: "Eastern", division: "North", logoKey: "CLEVELAND_FORGE" },
  { displayName: "Dallas Imperials", conference: "Western", division: "South", logoKey: "DALLAS_IMPERIALS" },
  { displayName: "Denver Summit", conference: "Western", division: "North", logoKey: "DENVER_SUMMIT" },
  { displayName: "Detroit Assembly", conference: "Eastern", division: "North", logoKey: "DETROIT_ASSEMBLY" },
  { displayName: "Houston Launch", conference: "Western", division: "South", logoKey: "HOUSTON_LAUNCH" },
  { displayName: "Indianapolis Crossroads", conference: "Eastern", division: "South", logoKey: "INDIANAPOLIS_CROSSROADS" },
  { displayName: "Jacksonville Fleet", conference: "Eastern", division: "South", logoKey: "JACKSONVILLE_FLEET" },
  { displayName: "Las Vegas Syndicate", conference: "Western", division: "South", logoKey: "LAS_VEGAS_SYNDICATE" },
  { displayName: "Los Angeles Stars", conference: "Western", division: "South", logoKey: "LOS_ANGELES_STARS" },
  { displayName: "Memphis Blues", conference: "Eastern", division: "South", logoKey: "MEMPHIS_BLUES" },
  { displayName: "Miami Tide", conference: "Eastern", division: "South", logoKey: "MIAMI_TIDE" },
  { displayName: "Milwaukee Northshore", conference: "Western", division: "North", logoKey: "MILWAUKEE_NORTHSHORE" },
  { displayName: "Nashville Sound", conference: "Eastern", division: "South", logoKey: "NASHVILLE_SOUND" },
  { displayName: "New Orleans Hex", conference: "Western", division: "South", logoKey: "NEW_ORLEANS_HEX" },
  { displayName: "New York Gothic Guardians", conference: "Eastern", division: "North", logoKey: "NEW_YORK_GOTHIC_GUARDIANS" },
  { displayName: "Orlando Kingdom", conference: "Eastern", division: "South", logoKey: "ORLANDO_KINGDOM" },
  { displayName: "Philadelphia Founders", conference: "Eastern", division: "North", logoKey: "PHILADELPHIA_FOUNDERS" },
  { displayName: "Phoenix Scorch", conference: "Western", division: "South", logoKey: "PHOENIX_SCORCH" },
  { displayName: "Pittsburgh Ironclads", conference: "Eastern", division: "North", logoKey: "PITTSBURGH_IRONCLADS" },
  { displayName: "Austin Empire", conference: "Western", division: "South", logoKey: "AUSTIN_EMPIRE" },
  { displayName: "San Diego Armada", conference: "Western", division: "South", logoKey: "SAN_DIEGO_ARMADA" },
  { displayName: "Seattle Evergreen", conference: "Western", division: "North", logoKey: "SEATTLE_EVERGREEN" },
  { displayName: "St. Louis Archons", conference: "Western", division: "North", logoKey: "ST_LOUIS_ARCHONS" },
  { displayName: "St. Petersburg Pelicans", conference: "Eastern", division: "South", logoKey: "ST_PETERSBURG_PELICANS" },
  { displayName: "Washington Sentinels", conference: "Eastern", division: "North", logoKey: "WASHINGTON_SENTINELS" },
];

export const UGF_TEAMS: UGFTeam[] = TEAMS.map((team) => ({ ...team, key: toTeamKey(team.displayName) }));

export function toTeamKey(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const TEAM_BY_KEY = new Map(UGF_TEAMS.map((team) => [team.key, team]));

const TEAM_ALIASES: Record<string, string> = {
  NEW_ORLEANS_VOODOO: "NEW_ORLEANS_HEX",
  NEW_YORK_GOTHAM_GUARDIANS: "NEW_YORK_GOTHIC_GUARDIANS",
  SEATTLE_EVERGREENS: "SEATTLE_EVERGREEN",
  TENNESSEE_TITANS: "NASHVILLE_SOUND",
  HOUSTON_TEXANS: "HOUSTON_LAUNCH",
  DALLAS_COWBOYS: "DALLAS_IMPERIALS",
  BALTIMORE_RAVENS: "BALTIMORE_ADMIRALS",
  NEW_ENGLAND_PATRIOTS: "BOSTON_HARBORMEN",
  LOS_ANGELES_RAMS: "LOS_ANGELES_STARS",
  SAN_FRANCISCO_49ERS: "AUSTIN_EMPIRE",
  GREEN_BAY_PACKERS: "MILWAUKEE_NORTHSHORE",
  TAMPA_BAY_BUCCANEERS: "ST_PETERSBURG_PELICANS",
  ARIZONA_CARDINALS: "PHOENIX_SCORCH",
  CLEVELAND_BROWNS: "CLEVELAND_FORGE",
};

export function resolveUGFTeamByJsonTeam(teamName: string): UGFTeam | undefined {
  const normalized = toTeamKey(teamName);
  return TEAM_BY_KEY.get(TEAM_ALIASES[normalized] ?? normalized);
}

export function getUGFTeamByKey(key: string): UGFTeam | undefined {
  return TEAM_BY_KEY.get(key);
}
