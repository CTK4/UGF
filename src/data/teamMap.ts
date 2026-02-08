import { UGF_TEAMS, UGF_TEAM_BY_KEY, type UgfTeam } from "@/data/ugfTeams";

const KNOWN_ALIASES: Record<string, string> = {
  ATL: "ATLANTA_APEX",
  DAL: "DALLAS_IMPERIALS",
  JAX: "JACKSONVILLE_FLEET",
  BOS: "BOSTON_HARBORMEN",
  TB: "ST_PETERSBURG_PELICANS",
  IND: "INDIANAPOLIS_CROSSROADS",
  PHI: "PHILADELPHIA_FOUNDERS",
  NYG: "NEW_YORK_GOTHAM_GUARDIANS",
  HOU: "HOUSTON_LAUNCH",
  DET: "DETROIT_ASSEMBLY",
  STL: "ST_LOUIS_ARCHONS",
  NO: "NEW_ORLEANS_VOODOO",
  CAR: "CHARLOTTE_CROWN",
  TEN: "NASHVILLE_SOUND",
  SEA: "SEATTLE_EVERGREENS",
  SF: "AUSTIN_EMPIRE",
  BUF: "BUFFALO_NORTHWIND",
  LV: "LAS_VEGAS_SYNDICATE",
  MIA: "MIAMI_TIDE",
  ARI: "PHOENIX_SCORCH",
  BAL: "BALTIMORE_ADMIRALS",
  DEN: "DENVER_SUMMIT",
  SD: "SAN_DIEGO_ARMADA",
  BHM: "BIRMINGHAM_VULCANS",
  GB: "MILWAUKEE_NORTHSHORE",
  CHI: "CHICAGO_UNION",
  CLE: "CLEVELAND_FORGE",
  LAR: "LOS_ANGELES_STARS",
  ORL: "ORLANDO_KINGDOM",
  PIT: "PITTSBURGH_IRONCLADS",
  WAS: "WASHINGTON_SENTINELS",
  MEM: "MEMPHIS_BLUES",
  NEW_YORK_GOTHIC_GUARDIANS: "NEW_YORK_GOTHAM_GUARDIANS",
  SEATTLE_EVERGREEN: "SEATTLE_EVERGREENS",
  TAMPA_BAY_BUCCANEERS: "ST_PETERSBURG_PELICANS",
  HOUSTON_TEXANS: "HOUSTON_LAUNCH",
  DALLAS_COWBOYS: "DALLAS_IMPERIALS",
  BALTIMORE_RAVENS: "BALTIMORE_ADMIRALS",
  NEW_ENGLAND_PATRIOTS: "BOSTON_HARBORMEN",
  LOS_ANGELES_RAMS: "LOS_ANGELES_STARS",
  GREEN_BAY_PACKERS: "MILWAUKEE_NORTHSHORE",
  ARIZONA_CARDINALS: "PHOENIX_SCORCH",
  CLEVELAND_BROWNS: "CLEVELAND_FORGE",
};

function toKey(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeExcelTeamKey(excelTeam: string): string {
  const normalized = toKey(excelTeam);
  if (UGF_TEAM_BY_KEY.has(normalized)) return normalized;
  return KNOWN_ALIASES[normalized] ?? normalized;
}

export function getUgfTeamByExcelKey(excelTeam: string): UgfTeam | null {
  const team = UGF_TEAM_BY_KEY.get(normalizeExcelTeamKey(excelTeam)) ?? null;
  if (!team && typeof window !== "undefined" && import.meta.env.DEV) {
    console.error(`[teamMap] Unknown team mapping for '${excelTeam}'.`);
  }
  return team;
}

export function getDisplayTeamName(excelTeam: string): string {
  return getUgfTeamByExcelKey(excelTeam)?.team ?? "Unknown Team";
}

export { UGF_TEAMS };
