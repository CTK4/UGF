import React, { useMemo, useState } from "react";

type TeamLogoProps = {
  ugfTeamKey: string;
  displayName: string;
  size?: number;
  className?: string;
};

const FILLER_WORDS = new Set(["of", "the"]);

export function getTeamInitials(displayName: string): string {
  const cleaned = displayName
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "UGF";

  const tokens = cleaned
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !FILLER_WORDS.has(token.toLowerCase()));

  const picks = (tokens.length ? tokens : cleaned.split(" ")).slice(0, 3);
  return picks.map((token) => token[0]?.toUpperCase() ?? "").join("") || "UGF";
}

export function TeamLogo({ ugfTeamKey, displayName, size = 40, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => `/logos/${ugfTeamKey}.png`, [ugfTeamKey]);
  const initials = useMemo(() => getTeamInitials(displayName), [displayName]);
  const innerSize = Math.max(12, size - 8);

  if (failed) {
    return (
      <span
        className={className}
        aria-label={`${displayName} logo fallback`}
        title={displayName}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          flex: "0 0 auto",
          flexShrink: 0,
          boxSizing: "border-box",
          borderRadius: 8,
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
      src={src}
      alt={`${displayName} logo`}
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
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
      }}
      onError={() => setFailed(true)}
    />
  );
}
