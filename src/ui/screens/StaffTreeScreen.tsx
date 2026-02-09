import React from "react";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { ScreenProps } from "@/ui/types";

function axesText(axes: Array<"SCHEME" | "ASSISTANTS"> = []): string {
  const s = axes.includes("SCHEME");
  const a = axes.includes("ASSISTANTS");
  if (s && a) return "Scheme + Assistants";
  if (s) return "Scheme";
  if (a) return "Assistants";
  return "Scheme";
}

export function StaffTreeScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const assignments = save.gameState.staff.assignments;
  const control = save.gameState.career.control;

  const rows: Array<{ side: "offense" | "defense" | "specialTeams"; label: string }> = [
    { side: "offense", label: "Offense" },
    { side: "defense", label: "Defense" },
    { side: "specialTeams", label: "Special Teams" },
  ];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Tree</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div className="ugf-pill">Budget: ${save.gameState.staff.budgetUsed.toLocaleString()} / ${save.gameState.staff.budgetTotal.toLocaleString()}</div>

        <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
          <b>Control Profile</b>
          {rows.map(({ side, label }) => {
            const sideControl = control[side];
            const lockAxes = sideControl.lockedBy?.axes ?? [];
            const schemeLocked = sideControl.locked && lockAxes.includes("SCHEME");
            const assistantsLocked = sideControl.locked && lockAxes.includes("ASSISTANTS");
            return (
              <div key={side} className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                <b>{label}</b>
                {sideControl.lockedBy ? (
                  <>
                    <div>Locked by {sideControl.lockedBy.role}: {sideControl.lockedBy.staffName}</div>
                    <div>Locked axes: {axesText(sideControl.lockedBy.axes)}</div>
                  </>
                ) : null}
                <label>
                  Scheme Control: {sideControl.schemeAuthority}
                  <input type="range" min={0} max={100} value={sideControl.schemeAuthority} disabled={schemeLocked} onChange={(e) => ui.dispatch({ type: "UPDATE_CONTROL", side, axis: "schemeAuthority", value: Number(e.target.value) })} />
                </label>
                <small>Higher = you dictate scheme + assistants.</small>
                <small>Lower = coordinators control scheme + assistants.</small>
                <label>
                  Assistants Control: {sideControl.assistantsAuthority}
                  <input type="range" min={0} max={100} value={sideControl.assistantsAuthority} disabled={assistantsLocked} onChange={(e) => ui.dispatch({ type: "UPDATE_CONTROL", side, axis: "assistantsAuthority", value: Number(e.target.value) })} />
                </label>
                <small>Higher = you dictate scheme + assistants.</small>
                <small>Lower = coordinators control scheme + assistants.</small>
              </div></div>
            );
          })}
        </div></div>

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
