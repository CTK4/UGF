import React from "react";

type Props = {
  value: number;
  label?: string;
  rightLabel?: string;
};

export function MeterBar({ value, label, rightLabel }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {(label || rightLabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span>{label}</span>
          <span>{rightLabel}</span>
        </div>
      )}
      <div style={{ width: "100%", height: 8, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#3aa1ff" }} />
      </div>
    </div>
  );
}
