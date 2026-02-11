import React, { useMemo } from "react";
import type { ScreenProps } from "@/ui/types";

export function DraftScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return <div className="ugf-card"><div className="ugf-card__body">No save loaded.</div></div>;

  const gs = save.gameState;
  const draft = gs.draftV1;
  if (!draft) return <div className="ugf-card"><div className="ugf-card__body">Draft state missing.</div></div>;

  const available = useMemo(() => draft.prospects.filter((p) => !draft.pickedProspectIds.includes(p.id)), [draft]);

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Draft Week</h2>
        <div className="ugf-pill">Pick: 1 (MVV)</div>
      </div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill">
          {draft.userPickMade ? "Pick made. Continue to schedule." : "Choose one prospect. Traits are partial (MVV fog)."}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {available.slice(0, 12).map((p) => (
            <div key={p.id} className="ugf-card" style={{ margin: 0 }}>
              <div className="ugf-card__body" style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.name} — {p.pos}</div>
                  <div className="ugf-pill" style={{ display: "inline-flex", gap: 8 }}>
                    <span>School: {p.school}</span>
                    <span>Grade: {p.grade}</span>
                    <span>Traits: {p.traits.join(", ") || "—"}</span>
                  </div>
                </div>
                <button disabled={draft.userPickMade} onClick={() => ui.dispatch({ type: "DRAFT_PICK", prospectId: p.id })}>
                  Draft
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
          <button disabled={!draft.userPickMade} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Schedule" } })}>
            View Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
