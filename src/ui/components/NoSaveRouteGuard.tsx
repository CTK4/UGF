import React from "react";
import type { UIController } from "@/ui/types";

type NoSaveRouteGuardProps = {
  ui: UIController;
  title: string;
};

export function NoSaveRouteGuard({ ui, title }: NoSaveRouteGuardProps) {
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">{title}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-pill">Create a save to access this.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })}>Back to Start</button>
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Create Coach</button>
        </div>
      </div>
    </div>
  );
}

