import React from "react";

type Tab = { key: string; label: string; right?: React.ReactNode };

type Props = {
  value: string;
  tabs: Tab[];
  onChange: (key: string) => void;
  ariaLabel?: string;
};

export function SegmentedTabs({ value, tabs, onChange, ariaLabel }: Props) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          style={{ opacity: value === tab.key ? 1 : 0.8 }}
        >
          {tab.label} {tab.right}
        </button>
      ))}
    </div>
  );
}
