import { TeamLogo } from "@/ui/components/TeamLogo";
import React from "react";
import type { ScreenProps } from "@/ui/types";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { MeterBar } from "@/ui/components/MeterBar";

export function TeamSummaryScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const teamId = state.route.key === "TeamSummary" ? state.route.teamId : ui.selectors.franchiseTeamId();
  const rows = ui.selectors.table("Team Summary").filter((r: any) => String(r.Team ?? "").trim() === teamId);

  const first = (rows[0] ?? {}) as any;
  const wins = Number(first.Wins ?? first.W ?? 0);
  const losses = Number(first.Losses ?? first.L ?? 0);
  const games = Math.max(1, wins + losses);
  const winPct = wins / games;
  const ovr = Number(first.OVR ?? first.Overall ?? 70);
  const ovr01 = Math.max(0, Math.min(1, ovr / 100));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">Team Summary: {teamId}</h2>
          <div className="ugf-card__right">
            <TeamLogo teamId={teamId} />
          </div>
        </div>

        <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <MeterBar value={ovr01} mode="fill" label="Team OVR" rightLabel={`${Math.round(ovr)}`} tone="gold" />

          <SegmentedTabs
            value={"summary"}
            tabs={[
              { key: "summary", label: "Summary" },
              { key: "staff", label: "Staff Tree", right: <span style={{ opacity: 0.8 }}>→</span> },
            ]}
            onChange={(k) => {
              if (k === "staff") ui.dispatch({ type: "OPEN_STAFF_TREE" });
            }}
            ariaLabel="Team summary tabs"
          />

          <MeterBar
            value={winPct}
            mode="segments"
            segments={10}
            label="Win %"
            rightLabel={`${Math.round(winPct * 100)}%`}
            tone={winPct >= 0.6 ? "ok" : winPct >= 0.45 ? "gold" : "danger"}
          />

          {rows.length ? (
            <table>
              <thead>
                <tr>
                  {Object.keys(rows[0] as any)
                    .slice(0, 8)
                    .map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((r: any, idx) => (
                  <tr key={idx}>
                    {Object.keys(rows[0] as any)
                      .slice(0, 8)
                      .map((h) => (
                        <td key={h}>{String(r[h] ?? "")}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ opacity: 0.8 }}>No Team Summary rows found for this team.</div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => ui.dispatch({ type: "OPEN_STAFF_TREE" })}>Staff Tree</button>
          </div>
        </div>
      </div>
    </div>
  );
}
