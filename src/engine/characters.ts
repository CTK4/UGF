import type { Character } from "@/engine/gameState";
import { getOwnerProfileByTeamKey } from "@/data/ownerProfiles";
import { getTeams } from "@/data/leagueDb";

function hash32(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: string, key: string): number {
  return (hash32(`${seed}|${key}`) % 1_000_000) / 1_000_000;
}

function pickBand(value: number): "LOW" | "MEDIUM" | "HIGH" {
  if (value < 0.34) return "LOW";
  if (value < 0.67) return "MEDIUM";
  return "HIGH";
}

function ownerTraitsFor(seed: string) {
  return {
    patience: pickBand(unit(seed, "patience")),
    spending: pickBand(unit(seed, "spending")),
    interference: pickBand(unit(seed, "interference")),
  };
}

function gmBiasesFor(seed: string) {
  const toRating = (key: string) => Math.round(unit(seed, key) * 100);
  return {
    youth: toRating("youth"),
    speed: toRating("speed"),
    ras: toRating("ras"),
    discipline: toRating("discipline"),
    trenches: toRating("trenches"),
  };
}

function titleCaseNameFromTeam(teamName: string, suffix: string): string {
  const root = teamName.split(" ")[0] || "UGF";
  return `${root} ${suffix}`;
}

export function buildCharacterRegistry(input: {
  leagueSeed: number;
  coachName: string;
  coachAge: number;
  coachPersonality: string;
  userTeamKey: string;
}): {
  byId: Record<string, Character>;
  coachId: string;
  ownersByTeamKey: Record<string, string>;
  gmsByTeamKey: Record<string, string>;
  teamFrontOffice: Record<string, { ownerId: string; gmId: string }>;
} {
  const byId: Record<string, Character> = {};
  const ownersByTeamKey: Record<string, string> = {};
  const gmsByTeamKey: Record<string, string> = {};
  const teamFrontOffice: Record<string, { ownerId: string; gmId: string }> = {};

  const coachId = `char:coach:${input.userTeamKey}`;
  byId[coachId] = {
    id: coachId,
    role: "COACH",
    teamKey: input.userTeamKey,
    fullName: input.coachName,
    age: input.coachAge,
    personality: input.coachPersonality,
  };

  for (const team of getTeams()) {
    const teamKey = String(team.teamId ?? "").trim();
    if (!teamKey) continue;
    const teamName = String(team.name ?? teamKey);
    const seed = `${input.leagueSeed}:${teamKey}`;
    const ownerId = `char:owner:${teamKey}`;
    const gmId = `char:gm:${teamKey}`;
    const ownerProfile = getOwnerProfileByTeamKey(teamKey);

    byId[ownerId] = {
      id: ownerId,
      role: "OWNER",
      teamKey,
      fullName: ownerProfile?.ownerName ?? titleCaseNameFromTeam(teamName, "Ownership"),
      personality: ownerProfile?.archetype ?? "Balanced",
      ownerTraits: ownerTraitsFor(seed),
    };

    byId[gmId] = {
      id: gmId,
      role: "GM",
      teamKey,
      fullName: titleCaseNameFromTeam(teamName, "GM"),
      personality: unit(seed, "gm-personality") > 0.5 ? "Analytical" : "Traditional",
      gmBiases: gmBiasesFor(seed),
    };

    ownersByTeamKey[teamKey] = ownerId;
    gmsByTeamKey[teamKey] = gmId;
    teamFrontOffice[teamKey] = { ownerId, gmId };
  }

  return { byId, coachId, ownersByTeamKey, gmsByTeamKey, teamFrontOffice };
}
