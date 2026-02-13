import { humanizeId } from "@/ui/helpers/format";

type TeamLike = {
  id?: string;
  teamId?: string;
  name?: string;
  region?: string;
};

export function getTeamDisplayName(team?: TeamLike, fallbackId?: string): string {
  const teamName = String(team?.name ?? "").trim();
  if (teamName) return teamName;

  const region = String(team?.region ?? "").trim();
  const fallback = String(fallbackId ?? team?.id ?? team?.teamId ?? "").trim();
  const humanizedFallback = humanizeId(fallback);
  return [region, humanizedFallback].filter(Boolean).join(" ").trim() || "Team";
}
