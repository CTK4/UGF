import React from "react";
import type { ScreenProps, StaffRole } from "@/ui/types";

const roleLabels: Record<StaffRole, string> = { hc: "HC", oc: "OC", dc: "DC", qb: "QB Coach", asst: "Assistant" };

export function StaffTreeScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Tree</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {(Object.entries(roleLabels) as Array<[StaffRole, string]>).map(([role, label]) => (
          <div key={role} className="ugf-card">
            <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div><b>{label}:</b> {save.staff[role as keyof typeof save.staff] ?? <span style={{ color: "crimson" }}>(Vacant)</span>}</div>
              <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role } })}>Hire {label === "Assistant" ? "Asst" : label}</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
}
