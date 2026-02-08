import React, { useMemo, useState } from "react";
import rosters from "@/data/generated/rosters.json";
import rostersFull from "@/data/generated/rosters.full.json";
import teamSummary from "@/data/generated/teamSummary.json";
import { getFranchise } from "@/ui/data/franchises";
import type { ScreenProps } from "@/ui/types";
import { UGF_TEAMS, getUGFTeamByKey, resolveUGFTeamByJsonTeam } from "@/data/ugfTeams";

type HubTab = "Staff" | "Roster" | "Contracts" | "Standings" | "Schedule" | "Phone";
const tabs: HubTab[] = ["Staff", "Roster", "Contracts", "Standings", "Schedule", "Phone"];

const rosterRows = rosters as Array<Record<string, string | number>>;
const rosterFullRows = rostersFull as Array<Record<string, string | number>>;
const summaryRows = teamSummary as Array<Record<string, string | number>>;

export function HubScreen({ ui }: ScreenProps) {
  const [tab, setTab] = useState<HubTab>("Staff");
  const save = ui.getState().save;
  if (!save) return null;

  const fr = getFranchise(save.franchiseId);
  const team = getUGFTeamByKey(save.franchiseId);
  const unread = save.phone.threads.reduce((a, t) => a + t.unreadCount, 0);

  const currentTeamRoster = useMemo(() => {
    if (!team) return [];
    return rosterRows.filter((row) => resolveUGFTeamByJsonTeam(String(row.Team))?.key === team.key);
  }, [team]);

  const currentTeamSummary = useMemo(() => {
    if (!team) return undefined;
    return summaryRows.find((row) => resolveUGFTeamByJsonTeam(String(row.Team))?.key === team.key);
  }, [team]);

  const expiringDeals = useMemo(() => {
    if (!team) return [];
    return rosterFullRows
      .filter((row) => resolveUGFTeamByJsonTeam(String(row.Team))?.key === team.key && String(row.Expiring) === "TRUE")
      .slice(0, 8);
  }, [team]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ugf-card">
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">{team?.displayName ?? `${fr?.city} ${fr?.name}`} Hub</h2>
          <div className="ugf-pill">January {save.league.season} • Week {save.league.week} • v{save.league.phaseVersion}</div>
        </div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tabs.map((x) => <button key={x} onClick={() => setTab(x)} className={tab === x ? "danger" : ""}>{x}</button>)}
          </div>

          {tab === "Staff" ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div>HC: {save.staff.hc}</div><div>OC: {save.staff.oc ?? "Vacant"}</div><div>DC: {save.staff.dc ?? "Vacant"}</div><div>ST: {save.staff.st ?? "Vacant"}</div>
              <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Open Staff Tree</button>
            </div>
          ) : null}

          {tab === "Roster" ? (
            <div style={{ display: "grid", gap: 4 }}>
              {currentTeamRoster.slice(0, 30).map((row) => (
                <div key={String(row["Player ID"])} className="ugf-card"><div className="ugf-card__body">{String(row.PlayerName)} • {String(row.Position)} • OVR {String(row.Rating)}</div></div>
              ))}
            </div>
          ) : null}

          {tab === "Contracts" ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div className="ugf-pill">Cap Space: {String(currentTeamSummary?.["Cap Space"] ?? "N/A")}</div>
              <div className="ugf-pill">Current Cap Hits: {String(currentTeamSummary?.["Current Cap Hits"] ?? "N/A")}</div>
              {expiringDeals.length ? expiringDeals.map((p) => (
                <div key={String(p["Player ID"])} className="ugf-card"><div className="ugf-card__body">{String(p.PlayerName)} • {String(p.Position)} • AAV {String(p.AAV)} • Expiring</div></div>
              )) : <div>No expiring deals found.</div>}
            </div>
          ) : null}

          {tab === "Standings" ? (
            <div style={{ display: "grid", gap: 8 }}>
              {["Eastern", "Western"].map((conf) => (
                <div key={conf} className="ugf-card">
                  <div className="ugf-card__body" style={{ display: "grid", gap: 4 }}>
                    <b>{conf} Conference</b>
                    {["North", "South"].map((division) => (
                      <div key={division}>
                        <div style={{ opacity: 0.8 }}>{division}</div>
                        {UGF_TEAMS.filter((t) => t.conference === conf && t.division === division).map((t) => <div key={t.key}>{t.displayName} — 0-0</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "Schedule" ? (
            <div>
              <div className="ugf-pill">Schedule feed unavailable in current JSON bundle.</div>
              <div style={{ marginTop: 8 }}>Placeholder active: preseason planning and game-week controls will appear here when schedule JSON is wired.</div>
            </div>
          ) : null}

          {tab === "Phone" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="ugf-pill">Unread: {unread}</div>
              <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Open Phone Inbox</button>
            </div>
          ) : null}

          <button onClick={() => ui.dispatch({ type: "ADVANCE_WEEK" })}>Advance Week</button>
        </div>
      </div>
    </div>
  );
}
