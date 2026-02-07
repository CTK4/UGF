import placeholder from "@/assets/teamLogos/placeholder.jpeg";
import houstonMark from "@/assets/teamLogos/HOU/mark.jpeg";

export type TeamLogoVariant = "mark";

const TEAM_MARKS: Record<string, string> = {
  HOU: houstonMark,
};

export function teamLogoUrl(teamId: string, variant: TeamLogoVariant = "mark"): string {
  if (variant !== "mark") return placeholder;
  return TEAM_MARKS[teamId] ?? placeholder;
}
