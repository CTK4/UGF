import type { OwnerProfile } from "@/data/owners";
import { getOwnerProfile } from "@/data/owners";
import type { OpeningInterviewQuestion } from "@/data/interviewQuestions";

export type InterviewAxis = "owner" | "gm" | "pressure";

export type WeightedDelta = {
  owner: number;
  gm: number;
  pressure: number;
  tone: string;
};

function clampDelta(value: number): number {
  return Math.max(-10, Math.min(10, value));
}

function scaleWithSign(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}

export function computeTeamWeightedDelta(args: {
  teamKey: string;
  questionIndex: number;
  choiceIndex: number;
  base: OpeningInterviewQuestion["choices"][number];
}): WeightedDelta {
  const { teamKey, base } = args;
  const owner: OwnerProfile = getOwnerProfile(teamKey);

  let ownerAxisMultiplier = 1;
  if (owner.traits.some((trait) => ["impatient", "volatile", "demanding", "media-sensitive", "image-focused"].includes(trait))) {
    ownerAxisMultiplier *= 1.3;
  }
  if (owner.traits.some((trait) => ["patient", "institutional", "process-oriented", "analytical"].includes(trait))) {
    ownerAxisMultiplier *= 0.8;
  }

  let gmAxisMultiplier = 1;
  if (owner.traits.some((trait) => ["process-oriented", "analytical"].includes(trait))) {
    gmAxisMultiplier *= 1.3;
  }
  if (owner.traits.some((trait) => ["hands-on", "dominant"].includes(trait))) {
    gmAxisMultiplier *= 0.9;
  }

  let pressureAxisMultiplier = 1;
  if (owner.traits.some((trait) => ["media-sensitive", "media-aware", "image-focused", "volatile"].includes(trait))) {
    pressureAxisMultiplier *= 1.3;
  }
  if (owner.traits.some((trait) => ["institutional", "analytical"].includes(trait))) {
    pressureAxisMultiplier *= 0.8;
  }

  const ownerDelta = clampDelta(scaleWithSign(base.owner, ownerAxisMultiplier));
  const gmDelta = clampDelta(scaleWithSign(base.gm, gmAxisMultiplier));
  const pressureDelta = clampDelta(scaleWithSign(base.pressure, pressureAxisMultiplier));

  return {
    owner: ownerDelta,
    gm: gmDelta,
    pressure: pressureDelta,
    tone: `${base.tone}${ownerDelta >= 0 ? " (Ownership approves.)" : " (Ownership pushed back.)"}`,
  };
}
