import { TeamLogo, type TeamLogoProps, getTeamInitials, resolveTeamLogoCandidates } from "@/ui/components/TeamLogo";

export type TeamIconProps = {
  teamKey: string;
  size?: number;
  className?: string;
  variant?: "square" | "circle";
};

export function resolveTeamIconCandidates(teamKey: string): string[] {
  return resolveTeamLogoCandidates(teamKey);
}

export { getTeamInitials };

export function TeamIcon({ teamKey, size, className }: TeamIconProps) {
  const props: TeamLogoProps = { teamKey, size, className, variant: "list" };
  return <TeamLogo {...props} />;
}

export { TeamLogo };
