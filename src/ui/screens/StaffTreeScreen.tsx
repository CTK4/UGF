import React from "react";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

export function StaffTreeScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const assignments = save.gameState.staff.assignments;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Tree</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div className="ugf-pill">Budget: ${save.gameState.staff.budgetUsed.toLocaleString()} / ${save.gameState.staff.budgetTotal.toLocaleString()}</div>
        {(STAFF_ROLES as StaffRole[]).map((role) => {
          const assignment = assignments[role];
          return (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div><b>{STAFF_ROLE_LABELS[role]}:</b> {assignment?.coachName ?? "Vacant"}</div>
              <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>{assignment ? "Replace" : "Hire"}</button>
            </div>
          );
        })}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back</button>
      </div>
    </div>
  );
}
