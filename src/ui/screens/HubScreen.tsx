import React, { useState } from "react";
import teamSummaryData from "@/data/generated/teamSummary.json";
import rostersData from "@/data/generated/rosters.json";
import rostersFullData from "@/data/generated/rosters.full.json";
import draftOrderData from "@/data/generated/draftOrder.json";
import { UGF_TEAMS } from "@/data/ugfTeams";
import { getDisplayTeamName, normalizeExcelTeamKey } from "@/data/teamMap";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { getFranchise } from "@/ui/data/franchises";
import type { ScreenProps, PhoneThread } from "@/ui/types";

type HubTab = "staff" | "roster" | "contracts" | "standings" | "schedule" | "phone";

type RosterRow = {
  Team: string;
  PositionGroup: string;
  Position: string;
  PlayerName: string;
  Age: number;
  Rating: number;
  "Depth Chart": number;
  "Player ID": number;
  AAV?: number;
};

type TeamSummaryRow = {
  Team: string;
  Conference: string;
  Division: string;
  Players: number;
  "Cap Space": number;
  "Current Cap Hits": number;
};

type DraftOrderRow = {
  Team: string;
  Pick: number;
  Player: string;
  Pos: string;
};

const rosterRows = rostersData as RosterRow[];
const rosterFullRows = rostersFullData as RosterRow[];
const summaryRows = teamSummaryData as TeamSummaryRow[];
const draftOrderRows = draftOrderData as DraftOrderRow[];

function asMoney(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function tabs(active: HubTab, onClick: (tab: HubTab) => void) {
  const labels: Array<{ key: HubTab; label: string }> = [
    { key: "staff", label: "Staff" },
    { key: "roster", label: "Roster" },
    { key: "contracts", label: "Contracts" },
    { key: "standings", label: "Standings" },
    { key: "schedule", label: "Schedule" },
    { key: "phone", label: "Phone" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {labels.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onClick(tab.key)}
          style={{
            fontWeight: active === tab.key ? 700 : 500,
            border: active === tab.key ? "2px solid currentColor" : undefined,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function HubScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  if (!save) return null;

  const franchise = getFranchise(save.franchiseId);
  const teamName = franchise?.fullName ?? getDisplayTeamName(save.franchiseId);
  const teamKey = normalizeExcelTeamKey(teamName);
  const activeTab: HubTab = state.route.key === "Hub" ? state.route.tab ?? "staff" : "staff";

  const teamRoster = rosterRows.filter((row) => normalizeExcelTeamKey(String(row.Team)) === teamKey);
  const teamSummary = summaryRows.find((row) => normalizeExcelTeamKey(String(row.Team)) === teamKey);
  const topCapHits = rosterFullRows
    .filter((row) => normalizeExcelTeamKey(String(row.Team)) === teamKey)
    .sort((a, b) => Number(b.AAV ?? 0) - Number(a.AAV ?? 0))
    .slice(0, 8);

  const groupedRoster = (() => {
    const grouped = new Map<string, Map<string, RosterRow[]>>();
    for (const row of teamRoster) {
      const group = row.PositionGroup || "Other";
      const pos = row.Position || "UNK";
      if (!grouped.has(group)) grouped.set(group, new Map());
      if (!grouped.get(group)?.has(pos)) grouped.get(group)?.set(pos, []);
      grouped.get(group)?.get(pos)?.push(row);
    }
    for (const positions of grouped.values()) {
      for (const rows of positions.values()) {
        rows.sort((a, b) => Number(a["Depth Chart"] ?? 99) - Number(b["Depth Chart"] ?? 99));
      }
    }
    return grouped;
  })();

  const scheduleRows = draftOrderRows.filter((row) => normalizeExcelTeamKey(String(row.Team)) === teamKey).slice(0, 17);

  const currentThread: PhoneThread | undefined = save.phone.threads.find((thread) => thread.id === activeThreadId) ?? save.phone.threads[0];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TeamLogo ugfTeamKey={teamKey} displayName={teamName} size={28} />
          <span>{teamName} Hub</span>
        </h2>
      </div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        {tabs(activeTab, (tab) => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub", tab } }))}

        {activeTab === "staff" && (
          <div style={{ display: "grid", gap: 6 }}>
            <div><b>Head Coach:</b> {save.staff.HC ?? "Vacant"}</div>
            <div><b>Offensive Coordinator:</b> {save.staff.OC ?? "Vacant"}</div>
            <div><b>Defensive Coordinator:</b> {save.staff.DC ?? "Vacant"}</div>
            <div><b>Special Teams:</b> {save.staff.STC ?? "Vacant"}</div>
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Open Staff Tree</button>
          </div>
        )}

        {activeTab === "roster" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TeamLogo ugfTeamKey={teamKey} displayName={teamName} size={24} />
              <b>{teamName} Roster</b>
            </div>
            {[...groupedRoster.entries()].map(([group, positions]) => (
              <div key={group}>
                <h3>{group}</h3>
                {[...positions.entries()].map(([position, rows]) => (
                  <div key={`${group}-${position}`} style={{ marginBottom: 8 }}>
                    <div><b>{position}</b></div>
                    <table>
                      <thead><tr><th>Name</th><th>Pos</th><th>Age</th><th>Rating</th><th>Depth</th></tr></thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={String(row["Player ID"])}>
                            <td>{row.PlayerName}</td><td>{row.Position}</td><td>{row.Age}</td><td>{row.Rating}</td><td>{row["Depth Chart"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === "contracts" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <b>Team Cap Summary:</b>{" "}
              {teamSummary ? `${asMoney(Number(teamSummary["Current Cap Hits"] ?? 0))} used • ${asMoney(Number(teamSummary["Cap Space"] ?? 0))} space • ${teamSummary.Players} players` : "No team summary available."}
            </div>
            <div>
              <b>Top Cap Hits</b>
              <table>
                <thead><tr><th>Player</th><th>Pos</th><th>AAV</th></tr></thead>
                <tbody>
                  {topCapHits.map((row) => (
                    <tr key={String(row["Player ID"])}><td>{row.PlayerName}</td><td>{row.Position}</td><td>{asMoney(Number(row.AAV ?? 0))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "standings" && (
          <div style={{ display: "grid", gap: 8 }}>
            {(["AC", "NC"] as const).map((conf) => (
              <div key={conf}>
                <h3>{conf}</h3>
                {(["East", "North", "South", "West"] as const).map((division) => {
                  const teams = UGF_TEAMS.filter((team) => team.conference === conf && team.division === division);
                  if (!teams.length) return null;
                  return (
                    <div key={`${conf}-${division}`}>
                      <b>{division}</b>
                      <ul>
                        {teams.map((team) => (
                          <li key={team.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <TeamLogo ugfTeamKey={team.key} displayName={team.team} size={20} />
                            <span>{team.team} — 0-0</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {activeTab === "schedule" && (
          <div>
            {scheduleRows.length ? (
              <table>
                <thead><tr><th>Week</th><th>Opponent/Event</th><th>Type</th></tr></thead>
                <tbody>
                  {scheduleRows.map((row, i) => (
                    <tr key={`${row.Pick}-${i}`}><td>{i + 1}</td><td>{row.Player} ({row.Pos})</td><td>Draft Context</td></tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ul>
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i}>Week {save.league.week + i}: Schedule data unavailable — placeholder event.</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "phone" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 2fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              {save.phone.threads.map((thread) => (
                <button key={thread.id} style={{ textAlign: "left" }} onClick={() => setActiveThreadId(thread.id)}>
                  <div><b>{thread.title}</b></div>
                  <div style={{ opacity: 0.8 }}>Unread: {thread.unreadCount}</div>
                </button>
              ))}
            </div>
            <div>
              {currentThread ? currentThread.messages.map((message) => (
                <div key={message.id} className="ugf-card" style={{ marginBottom: 8 }}>
                  <div className="ugf-card__body"><b>{message.from}:</b> {message.text}</div>
                </div>
              )) : "No messages"}
            </div>
          </div>
        )}

        <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
      </div>
    </div>
  );
}
