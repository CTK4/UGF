import "../styles/mobile.css";

export type StatPill = {
  label: string;
  value?: string | number;
};

export type StatPillsRowProps = {
  pills: StatPill[];
};

export function StatPillsRow({ pills }: StatPillsRowProps) {
  return (
    <div className="mobile-ui mobile-stat-pills-row" aria-label="Stats">
      {pills.map((pill) => (
        <span key={`${pill.label}-${pill.value ?? ""}`} className="ugf-pill mobile-stat-pill">
          {pill.label}
          {pill.value !== undefined ? ` ${pill.value}` : ""}
        </span>
      ))}
    </div>
  );
}
