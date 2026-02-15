import React, { useMemo, useState } from "react";
import { STAFF_ROLE_LABELS } from "@/domain/staffRoles";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";
import { UI_ID } from "@/ui/ids";

type Group = "COORD" | "POS";
type SortMode = "RATING" | "VALUE";

const COORD_ROLES = ["OC", "DC", "STC"] as const;
const POS_ROLES = ["QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"] as const;

function isCoordRole(role: string): role is (typeof COORD_ROLES)[number] {
  return (COORD_ROLES as readonly string[]).includes(role);
}

function isPosRole(role: string): role is (typeof POS_ROLES)[number] {
  return (POS_ROLES as readonly string[]).includes(role);
}

export function HireMarketScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "HireMarket") return null;

  const initialRole = state.route.role;
  if (initialRole === "HC") return null;

  const [group, setGroup] = useState<Group>(isCoordRole(initialRole) ? "COORD" : "POS");
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [sortMode, setSortMode] = useState<SortMode>("RATING");

  const rolesForGroup = group === "COORD" ? COORD_ROLES : POS_ROLES;
  const effectiveRole = (rolesForGroup as readonly string[]).includes(selectedRole) ? selectedRole : group === "COORD" ? "OC" : "QB";

  const sessionKey = `${save.gameState.time.season}-${save.gameState.time.week}:${effectiveRole}`;
  const session = marketByWeekFor(save.gameState)[sessionKey];

  const candidates = useMemo(() => {
    const list = [...(session?.candidates ?? [])];
    const valueScore = (c: any) => Number(c.rating ?? 0) / (Math.max(1, Number(c.salaryDemand ?? 1)) / 1_000_000);
    list.sort((a: any, b: any) => (sortMode === "VALUE" ? valueScore(b) - valueScore(a) : Number(b.rating ?? 0) - Number(a.rating ?? 0)));
    return list;
  }, [session, sortMode]);

  const onSetGroup = (next: Group) => {
    setGroup(next);
    if (next === "COORD" && !isCoordRole(selectedRole)) setSelectedRole("OC");
    if (next === "POS" && !isPosRole(selectedRole)) setSelectedRole("QB");
  };

  return (
    <div className="ugf-card" data-ui={UI_ID.hireMarket.root}>
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire Market</h2></div>
      <div className="ugf-card__body figma-shell">
        <div className="figma-chip-row" role="tablist" aria-label="Role group">
          <button className={`figma-chip ${group === "COORD" ? "is-active" : ""}`} data-ui={UI_ID.hireMarket.groupTab} onClick={() => onSetGroup("COORD")}>Coordinators</button>
          <button className={`figma-chip ${group === "POS" ? "is-active" : ""}`} data-ui={UI_ID.hireMarket.groupTab} onClick={() => onSetGroup("POS")}>Position Coaches</button>
          <button className={`figma-chip ${sortMode === "VALUE" ? "is-active" : ""}`} data-ui={UI_ID.hireMarket.sortTab} onClick={() => setSortMode((m) => (m === "VALUE" ? "RATING" : "VALUE"))}>Best Value</button>
        </div>

        <div className="figma-chip-row" role="tablist" aria-label="Roles">
          {(rolesForGroup as readonly string[]).map((role) => (
            <button key={role} className={`figma-chip ${effectiveRole === role ? "is-active" : ""}`} data-ui={UI_ID.hireMarket.roleTab} onClick={() => setSelectedRole(role)}>
              {(STAFF_ROLE_LABELS as Record<string, string>)[role] ?? role}
            </button>
          ))}
        </div>

        <div className="figma-scroll" style={{ display: "grid", gap: 8 }}>
          {candidates.map((candidate: any) => (
            <button
              key={candidate.id}
              className="figma-candidate-card"
              data-ui={UI_ID.hireMarket.candidateRow}
              onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CandidateDetail", role: effectiveRole, candidateId: candidate.id } })}
            >
              <span className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <b>{candidate.name}</b>
                  <span className="ugf-pill">{candidate.rating ?? "--"}</span>
                </span>
                <span className="figma-candidate-card__meta">
                  <span>{(STAFF_ROLE_LABELS as Record<string, string>)[effectiveRole] ?? effectiveRole}</span>
                  <span>${Number(candidate.salaryDemand ?? 0).toLocaleString()}</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <button data-ui={UI_ID.hireMarket.backToStaff} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Back</button>
      </div>
    </div>
  );
}
