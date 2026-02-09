import { normalizeExcelTeamKey } from "@/data/teamMap";
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

export type OwnerTrait =
  | "impatient"
  | "patient"
  | "institutional"
  | "traditional"
  | "disciplined"
  | "volatile"
  | "media-sensitive"
  | "media-aware"
  | "assertive"
  | "hands-on"
  | "demanding"
  | "process-oriented"
  | "conservative"
  | "ambitious"
  | "dominant"
  | "opportunistic"
  | "analytical"
  | "image-focused"
  | "innovative"
  | "new owner"
  | "measured"
  | "pragmatic";

export type OwnerProfile = {
  teamKey: string;
  teamName: string;
  ownerName: string;
  archetype: OwnerArchetype;
  traits: OwnerTrait[];
  bio: string;
  patience: "LOW" | "MEDIUM" | "HIGH";
  budgetPosture: "CHEAP" | "BALANCED" | "PREMIUM";
  mediaSensitivity: "LOW" | "MEDIUM" | "HIGH";
  meddling: "LOW" | "MEDIUM" | "HIGH";
};

type BaseOwnerProfile = Omit<OwnerProfile, "patience" | "budgetPosture" | "mediaSensitivity" | "meddling">;

const BASE_OWNER_PROFILES: Record<TeamKey, BaseOwnerProfile> = {
  NEW_YORK_GOTHIC_GUARDIANS: {
    teamKey: "NEW_YORK_GOTHIC_GUARDIANS",
    teamName: "New York Gothic Guardians",
    ownerName: "Leonard Weiss",
    archetype: "impatient",
    traits: ["impatient", "media-sensitive"],
    bio: "Owner known for impatient, media-sensitive.",
  },
  BOSTON_HARBORMEN: {
    teamKey: "BOSTON_HARBORMEN",
    teamName: "Boston Harbormen",
    ownerName: "Charles Whitlock",
    archetype: "patient",
    traits: ["patient", "institutional"],
    bio: "Owner known for patient, institutional.",
  },
  PHILADELPHIA_FOUNDERS: {
    teamKey: "PHILADELPHIA_FOUNDERS",
    teamName: "Philadelphia Founders",
    ownerName: "Edward Monroe",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  BALTIMORE_ADMIRALS: {
    teamKey: "BALTIMORE_ADMIRALS",
    teamName: "Baltimore Admirals",
    ownerName: "Thomas Radcliffe",
    archetype: "disciplined",
    traits: ["disciplined"],
    bio: "Owner known for disciplined.",
  },
  MIAMI_TIDE: {
    teamKey: "MIAMI_TIDE",
    teamName: "Miami Tide",
    ownerName: "Carlos Mendoza",
    archetype: "volatile",
    traits: ["volatile", "media-aware"],
    bio: "Owner known for volatile, media-aware.",
  },
  ORLANDO_KINGDOM: {
    teamKey: "ORLANDO_KINGDOM",
    teamName: "Orlando Kingdom",
    ownerName: "Patricia Greene",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
  ST_PETERSBURG_PELICANS: {
    teamKey: "ST_PETERSBURG_PELICANS",
    teamName: "St. Petersburg Pelicans",
    ownerName: "Ivan Petrov",
    archetype: "new owner",
    traits: ["new owner", "assertive"],
    bio: "Owner known for new owner, assertive.",
  },
  JACKSONVILLE_FLEET: {
    teamKey: "JACKSONVILLE_FLEET",
    teamName: "Jacksonville Fleet",
    ownerName: "Bill Loomis",
    archetype: "hands-on",
    traits: ["hands-on"],
    bio: "Owner known for hands-on.",
  },
  PITTSBURGH_IRONCLADS: {
    teamKey: "PITTSBURGH_IRONCLADS",
    teamName: "Pittsburgh Ironclads",
    ownerName: "Ronald Becker",
    archetype: "demanding",
    traits: ["demanding"],
    bio: "Owner known for demanding.",
  },
  CLEVELAND_FORGE: {
    teamKey: "CLEVELAND_FORGE",
    teamName: "Cleveland Forge",
    ownerName: "Martin O’Neill",
    archetype: "process-oriented",
    traits: ["process-oriented"],
    bio: "Owner known for process-oriented.",
  },
  DETROIT_ASSEMBLY: {
    teamKey: "DETROIT_ASSEMBLY",
    teamName: "Detroit Assembly",
    ownerName: "Harold Simmons",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  BUFFALO_NORTHWIND: {
    teamKey: "BUFFALO_NORTHWIND",
    teamName: "Buffalo Northwind",
    ownerName: "Samuel Price",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  HOUSTON_LAUNCH: {
    teamKey: "HOUSTON_LAUNCH",
    teamName: "Houston Launch",
    ownerName: "Victor Alvarez",
    archetype: "ambitious",
    traits: ["ambitious"],
    bio: "Owner known for ambitious.",
  },
  DALLAS_IMPERIALS: {
    teamKey: "DALLAS_IMPERIALS",
    teamName: "Dallas Imperials",
    ownerName: "William Carter",
    archetype: "dominant",
    traits: ["dominant"],
    bio: "Owner known for dominant.",
  },
  DENVER_SUMMIT: {
    teamKey: "DENVER_SUMMIT",
    teamName: "Denver Summit",
    ownerName: "Gregory Holt",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
  PHOENIX_SCORCH: {
    teamKey: "PHOENIX_SCORCH",
    teamName: "Phoenix Scorch",
    ownerName: "Victor Hale",
    archetype: "innovative",
    traits: ["innovative", "media-sensitive"],
    bio: "Owner known for temperament: innovative patience: medium meddling: low media_sensitivity: high goal: sustained relevance.",
  },
  WASHINGTON_SENTINELS: {
    teamKey: "WASHINGTON_SENTINELS",
    teamName: "Washington Sentinels",
    ownerName: "Eleanor Wright",
    archetype: "institutional",
    traits: ["institutional"],
    bio: "Owner known for institutional.",
  },
  ATLANTA_APEX: {
    teamKey: "ATLANTA_APEX",
    teamName: "Atlanta Apex",
    ownerName: "Gerald Monroe",
    archetype: "impatient",
    traits: ["impatient"],
    bio: "Owner known for impatient.",
  },
  BIRMINGHAM_VULCANS: {
    teamKey: "BIRMINGHAM_VULCANS",
    teamName: "Birmingham Vulcans",
    ownerName: "Marcus Hill",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  CHARLOTTE_CROWN: {
    teamKey: "CHARLOTTE_CROWN",
    teamName: "Charlotte Crown",
    ownerName: "William Prescott",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  NEW_ORLEANS_HEX: {
    teamKey: "NEW_ORLEANS_HEX",
    teamName: "New Orleans Hex",
    ownerName: "Claude Boudreaux",
    archetype: "volatile",
    traits: ["volatile"],
    bio: "Owner known for volatile.",
  },
  NASHVILLE_SOUND: {
    teamKey: "NASHVILLE_SOUND",
    teamName: "Nashville Sound",
    ownerName: "Howard Jennings",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  AUSTIN_EMPIRE: {
    teamKey: "AUSTIN_EMPIRE",
    teamName: "Austin Empire",
    ownerName: "Raymond Calder",
    archetype: "ambitious",
    traits: ["ambitious"],
    bio: "Owner known for ambitious.",
  },
  INDIANAPOLIS_CROSSROADS: {
    teamKey: "INDIANAPOLIS_CROSSROADS",
    teamName: "Indianapolis Crossroads",
    ownerName: "Thomas Caldwell",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  LAS_VEGAS_SYNDICATE: {
    teamKey: "LAS_VEGAS_SYNDICATE",
    teamName: "Las Vegas Syndicate",
    ownerName: "Victor Salazar",
    archetype: "opportunistic",
    traits: ["opportunistic"],
    bio: "Owner known for opportunistic.",
  },
  MEMPHIS_BLUES: {
    teamKey: "MEMPHIS_BLUES",
    teamName: "Memphis Blues",
    ownerName: "Harold Whitaker",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  MILWAUKEE_NORTHSHORE: {
    teamKey: "MILWAUKEE_NORTHSHORE",
    teamName: "Milwaukee Northshore",
    ownerName: "Elaine Fischer",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  CHICAGO_UNION: {
    teamKey: "CHICAGO_UNION",
    teamName: "Chicago Union",
    ownerName: "Dennis Kowalski",
    archetype: "pragmatic",
    traits: ["pragmatic"],
    bio: "Owner known for pragmatic.",
  },
  ST_LOUIS_ARCHONS: {
    teamKey: "ST_LOUIS_ARCHONS",
    teamName: "St. Louis Archons",
    ownerName: "Robert Hensley",
    archetype: "disciplined",
    traits: ["disciplined"],
    bio: "Owner known for disciplined.",
  },
  SEATTLE_EVERGREENS: {
    teamKey: "SEATTLE_EVERGREENS",
    teamName: "Seattle Evergreens",
    ownerName: "Nathan Kim",
    archetype: "analytical",
    traits: ["analytical"],
    bio: "Owner known for analytical.",
  },
  LOS_ANGELES_STARS: {
    teamKey: "LOS_ANGELES_STARS",
    teamName: "Los Angeles Stars",
    ownerName: "Victor Sandoval",
    archetype: "image-focused",
    traits: ["image-focused"],
    bio: "Owner known for image-focused.",
  },
  SAN_DIEGO_ARMADA: {
    teamKey: "SAN_DIEGO_ARMADA",
    teamName: "San Diego Armada",
    ownerName: "Miguel Arroyo",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
};

function derivePatience(traits: OwnerTrait[]): OwnerProfile["patience"] {
  if (traits.includes("impatient") || traits.includes("volatile") || traits.includes("demanding")) return "LOW";
  if (traits.includes("patient") || traits.includes("institutional") || traits.includes("process-oriented") || traits.includes("analytical")) return "HIGH";
  return "MEDIUM";
}

function deriveBudgetPosture(traits: OwnerTrait[]): OwnerProfile["budgetPosture"] {
  if (traits.includes("conservative")) return "CHEAP";
  if (traits.includes("dominant") || traits.includes("ambitious") || traits.includes("image-focused")) return "PREMIUM";
  return "BALANCED";
}

function deriveMediaSensitivity(traits: OwnerTrait[]): OwnerProfile["mediaSensitivity"] {
  if (traits.includes("media-sensitive") || traits.includes("image-focused") || traits.includes("media-aware")) return "HIGH";
  if (traits.includes("institutional") || traits.includes("analytical")) return "LOW";
  return "MEDIUM";
}

function deriveMeddling(traits: OwnerTrait[]): OwnerProfile["meddling"] {
  if (traits.includes("hands-on") || traits.includes("dominant")) return "HIGH";
  if (traits.includes("process-oriented") || traits.includes("analytical")) return "LOW";
  return "MEDIUM";
}

export const OWNER_PROFILES: Record<TeamKey, OwnerProfile> = Object.fromEntries(
  Object.entries(BASE_OWNER_PROFILES).map(([teamKey, baseProfile]) => [
    teamKey,
    {
      ...baseProfile,
      patience: derivePatience(baseProfile.traits),
      budgetPosture: deriveBudgetPosture(baseProfile.traits),
      mediaSensitivity: deriveMediaSensitivity(baseProfile.traits),
      meddling: deriveMeddling(baseProfile.traits),
    },
  ]),
) as Record<TeamKey, OwnerProfile>;

export function getOwnerProfile(teamKey: string): OwnerProfile {
  const normalizedKey = normalizeExcelTeamKey(teamKey);
  return (
    OWNER_PROFILES[normalizedKey as TeamKey] ?? {
      teamKey: normalizedKey,
      teamName: "Unknown Team",
      ownerName: "Ownership Group",
      archetype: "pragmatic",
      traits: ["pragmatic"],
      bio: "Owner known for pragmatic.",
      patience: "MEDIUM",
      budgetPosture: "BALANCED",
      mediaSensitivity: "MEDIUM",
      meddling: "MEDIUM",
    }
  );
}
