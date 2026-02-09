import { getTeamSummaryRows } from "@/data/generatedData";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import type { UgfTeam } from "@/data/ugfTeams";

export type TeamKey = UgfTeam["key"];
export type OwnerTone = "LOW" | "MODERATE" | "HIGH";
export type BudgetPosture = "CHEAP" | "BALANCED" | "PREMIUM";

export type OwnerProfile = {
  ownerName: string;
  archetype: string;
  traits: string[];
  bio: string;
  patience: OwnerTone;
  mediaSensitivity: OwnerTone;
  meddling: OwnerTone;
  budgetPosture: BudgetPosture;
};

type BaseOwnerProfile = Omit<OwnerProfile, "patience" | "mediaSensitivity" | "meddling" | "budgetPosture">;

const BASE_OWNER_PROFILES: Record<TeamKey, BaseOwnerProfile> = {
  NEW_YORK_GOTHIC_GUARDIANS: {
    ownerName: "Leonard Weiss",
    archetype: "impatient",
    traits: ["impatient", "media-sensitive"],
    bio: "Owner known for impatient, media-sensitive.",
  },
  BOSTON_HARBORMEN: {
    ownerName: "Charles Whitlock",
    archetype: "patient",
    traits: ["patient", "institutional"],
    bio: "Owner known for patient, institutional.",
  },
  PHILADELPHIA_FOUNDERS: {
    ownerName: "Edward Monroe",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  BALTIMORE_ADMIRALS: {
    ownerName: "Thomas Radcliffe",
    archetype: "disciplined",
    traits: ["disciplined"],
    bio: "Owner known for disciplined.",
  },
  MIAMI_TIDE: {
    ownerName: "Carlos Mendoza",
    archetype: "volatile",
    traits: ["volatile", "media-aware"],
    bio: "Owner known for volatile, media-aware.",
  },
  ORLANDO_KINGDOM: {
    ownerName: "Patricia Greene",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
  ST_PETERSBURG_PELICANS: {
    ownerName: "Ivan Petrov",
    archetype: "new owner",
    traits: ["new owner", "assertive"],
    bio: "Owner known for new owner, assertive.",
  },
  JACKSONVILLE_FLEET: {
    ownerName: "Bill Loomis",
    archetype: "hands-on",
    traits: ["hands-on"],
    bio: "Owner known for hands-on.",
  },
  PITTSBURGH_IRONCLADS: {
    ownerName: "Ronald Becker",
    archetype: "demanding",
    traits: ["demanding"],
    bio: "Owner known for demanding.",
  },
  CLEVELAND_FORGE: {
    ownerName: "Martin O’Neill",
    archetype: "process-oriented",
    traits: ["process-oriented"],
    bio: "Owner known for process-oriented.",
  },
  DETROIT_ASSEMBLY: {
    ownerName: "Harold Simmons",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  BUFFALO_NORTHWIND: {
    ownerName: "Samuel Price",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  HOUSTON_LAUNCH: {
    ownerName: "Victor Alvarez",
    archetype: "ambitious",
    traits: ["ambitious"],
    bio: "Owner known for ambitious.",
  },
  DALLAS_IMPERIALS: {
    ownerName: "William Carter",
    archetype: "dominant",
    traits: ["dominant"],
    bio: "Owner known for dominant.",
  },
  DENVER_SUMMIT: {
    ownerName: "Gregory Holt",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
  PHOENIX_SCORCH: {
    ownerName: "Victor Hale",
    archetype: "innovative",
    traits: ["innovative", "patience: medium", "meddling: low", "media_sensitivity: high", "goal: sustained relevance"],
    bio: "Owner known for temperament: innovative patience: medium meddling: low media_sensitivity: high goal: sustained relevance.",
  },
  WASHINGTON_SENTINELS: {
    ownerName: "Eleanor Wright",
    archetype: "institutional",
    traits: ["institutional"],
    bio: "Owner known for institutional.",
  },
  ATLANTA_APEX: {
    ownerName: "Gerald Monroe",
    archetype: "impatient",
    traits: ["impatient"],
    bio: "Owner known for impatient.",
  },
  BIRMINGHAM_VULCANS: {
    ownerName: "Marcus Hill",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  CHARLOTTE_CROWN: {
    ownerName: "William Prescott",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  NEW_ORLEANS_HEX: {
    ownerName: "Claude Boudreaux",
    archetype: "volatile",
    traits: ["volatile"],
    bio: "Owner known for volatile.",
  },
  NASHVILLE_SOUND: {
    ownerName: "Howard Jennings",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  AUSTIN_EMPIRE: {
    ownerName: "Raymond Calder",
    archetype: "ambitious",
    traits: ["ambitious"],
    bio: "Owner known for ambitious.",
  },
  INDIANAPOLIS_CROSSROADS: {
    ownerName: "Thomas Caldwell",
    archetype: "conservative",
    traits: ["conservative"],
    bio: "Owner known for conservative.",
  },
  LAS_VEGAS_SYNDICATE: {
    ownerName: "Victor Salazar",
    archetype: "opportunistic",
    traits: ["opportunistic"],
    bio: "Owner known for opportunistic.",
  },
  MEMPHIS_BLUES: {
    ownerName: "Harold Whitaker",
    archetype: "traditional",
    traits: ["traditional"],
    bio: "Owner known for traditional.",
  },
  MILWAUKEE_NORTHSHORE: {
    ownerName: "Elaine Fischer",
    archetype: "patient",
    traits: ["patient"],
    bio: "Owner known for patient.",
  },
  CHICAGO_UNION: {
    ownerName: "Dennis Kowalski",
    archetype: "pragmatic",
    traits: ["pragmatic"],
    bio: "Owner known for pragmatic.",
  },
  ST_LOUIS_ARCHONS: {
    ownerName: "Robert Hensley",
    archetype: "disciplined",
    traits: ["disciplined"],
    bio: "Owner known for disciplined.",
  },
  SEATTLE_EVERGREENS: {
    ownerName: "Nathan Kim",
    archetype: "analytical",
    traits: ["analytical"],
    bio: "Owner known for analytical.",
  },
  LOS_ANGELES_STARS: {
    ownerName: "Victor Sandoval",
    archetype: "image-focused",
    traits: ["image-focused"],
    bio: "Owner known for image-focused.",
  },
  SAN_DIEGO_ARMADA: {
    ownerName: "Miguel Arroyo",
    archetype: "measured",
    traits: ["measured"],
    bio: "Owner known for measured.",
  },
};

const PRESSURE_UP: Record<OwnerTone, OwnerTone> = { LOW: "MODERATE", MODERATE: "HIGH", HIGH: "HIGH" };
const PRESSURE_DOWN: Record<OwnerTone, OwnerTone> = { LOW: "LOW", MODERATE: "LOW", HIGH: "MODERATE" };

const CAP_SPACE_PERCENTILE_BY_TEAM = new Map(
  getTeamSummaryRows().map((row) => {
    const key = normalizeExcelTeamKey(String(row.Team ?? ""));
    const cap = Number((row as { "Cap Space Percentile"?: number | string })["Cap Space Percentile"]);
    return [key, Number.isFinite(cap) ? cap : null] as const;
  }),
);

function normalizePatience(archetype: string, traits: string[]): OwnerTone {
  if (archetype === "innovative" && traits.includes("patience: medium")) return "MODERATE";
  const tags = [archetype, ...traits].join(" ");
  if (/(impatient|demanding|dominant|volatile|hands-on)/.test(tags)) return "LOW";
  if (/(patient|institutional|analytical|process-oriented)/.test(tags)) return "HIGH";
  return "MODERATE";
}

function normalizeMediaSensitivity(archetype: string, traits: string[]): OwnerTone {
  if (archetype === "innovative" && traits.includes("media_sensitivity: high")) return "HIGH";
  const tags = [archetype, ...traits].join(" ");
  if (/(media-sensitive|media-aware|image-focused)/.test(tags)) return "HIGH";
  if (/(analytical|process-oriented|disciplined)/.test(tags)) return "LOW";
  return "MODERATE";
}

function normalizeMeddling(archetype: string, traits: string[]): OwnerTone {
  if (archetype === "innovative" && traits.includes("meddling: low")) return "LOW";
  const tags = [archetype, ...traits].join(" ");
  if (/(hands-on|dominant)/.test(tags)) return "HIGH";
  if (/(process-oriented|analytical|institutional)/.test(tags)) return "LOW";
  return "MODERATE";
}

function normalizeBudgetPosture(teamKey: TeamKey, archetype: string, traits: string[]): BudgetPosture {
  const percentile = CAP_SPACE_PERCENTILE_BY_TEAM.get(teamKey);
  if (typeof percentile === "number") {
    if (percentile <= 33) return "CHEAP";
    if (percentile >= 67) return "PREMIUM";
    return "BALANCED";
  }

  const tags = [archetype, ...traits].join(" ");
  if (/conservative/.test(tags)) return "CHEAP";
  if (/(dominant|ambitious|image-focused|opportunistic)/.test(tags)) return "PREMIUM";
  return "BALANCED";
}

export const OWNER_PROFILES: Record<TeamKey, OwnerProfile> = Object.fromEntries(
  Object.entries(BASE_OWNER_PROFILES).map(([teamKey, baseProfile]) => [
    teamKey,
    {
      ...baseProfile,
      patience: normalizePatience(baseProfile.archetype, baseProfile.traits),
      mediaSensitivity: normalizeMediaSensitivity(baseProfile.archetype, baseProfile.traits),
      meddling: normalizeMeddling(baseProfile.archetype, baseProfile.traits),
      budgetPosture: normalizeBudgetPosture(teamKey, baseProfile.archetype, baseProfile.traits),
    },
  ]),
) as Record<TeamKey, OwnerProfile>;

export function getOwnerProfile(teamKey: string): OwnerProfile {
  const normalizedKey = normalizeExcelTeamKey(teamKey);
  return (
    OWNER_PROFILES[normalizedKey] ?? {
      ownerName: "Ownership Group",
      archetype: "balanced",
      traits: ["balanced"],
      bio: "Owner known for balanced priorities.",
      patience: "MODERATE",
      mediaSensitivity: "MODERATE",
      meddling: "MODERATE",
      budgetPosture: "BALANCED",
    }
  );
}

export function shiftPressureUp(level: OwnerTone): OwnerTone {
  return PRESSURE_UP[level];
}

export function shiftPressureDown(level: OwnerTone): OwnerTone {
  return PRESSURE_DOWN[level];
}
