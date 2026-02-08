import React from "react";
import { MANDATORY_STAFF_ROLES, STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

function fmtMoney(v: number): string {
  return `$${Math.round(v).toLocaleString()}`;
}

export function StaffTreeScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const filled = STAFF_ROLES.filter((r) => !!save.staffAssignments[r]).length;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Tree</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div className="ugf-pill">Staff completeness: {filled}/{STAFF_ROLES.length} filled</div>
        <div className="ugf-pill">Budget: {fmtMoney(save.finances.coachBudgetUsed)} / {fmtMoney(save.finances.coachBudgetTotal)}</div>
        {(STAFF_ROLES as StaffRole[]).map((role) => {
          const assignment = save.staffAssignments[role];
          const occupied = !!assignment;
          return (
            <div key={role} className="ugf-card">
              <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <b>{STAFF_ROLE_LABELS[role]}{MANDATORY_STAFF_ROLES.includes(role) ? " *" : ""}:</b> {occupied ? assignment.coachName : <span style={{ color: "crimson" }}>(Vacant)</span>}
                  {occupied ? <div style={{ opacity: 0.85 }}>Salary: {fmtMoney(assignment.salary)} • Traits: {assignment.traits.slice(0, 3).join(" • ") || "N/A"}</div> : null}
                </div>
                <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>{occupied ? "Replace" : "Hire"}</button>
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
