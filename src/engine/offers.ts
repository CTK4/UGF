import type { OwnerProfile } from "@/data/owners";
import { getOwnerProfile } from "@/data/owners";
import type { InterviewInviteTier } from "@/ui/types";

export type OfferPressure = "LOW" | "MODERATE" | "HIGH";

export type OfferTerms = {
  years: number;
  pressure: OfferPressure;
  mandate: string;
};

const PRESSURE_UP: Record<OfferPressure, OfferPressure> = {
  LOW: "MODERATE",
  MODERATE: "HIGH",
  HIGH: "HIGH",
};

const PRESSURE_DOWN: Record<OfferPressure, OfferPressure> = {
  LOW: "LOW",
  MODERATE: "LOW",
  HIGH: "MODERATE",
};

export function deriveOfferTerms(tier: InterviewInviteTier, owner: OwnerProfile): OfferTerms {
  let terms: OfferTerms =
    tier === "REBUILD"
      ? { years: 4, pressure: "LOW", mandate: "Stabilize and build" }
      : tier === "FRINGE"
        ? { years: 3, pressure: "MODERATE", mandate: "Compete and improve" }
        : { years: 2, pressure: "HIGH", mandate: "Win now" };

  if (owner.patience === "LOW") {
    terms = {
      ...terms,
      years: Math.max(2, terms.years - 1),
      pressure: PRESSURE_UP[terms.pressure],
    };
  }

  if (owner.patience === "HIGH") {
    terms = {
      ...terms,
      years: Math.min(5, terms.years + 1),
      pressure: PRESSURE_DOWN[terms.pressure],
    };
  }

  const mandateAdditions: string[] = [];

  if (owner.mediaSensitivity === "HIGH") {
    terms = { ...terms, pressure: PRESSURE_UP[terms.pressure] };
    mandateAdditions.push("Public scrutiny");
  }

  if (owner.budgetPosture === "CHEAP") {
    mandateAdditions.push("Value discipline");
  }

  if (owner.budgetPosture === "PREMIUM") {
    mandateAdditions.push("Aggressive spending allowed");
  }

  if (mandateAdditions.length > 0) {
    terms = { ...terms, mandate: `${terms.mandate} • ${mandateAdditions.join(" • ")}` };
  }

  return terms;
}

export function deriveOfferTermsForTeam(tier: InterviewInviteTier, teamKey: string): OfferTerms {
  return deriveOfferTerms(tier, getOwnerProfile(teamKey));
}
