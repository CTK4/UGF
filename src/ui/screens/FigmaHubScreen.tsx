import React from "react";
import type { ScreenProps } from "@/ui/types";
import { UI_ID } from "@/ui/ids";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { FRANCHISES } from "@/ui/data/franchises";
import { getTeamDisplayName, resolveTeamKey } from "@/ui/data/teamKeyResolver";
import { capSpaceForTeam } from "@/engine/cap";

type QuickLink = {
  id: string;
  label: string;
  description: string;
  route: () => void;
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function FigmaHubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;

  if (!save) {
    return (
      <div className="ugf-card" data-ui={UI_ID.hub.noSave}>
        <div className="ugf-card__header">
          <h2 className="ugf-card__title">Hub</h2>
        </div>
        <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <div className="ugf-pill">No save loaded, so Hub actions are unavailable.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })}>
              Back to Start
            </button>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>
              Create Coach
            </button>
          </div>
        </div>
      </div>
    );
  }

  const franchiseKey = resolveTeamKey(save.gameState.franchiseId);
  const franchise = franchiseKey ? FRANCHISES.find((f) => f.key === franchiseKey) : undefined;
  const teamName = franchiseKey ? getTeamDisplayName(franchiseKey) : "Your Team";
  const capSpace = franchiseKey ? capSpaceForTeam(save.gameState.league, franchiseKey) : 0;

  const quickLinks: QuickLink[] = [
    {
      id: "roster",
      label: "Roster",
      description: "Lineup, depth chart, and ratings",
      route: () => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } }),
    },
    {
      id: "freeAgency",
      label: "Free Agency",
      description: "Browse and sign players",
      route: () => ui.dispatch({ type: "NAVIGATE", route: { key: "FreeAgency" } }),
    },
    {
      id: "phone",
      label: "Phone",
      description: "Inbox and conversations",
      route: () => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } }),
    },
    {
      id: "staffMeeting",
      label: "Staff Meeting",
      description: "Weekly priorities + advance gate",
      route: () => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffMeeting" } }),
    },
  ];

  const needsStaffMeeting = !save.gameState.offseasonPlan;

  return (
    <div className="ugf-card" data-ui={UI_ID.hub.root}>
      <div className="ugf-card__header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {franchiseKey ? <TeamLogo teamKey={franchiseKey} size={44} /> : null}
          <div style={{ display: "grid", gap: 2 }}>
            <h2 className="ugf-card__title" style={{ margin: 0 }}>
              Hub
            </h2>
            <div style={{ opacity: 0.85, fontSize: 13 }} data-ui={UI_ID.hub.teamName}>
              {teamName}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Cap Space</div>
          <div style={{ fontWeight: 700 }} data-ui={UI_ID.hub.capSpace}>
            {formatMoney(capSpace)}
          </div>
        </div>
      </div>

      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        {needsStaffMeeting ? (
          <div
            className="ugf-pill"
            style={{ borderLeft: "4px solid #DC2626", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
            data-ui={UI_ID.hub.staffMeetingCta}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 700 }}>Action Required</div>
              <div style={{ opacity: 0.85 }}>Complete weekly staff meeting to advance</div>
            </div>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffMeeting" } })} data-ui={UI_ID.hub.staffMeetingButton}>
              Go
            </button>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 10 }} data-ui={UI_ID.hub.quickLinks}>
          {quickLinks.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={q.route}
              className="ugf-pill"
              style={{ textAlign: "left", display: "grid", gap: 2, cursor: "pointer" }}
              data-ui={q.id === "roster" ? UI_ID.hub.quickLinkRoster : q.id === "staff" ? UI_ID.hub.quickLinkStaff : q.id === "freeAgency" ? UI_ID.hub.quickLinkFreeAgency : q.id === "phone" ? UI_ID.hub.quickLinkPhone : UI_ID.hub.quickLinkStaffMeeting}
            >
              <div style={{ fontWeight: 700 }}>{q.label}</div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>{q.description}</div>
            </button>
          ))}
        </div>

        <div className="ugf-pill" data-ui={UI_ID.hub.newsPlaceholder}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>News</div>
          <div style={{ opacity: 0.85, fontSize: 13 }}>
            Hook this to your in-game events feed. For now, this is a placeholder so the Figma-style Hub layout is functional.
          </div>
        </div>
      </div>
    </div>
  );
}
