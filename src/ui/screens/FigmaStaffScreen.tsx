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

type StaffRow = {
  role: StaffRole;
  label: string;
  coachName: string;
  salary: number;
  years: number;
};

export function FigmaStaffScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const [tab, setTab] = useState<StaffTab>("Staff");

  if (!save) {
    return (
      <div className="ugf-card" data-ui={UI_ID.staff.root}>
        <div className="ugf-card__header"><h2 className="ugf-card__title">Coaching Staff</h2></div>
        <div className="ugf-card__body">Staff is unavailable without an active save.</div>
      </div>
    );
  }

  const staff = save.gameState.staff;

  const rows = useMemo<StaffRow[]>(() => {
    const assignments = staff.assignments;
    const ordered: StaffRole[] = ["HC", "OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];
    return ordered.map((role) => {
      const a = assignments[role];
      const coachName = role === "HC" ? "You" : a?.coachName ?? "Open";
      return {
        role,
        label: STAFF_ROLE_LABELS[role],
        coachName,
        salary: a?.salary ?? 0,
        years: a?.years ?? 0,
      };
    });
  }, [staff.assignments]);

  return (
    <div className="ugf-card" data-ui={UI_ID.staff.root}>
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Coaching Staff</h2>
      </div>

      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div data-ui={UI_ID.staff.tabs}>
          <SegmentedTabs
            value={tab}
            ariaLabel="Staff views"
            onChange={(key) => setTab(key as StaffTab)}
            tabs={["Staff", "Openings", "Free Agents"].map((t) => ({ key: t, label: t }))}
          />
        </div>

        <div className="ugf-pill" data-ui={UI_ID.staff.budgetPill}>
          Budget: {money(staff.budgetUsed)} / {money(staff.budgetTotal)}
        </div>

        {tab === "Staff" ? (
          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((row) => (
              <div key={row.role} className="ugf-card" data-ui={UI_ID.staff.roleRow}>
                <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <b>{row.label}</b>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{row.coachName}</div>
                  </div>

                  {row.role !== "HC" ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div className="ugf-pill">{row.salary ? `${money(row.salary)} / yr` : "—"}</div>
                      <div className="ugf-pill">{row.years ? `${row.years} yrs` : "—"}</div>
                      <button
                        type="button"
                        onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: isHireable(row.role) ? row.role : "OC" } })}
                      >
                        {row.coachName === "Open" ? "Fill Role" : "Review"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ugf-card">
            <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
              <div style={{ color: "var(--muted)" }}>
                This tab is a placeholder in the Figma port. Use the market screen to hire and browse candidates.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  data-ui={UI_ID.staff.hireMarketCta}
                  type="button"
                  onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: "OC" } })}
                >
                  Open Hire Market
                </button>
                <button data-ui={UI_ID.staff.backToHub} type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>
                  Back to Hub
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "Staff" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button data-ui={UI_ID.staff.hireMarketCta} type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "HireMarket", role: "OC" } })}>
              Hire Market
            </button>
            <button data-ui={UI_ID.staff.backToHub} type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>
              Back to Hub
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
