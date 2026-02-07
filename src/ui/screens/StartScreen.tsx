import React from "react";
import type { ScreenProps } from "@/ui/types";

export function StartScreen({ ui }: ScreenProps) {
  const notice = ui.getState().lastNotice;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Start</h2>
      </div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div>Create or load a save to begin.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NEW_GAME" })}>New Game</button>
          <button onClick={() => ui.dispatch({ type: "LOAD_GAME" })}>Load Game</button>
          <button className="danger" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset Save</button>
        </div>
        {notice ? <div style={{ opacity: 0.85 }}>{notice}</div> : null}
      </div>
    </div>
  );
}
