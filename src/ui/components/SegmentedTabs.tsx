import React from "react";

type Tab = { key: string; label: string; right?: React.ReactNode };

export function SegmentedTabs({
  value,
  tabs,
  onChange,
  ariaLabel,
}: {
  value: string;
  tabs: Tab[];
  onChange: (key: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className="ugf-pill"
          style={{ opacity: value === t.key ? 1 : 0.8 }}
        >
          {t.label} {t.right}
        </button>
      ))}
    </div>
  );
}
