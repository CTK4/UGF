import React, { useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { UI_ID } from "@/ui/ids";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { HIREABLE_STAFF_ROLES, STAFF_ROLE_LABELS, type HireableStaffRole, type StaffRole } from "@/domain/staffRoles";

type StaffTab = "Staff" | "Openings" | "Free Agents";

function isHireable(role: StaffRole): role is HireableStaffRole {
  return (HIREABLE_STAFF_ROLES as readonly string[]).includes(role);
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function FigmaStaffScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const [tab, setTab] = useState<StaffTab>("Staff");
  const [focusRole, setFocusRole] = useState<HireableStaffRole>("OC");

  if (!save) return null;

  const rows = useMemo(() => {
    const assignments = save.gameState.staff.assignments;
    const ordered: StaffRole[] = ["HC", "OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];
    return ordered.map((role) => {
      const assignment = assignments[role];
      return {
        role,
        label: STAFF_ROLE_LABELS[role],
        coachName: role === "HC" ? "You" : assignment?.coachName ?? "Open",
        salary: assignment?.salary ?? 0,
        years: assignment?.years ?? 0,
      };
    });
  }, [save.gameState.staff.assignments]);

  return (
    <div className="ugf-card" data-ui={UI_ID.staff.root}>
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire Coordinators</h2></div>
      <div className="ugf-card__body figma-shell">
        <div data-ui={UI_ID.staff.tabs}>
          <SegmentedTabs value={tab} ariaLabel="Staff views" onChange={(key) => setTab(key as StaffTab)} tabs={["Staff", "Openings", "Free Agents"].map((t) => ({ key: t, label: t }))} />
        </div>

        <div className="ugf-pill" data-ui={UI_ID.staff.budgetPill}>Budget: {money(save.gameState.staff.budgetUsed)} / {money(save.gameState.staff.budgetTotal)}</div>

        <div className="figma-chip-row" aria-label="Coordinator filter">
          {(["OC", "DC", "STC"] as const).map((role) => (
            <button key={role} className={`figma-chip ${focusRole === role ? "is-active" : ""}`} onClick={() => setFocusRole(role)}>
              {role}
            </button>
          ))}
        </div>

        {tab === "Staff" ? (
          <div className="figma-scroll" style={{ display: "grid", gap: 8 }}>
            {rows.filter((row) => row.role === "HC" || row.role === focusRole || !["OC", "DC", "STC"].includes(row.role)).map((row) => (
              <div key={row.role} className="ugf-card" data-ui={UI_ID.staff.roleRow}>
                <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <b>{row.label}</b>
                    <small>{row.coachName}</small>
                  </div>
                  {row.role !== "HC" ? (
                    <div className="figma-chip-row">
                      <span className="ugf-pill">{row.salary ? `${money(row.salary)} / yr` : "—"}</span>
                      <span className="ugf-pill">{row.years ? `${row.years} yrs` : "—"}</span>
                      <button data-ui={UI_ID.staff.hireMarketCta} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: isHireable(row.role) ? row.role : "OC" } })}>{row.coachName === "Open" ? "Fill" : "Review"}</button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ugf-pill">Use the hire market to browse candidates and fill openings.</div>
        )}

        <div className="figma-chip-row">
          <button data-ui={UI_ID.staff.hireMarketCta} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: focusRole } })}>Open Hire Market</button>
          <button data-ui={UI_ID.staff.backToHub} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
