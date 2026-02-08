import React from "react";
import type { ScreenProps } from "@/ui/types";

export function StartScreen({ ui }: ScreenProps) {
  const hasSave = !!ui.getState().save;
  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {hasSave ? <button onClick={() => ui.dispatch({ type: "LOAD_GAME" })}>Resume Career</button> : null}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Start New Career</button>
      </div>
    </div>
  );
}
