import React from "react";
import type { ScreenProps } from "@/ui/types";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { MeterBar } from "@/ui/components/MeterBar";

export function StaffTreeScreen({ ui }: ScreenProps) {
  const franchiseTeamId = ui.selectors.franchiseTeamId();
  const teams = ui.selectors.teams();
  const staffTree = ui.selectors.staffTree();

  const vacancyCount = teams.reduce((acc, t) => {
    const s = staffTree.byTeam[t];
    if (!s) return acc + 5;
    return acc + (s.HC ? 0 : 1) + (s.OC ? 0 : 1) + (s.DC ? 0 : 1) + (s.QB ? 0 : 1) + (s.ASST ? 0 : 1);
  }, 0);

  const totalSlots = Math.max(1, teams.length * 5);
  const filled = Math.max(0, totalSlots - vacancyCount);
  const fill01 = filled / totalSlots;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">Staff Tree (League)</h2>
          <div className="ugf-card__right">
            <MeterBar value={fill01} mode="fill" label="Staff Filled" rightLabel={`${filled}/${totalSlots}`} tone={fill01 > 0.95 ? "ok" : fill01 > 0.8 ? "gold" : "danger"} />
          </div>
        </div>

        <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <SegmentedTabs
            value={"tree"}
            tabs={[
              { key: "tree", label: "Staff Tree" },
              { key: "hire", label: "Hire (OC)", right: <span style={{ opacity: 0.8 }}>→</span> },
            ]}
            onChange={(k) => {
              if (k === "hire") ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "OC" });
            }}
            ariaLabel="Staff tabs"
          />

          <div style={{ display: "grid", gap: 12 }}>
            {teams.map((t) => {
              const s = staffTree.byTeam[t] ?? { HC: null, OC: null, DC: null, QB: null, ASST: null };
              const isFranchise = t === franchiseTeamId;

              const line = (label: string, v: any) => (
                <div>
                  <b>{label}:</b> {v?.name ?? "—"}
                  {!v ? <span style={{ color: "crimson", fontWeight: 700 }}> (Vacant)</span> : null}
                </div>
              );

              return (
                <div key={t} className="ugf-card">
                  <div className="ugf-card__header">
                    <h3 className="ugf-card__title">{t}{isFranchise ? " (You)" : ""}</h3>
                    <div className="ugf-card__right">
                      <span className="ugf-pill">HC/OC/DC/QB/ASST</span>
                    </div>
                  </div>
                  <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                    {line("HC", s.HC)}
                    {line("OC", s.OC)}
                    {line("DC", s.DC)}
                    {line("QB Coach", s.QB)}
                    {line("Assistant", s.ASST)}

                    {isFranchise ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        <button onClick={() => ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "HC" })}>Hire HC</button>
                        <button onClick={() => ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "OC" })}>Hire OC</button>
                        <button onClick={() => ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "DC" })}>Hire DC</button>
                        <button onClick={() => ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "QB" })}>Hire QB</button>
                        <button onClick={() => ui.dispatch({ type: "OPEN_HIRE_MARKET", role: "ASST" })}>Hire Asst</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => ui.dispatch({ type: "BACK" })}>Back</button>
            <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
          </div>
        </div>
      </div>
    </div>
  );
}
