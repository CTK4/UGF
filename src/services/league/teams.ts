export type Conference = "NC" | "AC";
export type Division = "East" | "North" | "South" | "West";

export type LeagueTeam = {
  id: string;
  name: string;
  conference: Conference;
  division: Division;
};

export const LEAGUE_TEAMS: LeagueTeam[] = [
  { id: "ATL", name: "Atlanta Apex", conference: "NC", division: "East" },
  { id: "CHA", name: "Charlotte Crown", conference: "NC", division: "East" },
  { id: "BIR", name: "Birmingham Vulcans", conference: "NC", division: "East" },
  { id: "WAS", name: "Washington Sentinels", conference: "NC", division: "East" },

  { id: "BOS", name: "Boston Harbormen", conference: "AC", division: "East" },
  { id: "PHI", name: "Philadelphia Founders", conference: "AC", division: "East" },
  { id: "NYC", name: "New York Gothic Guardians", conference: "AC", division: "East" },
  { id: "BAL", name: "Baltimore Admirals", conference: "AC", division: "East" },

  { id: "IND", name: "Indianapolis Crossroads", conference: "NC", division: "North" },
  { id: "STL", name: "St. Louis Archons", conference: "NC", division: "North" },
  { id: "MIL", name: "Milwaukee Northshore", conference: "NC", division: "North" },
  { id: "CHI", name: "Chicago Union", conference: "NC", division: "North" },

  { id: "DET", name: "Detroit Assembly", conference: "AC", division: "North" },
  { id: "BUF", name: "Buffalo Northwind", conference: "AC", division: "North" },
  { id: "CLE", name: "Cleveland Forge", conference: "AC", division: "North" },
  { id: "PIT", name: "Pittsburgh Ironclads", conference: "AC", division: "North" },

  { id: "NOH", abbr: "NOH", displayAbbr: "NO", name: "New Orleans Hex", conference: "NC", division: "South" },
  { id: "NAS", name: "Nashville Sound", conference: "NC", division: "South" },
  { id: "AUS", name: "Austin Empire", conference: "NC", division: "South" },
  { id: "MEM", name: "Memphis Blues", conference: "NC", division: "South" },

  { id: "JAX", name: "Jacksonville Fleet", conference: "AC", division: "South" },
  { id: "STP", name: "St. Petersburg Pelicans", conference: "AC", division: "South" },
  { id: "MIA", name: "Miami Tide", conference: "AC", division: "South" },
  { id: "ORL", name: "Orlando Kingdom", conference: "AC", division: "South" },

  { id: "SEA", name: "Seattle Evergreens", conference: "NC", division: "West" },
  { id: "LVS", name: "Las Vegas Syndicate", conference: "NC", division: "West" },
  { id: "SDG", name: "San Diego Armada", conference: "NC", division: "West" },
  { id: "LAX", name: "Los Angeles Stars", conference: "NC", division: "West" },

  { id: "DAL", name: "Dallas Imperials", conference: "AC", division: "West" },
  { id: "HOU", name: "Houston Launch", conference: "AC", division: "West" },
  { id: "PHX", name: "Phoenix Scorch", conference: "AC", division: "West" },
  { id: "DEN", name: "Denver Summit", conference: "AC", division: "West" },
];

export function teamById(id: string): LeagueTeam | undefined {
  return LEAGUE_TEAMS.find((t) => t.id === id);
}

export function teamsInDivision(conference: Conference, division: Division): LeagueTeam[] {
  return LEAGUE_TEAMS.filter((t) => t.conference === conference && t.division === division);
}

export function teamsInConference(conference: Conference): LeagueTeam[] {
  return LEAGUE_TEAMS.filter((t) => t.conference === conference);
}
