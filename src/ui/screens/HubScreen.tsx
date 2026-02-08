import React from "react";
import type { ScreenProps } from "@/ui/types";
import { getFranchise } from "@/ui/data/franchises";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { getDraftOrderRows, getRosterByTeam, getTeamSummaryRows } from "@/data/generatedData";

type HubTab = "staff" | "roster" | "contracts" | "standings" | "schedule" | "phone";

function asMoney(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

export function HubScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save) return null;

  const fr = getFranchise(save.franchiseId);
  const teamName = fr?.fullName ?? save.franchiseId;
  const unread = save.phone.threads.reduce((a, t) => a + t.unreadCount, 0);
  const activeTab: HubTab = state.route.key === "Hub" ? (state.route.tab ?? "staff") : "staff";

  const rosterRows = getRosterByTeam(teamName);
  const teamSummary = getTeamSummaryRows();
  const teamRow = teamSummary.find((row) => row.Team === teamName);
  const contracts = [...rosterRows].sort((a, b) => Number(b.AAV ?? 0) - Number(a.AAV ?? 0));
  const standings = [...teamSummary].sort((a, b) => Number(b.AvgRating ?? 0) - Number(a.AvgRating ?? 0));
  const teamSchedule = getDraftOrderRows().filter((row) => row.Team === teamName).slice(0, 17);

  const renderTab = () => {
    if (activeTab === "staff") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div><b>Head Coach:</b> {save.staff.hc ?? "Vacant"}</div>
          <div><b>Offensive Coordinator:</b> {save.staff.oc ?? "Vacant"}</div>
          <div><b>Defensive Coordinator:</b> {save.staff.dc ?? "Vacant"}</div>
          <div><b>QB Coach:</b> {save.staff.qb ?? "Vacant"}</div>
          <div><b>Assistant:</b> {save.staff.asst ?? "Vacant"}</div>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Open Staff Tree</button>
        </div>
      );
    }

    if (activeTab === "phone") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div>Unread threads: <b>{unread}</b></div>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Open Phone</button>
        </div>
      );
    }

    if (activeTab === "roster") {
      return (
        <table>
          <thead><tr><th>Player</th><th>Pos</th><th>Age</th><th>Rating</th><th>Role</th></tr></thead>
          <tbody>
            {rosterRows.map((row) => (
              <tr key={row["Player ID"]}><td>{row.PlayerName}</td><td>{row.Position}</td><td>{row.Age}</td><td>{row.Rating}</td><td>{row.Role}</td></tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "contracts") {
      return (
        <table>
          <thead><tr><th>Player</th><th>Pos</th><th>AAV</th><th>Cap Status</th></tr></thead>
          <tbody>
            {contracts.map((row) => (
              <tr key={row["Player ID"]}><td>{row.PlayerName}</td><td>{row.Position}</td><td>{asMoney(Number(row.AAV ?? 0))}</td><td>{Number(row.AAV ?? 0) > 15_000_000 ? "Core" : "Depth"}</td></tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "standings") {
      return (
        <table>
          <thead><tr><th>#</th><th>Team</th><th>Conf</th><th>Div</th><th>Avg</th></tr></thead>
          <tbody>
            {standings.map((row, idx) => (
              <tr key={row.Team}><td>{idx + 1}</td><td>{row.Team}</td><td>{row.Conference}</td><td>{row.Division}</td><td>{Number(row.AvgRating).toFixed(1)}</td></tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table>
        <thead><tr><th>Week</th><th>Opponent/Event</th><th>Type</th></tr></thead>
        <tbody>
          {teamSchedule.length ? teamSchedule.map((row, idx) => (
            <tr key={`${row.Pick}-${idx}`}><td>{idx + 1}</td><td>{row.Player} ({row.Pos})</td><td>Draft Board</td></tr>
          )) : (
            <tr><td colSpan={3}>No schedule rows currently available in generated JSON for this team.</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">{fr?.city} {fr?.name} Hub</h2>
          <div className="ugf-pill">{save.league.phase} • Week {save.league.week} • v{save.league.phaseVersion}</div>
        </div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <SegmentedTabs
            value={activeTab}
            tabs={[
              { key: "staff", label: "Staff" },
              { key: "roster", label: `Roster (${rosterRows.length})` },
              { key: "contracts", label: "Contracts" },
              { key: "standings", label: "Standings" },
              { key: "schedule", label: "Schedule" },
              { key: "phone", label: `Phone (${unread})` },
            ]}
            onChange={(tab) => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub", tab } })}
            ariaLabel="Hub tabs"
          />

          {teamRow ? (
            <div style={{ opacity: 0.85 }}>
              {teamRow.Team} • {teamRow.Conference} {teamRow.Division} • Players: {teamRow.Players} • Cap Space: {asMoney(Number(teamRow["Cap Space"] ?? 0))}
            </div>
          ) : null}

          {renderTab()}

          <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
        </div>
      </div>
    </div>
  );
}
