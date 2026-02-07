import React from "react";

export function MeterBar({ value, label, rightLabel }: { value: number; label?: string; rightLabel?: string; mode?: "fill" | "segments"; segments?: number; tone?: "ok" | "gold" | "danger" }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.9 }}>
        <span>{label}</span>
        <span>{rightLabel}</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}>
        <div style={{ width: `${Math.round(clamped * 100)}%`, height: "100%", background: "#4fa3ff", borderRadius: 999 }} />
      </div>
    </div>
  );
}
