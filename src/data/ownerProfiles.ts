export type OwnerArchetype =
  | "impatient"
  | "patient"
  | "traditional"
  | "disciplined"
  | "volatile"
  | "measured"
  | "new_owner"
  | "hands_on"
  | "demanding"
  | "process_oriented"
  | "conservative"
  | "ambitious"
  | "dominant"
  | "innovative"
  | "institutional"
  | "opportunistic"
  | "pragmatic"
  | "analytical"
  | "image_focused";

export type OwnerProfileLite = {
  teamKey: string;
  ownerName: string;
  archetype: OwnerArchetype;
  traits: string[];
};

export const OWNER_PROFILES: Record<string, OwnerProfileLite> = {
  NEW_YORK_GOTHIC_GUARDIANS: { teamKey: "NEW_YORK_GOTHIC_GUARDIANS", ownerName: "Leonard Weiss", archetype: "impatient", traits: ["impatient", "media-sensitive"] },
  BOSTON_HARBORMEN: { teamKey: "BOSTON_HARBORMEN", ownerName: "Charles Whitlock", archetype: "patient", traits: ["patient", "institutional"] },
  PHILADELPHIA_FOUNDERS: { teamKey: "PHILADELPHIA_FOUNDERS", ownerName: "Edward Monroe", archetype: "traditional", traits: ["traditional"] },
  BALTIMORE_ADMIRALS: { teamKey: "BALTIMORE_ADMIRALS", ownerName: "Thomas Radcliffe", archetype: "disciplined", traits: ["disciplined"] },
  MIAMI_TIDE: { teamKey: "MIAMI_TIDE", ownerName: "Carlos Mendoza", archetype: "volatile", traits: ["volatile"] },
  ORLANDO_KINGDOM: { teamKey: "ORLANDO_KINGDOM", ownerName: "Patricia Greene", archetype: "measured", traits: ["measured"] },
  ST_PETERSBURG_PELICANS: { teamKey: "ST_PETERSBURG_PELICANS", ownerName: "Ivan Petrov", archetype: "new_owner", traits: ["new owner"] },
  JACKSONVILLE_FLEET: { teamKey: "JACKSONVILLE_FLEET", ownerName: "Bill Loomis", archetype: "hands_on", traits: ["hands-on"] },
  PITTSBURGH_IRONCLADS: { teamKey: "PITTSBURGH_IRONCLADS", ownerName: "Ronald Becker", archetype: "demanding", traits: ["demanding"] },
  CLEVELAND_FORGE: { teamKey: "CLEVELAND_FORGE", ownerName: "Martin O'Neill", archetype: "process_oriented", traits: ["process-oriented"] },
  DETROIT_ASSEMBLY: { teamKey: "DETROIT_ASSEMBLY", ownerName: "Harold Simmons", archetype: "patient", traits: ["patient"] },
  BUFFALO_NORTHWIND: { teamKey: "BUFFALO_NORTHWIND", ownerName: "Samuel Price", archetype: "conservative", traits: ["conservative"] },
  HOUSTON_LAUNCH: { teamKey: "HOUSTON_LAUNCH", ownerName: "Victor Alvarez", archetype: "ambitious", traits: ["ambitious"] },
  DALLAS_IMPERIALS: { teamKey: "DALLAS_IMPERIALS", ownerName: "William Carter", archetype: "dominant", traits: ["dominant"] },
  DENVER_SUMMIT: { teamKey: "DENVER_SUMMIT", ownerName: "Gregory Holt", archetype: "measured", traits: ["measured"] },
  PHOENIX_SCORCH: { teamKey: "PHOENIX_SCORCH", ownerName: "Victor Hale", archetype: "innovative", traits: ["innovative"] },
  WASHINGTON_SENTINELS: { teamKey: "WASHINGTON_SENTINELS", ownerName: "Eleanor Wright", archetype: "institutional", traits: ["institutional"] },
  ATLANTA_APEX: { teamKey: "ATLANTA_APEX", ownerName: "Gerald Monroe", archetype: "impatient", traits: ["impatient"] },
  BIRMINGHAM_VULCANS: { teamKey: "BIRMINGHAM_VULCANS", ownerName: "Marcus Hill", archetype: "patient", traits: ["patient"] },
  CHARLOTTE_CROWN: { teamKey: "CHARLOTTE_CROWN", ownerName: "William Prescott", archetype: "traditional", traits: ["traditional"] },
  NEW_ORLEANS_HEX: { teamKey: "NEW_ORLEANS_HEX", ownerName: "Claude Boudreaux", archetype: "volatile", traits: ["volatile"] },
};

export function getOwnerProfileByTeamKey(teamKey: string): OwnerProfileLite | null {
  return OWNER_PROFILES[teamKey] ?? null;
}
