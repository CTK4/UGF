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

export function TeamLogo({ ugfTeamKey, displayName, size = 32, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => `/logos/${ugfTeamKey}.png`, [ugfTeamKey]);
  const initials = useMemo(() => getTeamInitials(displayName), [displayName]);

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
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: Math.max(10, Math.round(size * 0.34)),
          letterSpacing: "0.04em",
          border: "1px solid rgba(120,150,190,0.32)",
          background: "linear-gradient(180deg, rgba(32, 46, 66, 0.95), rgba(14, 20, 30, 0.95))",
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
      style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", border: "1px solid rgba(120,150,190,0.32)" }}
      onError={() => setFailed(true)}
    />
  );
}
