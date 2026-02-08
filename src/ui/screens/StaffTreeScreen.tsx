import React from "react";
import { STAFF_ROLES, STAFF_ROLE_LABELS, type StaffRole } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

function money(v: number): string {
  return `$${(v / 1_000_000).toFixed(2)}M`;
}

export function StaffTreeScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;

  const filled = STAFF_ROLES.filter((role) => !!save.staff[role]).length;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Tree</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div><b>Staff completeness:</b> {filled}/{STAFF_ROLES.length} filled</div>
        <div><b>Coach Budget:</b> {money(save.finances.coachBudgetUsed)} / {money(save.finances.coachBudgetTotal)}</div>
        {STAFF_ROLES.map((role) => {
          const name = save.staff[role];
          const assignment = save.staffAssignments[role];
          return (
            <div key={role} className="ugf-card">
              <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <b>{STAFF_ROLE_LABELS[role]}:</b> {name ?? <span style={{ color: "crimson" }}>(Vacant)</span>}
                  <div style={{ opacity: 0.8 }}>
                    Salary: {assignment ? money(assignment.salary) : "—"} • Traits: {assignment ? "See market card" : "—"}
                  </div>
                </div>
                <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: role as StaffRole } })}>{name ? "Replace" : "Hire"}</button>
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
