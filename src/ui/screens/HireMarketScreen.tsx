import React, { useMemo, useState } from "react";
import { STAFF_ROLE_LABELS } from "@/domain/staffRoles";
import { marketByWeekFor } from "@/ui/runtime";
import type { ScreenProps } from "@/ui/types";

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

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
    fontWeight: 600,
    lineHeight: 1,
  };
}

function miniTabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    fontVariantNumeric: "tabular-nums",
  };
}

export function HireMarketScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "HireMarket") return null;

  const initialRole = state.route.role;
  if (initialRole === "HC") return null;

  const initialGroup: Group = isCoordRole(initialRole) ? "COORD" : "POS";

  const [group, setGroup] = useState<Group>(initialGroup);
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [sortMode, setSortMode] = useState<SortMode>("RATING");

  const rolesForGroup = group === "COORD" ? COORD_ROLES : POS_ROLES;

  const effectiveRole = useMemo(() => {
    if ((rolesForGroup as readonly string[]).includes(selectedRole)) return selectedRole;
    return group === "COORD" ? "OC" : "QB";
  }, [group, rolesForGroup, selectedRole]);

  const marketRole = effectiveRole === "RB" || effectiveRole === "WR" ? "WRRB" : effectiveRole;
  const sessionKey = `${save.gameState.time.season}-${save.gameState.time.week}:${marketRole}`;
  const session = marketByWeekFor(save.gameState)[sessionKey];

  const candidates = useMemo(() => {
    const list = [...(session?.candidates ?? [])];
    const valueScore = (c: any) => {
      const rating = Number(c.rating ?? 0);
      const salary = Math.max(1, Number(c.salaryDemand ?? 1));
      return rating / (salary / 1_000_000);
    };
    list.sort((a: any, b: any) => {
      if (sortMode === "VALUE") return valueScore(b) - valueScore(a);
      return Number(b.rating ?? 0) - Number(a.rating ?? 0);
    });
    return list;
  }, [session, sortMode]);

  const title = effectiveRole === "RB" ? "RB Coach" : effectiveRole === "WR" ? "WR Coach" : (STAFF_ROLE_LABELS as any)[effectiveRole] ?? effectiveRole;

  const onSetGroup = (next: Group) => {
    setGroup(next);
    if (next === "COORD" && !isCoordRole(selectedRole)) setSelectedRole("OC");
    if (next === "POS" && !isPosRole(selectedRole)) setSelectedRole("QB");
  };

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire Market / {title}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button style={chipStyle(group === "COORD")} onClick={() => onSetGroup("COORD")}>Coordinator</button>
          <button style={chipStyle(group === "POS")} onClick={() => onSetGroup("POS")}>Position Coaches</button>
          <button
            style={chipStyle(sortMode === "VALUE")}
            onClick={() => setSortMode((m) => (m === "VALUE" ? "RATING" : "VALUE"))}
            title="Sort by rating per $M"
          >
            Best Value
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(rolesForGroup as readonly string[]).map((r) => (
            <button key={r} style={miniTabStyle(r === effectiveRole)} onClick={() => setSelectedRole(r)}>
              {r === "RB" ? "RB Coach" : r === "WR" ? "WR Coach" : (STAFF_ROLE_LABELS as any)[r] ?? r}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {candidates.map((c: any) => (
            <button
              key={c.id}
              onClick={() =>
                ui.dispatch({ type: "NAVIGATE", route: { key: "CandidateDetail", role: marketRole, candidateId: c.id } })
              }
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    minWidth: 44,
                    justifyContent: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.rating ?? "--"}
                </span>
                <span>{c.name}</span>
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>${Number(c.salaryDemand ?? 0).toLocaleString()}</span>
            </button>
          ))}
        </div>

        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Back</button>
      </div>
    </div>
  );
}
