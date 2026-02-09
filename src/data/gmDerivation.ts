import type { OwnerProfileLite } from "@/data/ownerProfiles";

export type TeamMetrics = {
  overall: number;
  capSpace: number;
};

export type GmArchetype = "aggressive" | "reset-driven" | "balanced";

export type GmProfile = {
  archetype: GmArchetype;
  traits: string[];
};

export function deriveGmProfile(metrics: TeamMetrics, owner: OwnerProfileLite): GmProfile {
  const traits: string[] = [];

  const archetype: GmArchetype = metrics.overall >= 80 ? "aggressive" : metrics.overall <= 68 ? "reset-driven" : "balanced";

  if (metrics.capSpace < 0) {
    traits.push("efficiency");
  }
  if (metrics.capSpace >= 15_000_000) {
    traits.push("star-driven");
  }

  if (owner.traits.includes("disciplined") || owner.traits.includes("traditional")) {
    traits.push("trenches");
  }

  if (
    owner.traits.includes("process-oriented") ||
    owner.traits.includes("analytical") ||
    owner.archetype === "innovative"
  ) {
    traits.push("analytics");
  }

  return {
    archetype,
    traits: [...new Set(traits)],
  };
}
