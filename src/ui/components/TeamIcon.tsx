import React, { useEffect, useMemo, useState } from "react";

export type TeamIconProps = {
  teamKey: string;
  size?: number;
  className?: string;
  variant?: "square" | "circle";
};

const FILLER_WORDS = new Set(["OF", "THE"]);

export function resolveTeamIconCandidates(teamKey: string): string[] {
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

export function TeamIcon({ teamKey, size = 40, className, variant = "square" }: TeamIconProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidates = useMemo(() => resolveTeamIconCandidates(teamKey), [teamKey]);
  const initials = useMemo(() => getTeamInitials(teamKey), [teamKey]);
  const innerSize = Math.max(12, size - 8);
  const activeSrc = candidates[candidateIndex] ?? null;
  const radius = variant === "circle" ? "50%" : 8;

  useEffect(() => {
    setCandidateIndex(0);
  }, [teamKey]);

  if (!activeSrc) {
    return (
      <span
        className={className}
        aria-label={`${teamKey} icon fallback`}
        title={teamKey}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          flex: "0 0 auto",
          flexShrink: 0,
          boxSizing: "border-box",
          borderRadius: radius,
          padding: 4,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          fontWeight: 700,
          fontSize: Math.max(10, Math.round(innerSize * 0.34)),
          letterSpacing: "0.04em",
          color: "rgba(245,247,250,0.9)",
          textTransform: "uppercase",
          overflow: "hidden",
          lineHeight: 1,
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
      alt={`${teamKey} icon`}
      width={size}
      height={size}
      loading="lazy"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flex: "0 0 auto",
        flexShrink: 0,
        boxSizing: "border-box",
        padding: 4,
        objectFit: "contain",
        borderRadius: radius,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
      }}
      onError={() => setCandidateIndex((idx) => idx + 1)}
    />
  );
}

export const TeamLogo = TeamIcon;
