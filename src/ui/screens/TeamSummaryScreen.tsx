import React from "react";
import type { ScreenProps } from "@/ui/types";
import { TeamIcon } from "@/ui/components/TeamLogo";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { getFranchise } from "@/ui/data/franchises";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { MeterBar } from "@/ui/components/MeterBar";

export function TeamSummaryScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const teamId = state.save?.teamId ?? ui.selectors.franchiseTeamId();
  const rows = ui.selectors.table("Team Summary").filter((r) => String(r.Team ?? "").trim() === teamId);
  const first = (rows[0] ?? {}) as Record<string, unknown>;
  const franchise = getFranchise(teamId);
  const displayName = franchise?.fullName ?? teamId;
  const teamKey = state.save?.gameState.franchise.ugfTeamKey || normalizeExcelTeamKey(displayName);

  const wins = Number(first.Wins ?? first.W ?? 0);
  const losses = Number(first.Losses ?? first.L ?? 0);
  const games = Math.max(1, wins + losses);
  const winPct = wins / games;

  const ovr = Number(first.OVR ?? first.Overall ?? 70);
  const ovr01 = Math.max(0, Math.min(1, ovr / 100));

  const activeTab = state.route.key === "TeamRoster" ? "roster" : state.route.key === "Contracts" ? "contracts" : state.route.key === "StaffTree" ? "staff" : "summary";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">Team Summary</h2>
          <div className="ugf-card__right">
            <TeamIcon teamKey={teamKey} size={56} variant="square" />
          </div>
        </div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
          <SegmentedTabs
            value={activeTab}
            tabs={[
              { key: "summary", label: "Summary" },
              { key: "roster", label: "Roster" },
              { key: "contracts", label: "Contracts" },
              { key: "staff", label: "Staff" },
            ]}
            onChange={(k) => {
              if (k === "summary") ui.dispatch({ type: "NAVIGATE", route: { key: "TeamSummary", teamId } });
              if (k === "roster") ui.dispatch({ type: "OPEN_TEAM_ROSTER", teamId });
              if (k === "contracts") ui.dispatch({ type: "OPEN_CONTRACTS", teamId });
              if (k === "staff") ui.dispatch({ type: "OPEN_STAFF_TREE" });
            }}
            ariaLabel="Team summary tabs"
          />

          <MeterBar value={ovr01} label="Team OVR" rightLabel={`${Math.round(ovr)}`} />
          <MeterBar value={winPct} label="Win %" rightLabel={`${Math.round(winPct * 100)}%`} />

          <div>
            <strong>{displayName}</strong> — {wins}-{losses}
          </div>

          {rows.length ? (
            <table>
              <thead>
                <tr>
                  {Object.keys(rows[0]).slice(0, 8).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((r, idx) => (
                  <tr key={idx}>
                    {Object.keys(rows[0]).slice(0, 8).map((h) => (
                      <td key={h}>{String((r as Record<string, unknown>)[h] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ opacity: 0.8 }}>No Team Summary rows found for this team.</div>
          )}
        </div>
      </div>
    </div>
  );
}
