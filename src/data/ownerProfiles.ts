import type { UgfTeam } from "@/data/ugfTeams";

export type TeamKey = UgfTeam["key"];

export type OwnerArchetype =
  | "impatient"
  | "patient"
  | "traditional"
  | "disciplined"
  | "volatile"
  | "measured"
  | "new owner"
  | "hands-on"
  | "demanding"
  | "process-oriented"
  | "conservative"
  | "ambitious"
  | "dominant"
  | "institutional"
  | "opportunistic"
  | "analytical"
  | "image-focused"
  | "innovative"
  | "pragmatic";

export type OwnerProfileLite = {
  teamKey: TeamKey;
  teamName: string;
  ownerName: string;
  archetype: OwnerArchetype;
  traits: string[];
};

export const OWNER_PROFILES: Record<TeamKey, OwnerProfileLite> = {
  ATLANTA_APEX: { teamKey: "ATLANTA_APEX", teamName: "Atlanta Apex", ownerName: "Gerald Monroe", archetype: "impatient", traits: ["impatient"] },
  AUSTIN_EMPIRE: { teamKey: "AUSTIN_EMPIRE", teamName: "Austin Empire", ownerName: "Raymond Calder", archetype: "ambitious", traits: ["ambitious"] },
  BALTIMORE_ADMIRALS: { teamKey: "BALTIMORE_ADMIRALS", teamName: "Baltimore Admirals", ownerName: "Thomas Radcliffe", archetype: "disciplined", traits: ["disciplined"] },
  BIRMINGHAM_VULCANS: { teamKey: "BIRMINGHAM_VULCANS", teamName: "Birmingham Vulcans", ownerName: "Marcus Hill", archetype: "patient", traits: ["patient"] },
  BOSTON_HARBORMEN: { teamKey: "BOSTON_HARBORMEN", teamName: "Boston Harbormen", ownerName: "Charles Whitlock", archetype: "patient", traits: ["patient", "institutional"] },
  BUFFALO_NORTHWIND: { teamKey: "BUFFALO_NORTHWIND", teamName: "Buffalo Northwind", ownerName: "Samuel Price", archetype: "conservative", traits: ["conservative"] },
  CHARLOTTE_CROWN: { teamKey: "CHARLOTTE_CROWN", teamName: "Charlotte Crown", ownerName: "William Prescott", archetype: "traditional", traits: ["traditional"] },
  CHICAGO_UNION: { teamKey: "CHICAGO_UNION", teamName: "Chicago Union", ownerName: "Dennis Kowalski", archetype: "pragmatic", traits: ["pragmatic"] },
  CLEVELAND_FORGE: { teamKey: "CLEVELAND_FORGE", teamName: "Cleveland Forge", ownerName: "Martin O'Neill", archetype: "process-oriented", traits: ["process-oriented"] },
  DALLAS_IMPERIALS: { teamKey: "DALLAS_IMPERIALS", teamName: "Dallas Imperials", ownerName: "William Carter", archetype: "dominant", traits: ["dominant"] },
  DENVER_SUMMIT: { teamKey: "DENVER_SUMMIT", teamName: "Denver Summit", ownerName: "Gregory Holt", archetype: "measured", traits: ["measured"] },
  DETROIT_ASSEMBLY: { teamKey: "DETROIT_ASSEMBLY", teamName: "Detroit Assembly", ownerName: "Harold Simmons", archetype: "patient", traits: ["patient"] },
  HOUSTON_LAUNCH: { teamKey: "HOUSTON_LAUNCH", teamName: "Houston Launch", ownerName: "Victor Alvarez", archetype: "ambitious", traits: ["ambitious"] },
  INDIANAPOLIS_CROSSROADS: { teamKey: "INDIANAPOLIS_CROSSROADS", teamName: "Indianapolis Crossroads", ownerName: "Thomas Caldwell", archetype: "conservative", traits: ["conservative"] },
  JACKSONVILLE_FLEET: { teamKey: "JACKSONVILLE_FLEET", teamName: "Jacksonville Fleet", ownerName: "Bill Loomis", archetype: "hands-on", traits: ["hands-on"] },
  LAS_VEGAS_SYNDICATE: { teamKey: "LAS_VEGAS_SYNDICATE", teamName: "Las Vegas Syndicate", ownerName: "Victor Salazar", archetype: "opportunistic", traits: ["opportunistic"] },
  LOS_ANGELES_STARS: { teamKey: "LOS_ANGELES_STARS", teamName: "Los Angeles Stars", ownerName: "Victor Sandoval", archetype: "image-focused", traits: ["image-focused"] },
  MEMPHIS_BLUES: { teamKey: "MEMPHIS_BLUES", teamName: "Memphis Blues", ownerName: "Harold Whitaker", archetype: "traditional", traits: ["traditional"] },
  MIAMI_TIDE: { teamKey: "MIAMI_TIDE", teamName: "Miami Tide", ownerName: "Carlos Mendoza", archetype: "volatile", traits: ["volatile", "media-aware"] },
  MILWAUKEE_NORTHSHORE: { teamKey: "MILWAUKEE_NORTHSHORE", teamName: "Milwaukee Northshore", ownerName: "Elaine Fischer", archetype: "patient", traits: ["patient"] },
  NASHVILLE_SOUND: { teamKey: "NASHVILLE_SOUND", teamName: "Nashville Sound", ownerName: "Howard Jennings", archetype: "conservative", traits: ["conservative"] },
  NEW_ORLEANS_HEX: { teamKey: "NEW_ORLEANS_HEX", teamName: "New Orleans Hex", ownerName: "Claude Boudreaux", archetype: "volatile", traits: ["volatile"] },
  NEW_YORK_GOTHIC_GUARDIANS: {
    teamKey: "NEW_YORK_GOTHIC_GUARDIANS",
    teamName: "New York Gothic Guardians",
    ownerName: "Leonard Weiss",
    archetype: "impatient",
    traits: ["impatient", "media-sensitive"],
  },
  ORLANDO_KINGDOM: { teamKey: "ORLANDO_KINGDOM", teamName: "Orlando Kingdom", ownerName: "Patricia Greene", archetype: "measured", traits: ["measured"] },
  PHILADELPHIA_FOUNDERS: { teamKey: "PHILADELPHIA_FOUNDERS", teamName: "Philadelphia Founders", ownerName: "Edward Monroe", archetype: "traditional", traits: ["traditional"] },
  PHOENIX_SCORCH: { teamKey: "PHOENIX_SCORCH", teamName: "Phoenix Scorch", ownerName: "Victor Hale", archetype: "innovative", traits: ["innovative", "media-sensitive"] },
  PITTSBURGH_IRONCLADS: { teamKey: "PITTSBURGH_IRONCLADS", teamName: "Pittsburgh Ironclads", ownerName: "Ronald Becker", archetype: "demanding", traits: ["demanding"] },
  SAN_DIEGO_ARMADA: { teamKey: "SAN_DIEGO_ARMADA", teamName: "San Diego Armada", ownerName: "Miguel Arroyo", archetype: "measured", traits: ["measured"] },
  SEATTLE_EVERGREENS: { teamKey: "SEATTLE_EVERGREENS", teamName: "Seattle Evergreens", ownerName: "Nathan Kim", archetype: "analytical", traits: ["analytical"] },
  ST_LOUIS_ARCHONS: { teamKey: "ST_LOUIS_ARCHONS", teamName: "St. Louis Archons", ownerName: "Robert Hensley", archetype: "disciplined", traits: ["disciplined"] },
  ST_PETERSBURG_PELICANS: { teamKey: "ST_PETERSBURG_PELICANS", teamName: "St. Petersburg Pelicans", ownerName: "Ivan Petrov", archetype: "new owner", traits: ["new owner", "assertive"] },
  WASHINGTON_SENTINELS: { teamKey: "WASHINGTON_SENTINELS", teamName: "Washington Sentinels", ownerName: "Eleanor Wright", archetype: "institutional", traits: ["institutional"] },
};

export function getOwnerProfileByTeamKey(teamKey: string): OwnerProfileLite | null {
  return (OWNER_PROFILES as Record<string, OwnerProfileLite>)[teamKey] ?? null;
}
