import React, { useEffect, useMemo, useState } from "react";
import { getTeamDisplayName } from "@/ui/helpers/teamDisplay";

export type TeamLogoProps = {
  teamKey: string;
  displayName?: string;
  size?: number;
  variant?: "list" | "standings" | "header";
  className?: string;
};

const FILLER_WORDS = new Set(["OF", "THE"]);
const DEFAULT_SIZE_BY_VARIANT: Record<NonNullable<TeamLogoProps["variant"]>, number> = {
  list: 52,
  standings: 44,
  header: 64,
};

export function resolveTeamLogoCandidates(teamKey: string): string[] {
  const cleaned = String(teamKey ?? "").trim();
  if (!cleaned) return [];
  return [`/icons/${cleaned}.png`, "/icons/placeholder.png"];
}

export function getTeamInitials(teamKey: string): string {
  const cleaned = String(teamKey ?? "")
    .replace(/[^\p{L}\p{N}_\s-]/gu, " ")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();

  if (!cleaned) return "UGF";

  const tokens = cleaned
    .split("_")
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !FILLER_WORDS.has(token));

  const picks = (tokens.length > 0 ? tokens : [cleaned]).slice(0, 3);
  return picks.map((token) => token[0] ?? "").join("") || "UGF";
}

export function TeamLogo({ teamKey, displayName, size, variant = "list", className }: TeamLogoProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidates = useMemo(() => resolveTeamLogoCandidates(teamKey), [teamKey]);
  const initials = useMemo(() => getTeamInitials(teamKey), [teamKey]);
  const teamLabel = useMemo(() => getTeamDisplayName(displayName ? { name: displayName } : undefined, teamKey), [displayName, teamKey]);
  const resolvedSize = size ?? DEFAULT_SIZE_BY_VARIANT[variant];
  const activeSrc = candidates[candidateIndex] ?? null;

  useEffect(() => {
    setCandidateIndex(0);
  }, [teamKey]);

  if (!activeSrc) {
    return (
      <span
        className={className}
        aria-label={`${teamLabel} logo fallback`}
        title={teamLabel}
        style={{
          width: resolvedSize,
          height: resolvedSize,
          minWidth: resolvedSize,
          minHeight: resolvedSize,
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          fontWeight: 800,
          fontSize: Math.max(12, Math.round(resolvedSize * 0.34)),
          letterSpacing: "0.04em",
          color: "rgba(245,247,250,0.95)",
          textTransform: "uppercase",
          lineHeight: 1,
          textShadow: "0 2px 8px rgba(0,0,0,0.55)",
        }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={activeSrc}
      alt={`${teamLabel} logo`}
      width={resolvedSize}
      height={resolvedSize}
      loading="lazy"
      style={{
        width: resolvedSize,
        height: resolvedSize,
        minWidth: resolvedSize,
        minHeight: resolvedSize,
        flex: "0 0 auto",
        objectFit: "contain",
        borderRadius: 6,
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.10))",
      }}
      onError={() => setCandidateIndex((idx) => idx + 1)}
    />
  );
}
