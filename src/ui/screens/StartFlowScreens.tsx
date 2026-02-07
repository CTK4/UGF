import React from "react";
import type { ScreenProps } from "@/ui/types";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";

export function StartScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  return (
    <div className="ugf-card" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12, textAlign: "center", maxWidth: 640 }}>
        <h2 className="ugf-card__title" style={{ fontSize: 24 }}>Start Your Career</h2>
        <div style={{ opacity: 0.85 }}>Build your legacy from Week 1. Choose your franchise and take control.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Start New Career</button>
          {state.corruptedSave ? <button className="danger" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset Save</button> : null}
        </div>
      </div>
    </div>
  );
}

export function ChooseFranchiseScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const selected = state.draftFranchiseId ? getFranchise(state.draftFranchiseId) : null;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Choose Franchise</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div style={{ maxHeight: 420, overflow: "auto", display: "grid", gap: 8 }}>
          {FRANCHISES.map((f) => (
            <button key={f.id} onClick={() => ui.dispatch({ type: "SET_DRAFT_FRANCHISE", franchiseId: f.id })} style={{ textAlign: "left" }}>
              <div><strong>{f.city} {f.name}</strong> ({f.id})</div>
              <div style={{ opacity: 0.8 }}>{f.traits.join(" • ")} • Job Security: {f.jobSecurity}</div>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="ugf-card">
            <div className="ugf-card__header"><h3 className="ugf-card__title">{selected.city} {selected.name}</h3></div>
            <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
              <div><b>Owner:</b> {selected.owner}</div>
              <div><b>GM Philosophy:</b> {selected.gmPhilosophy}</div>
              <div><b>Current HC Archetype:</b> {selected.hcArchetype}</div>
              <div><b>Expectation:</b> {selected.expectation}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CareerContext" } })}>Confirm Franchise</button>
                <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })}>Back</button>
              </div>
            </div>
          </div>
        ) : <div style={{ opacity: 0.75 }}>Tap a franchise to view details.</div>}
      </div>
    </div>
  );
}

export function CareerContextScreen({ ui }: ScreenProps) {
  const selected = getFranchise(ui.getState().draftFranchiseId ?? "");
  if (!selected) {
    return <div className="ugf-card"><div className="ugf-card__body">No franchise selected. <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Choose Franchise</button></div></div>;
  }

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Career Context</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div className="ugf-card">
          <div className="ugf-card__header"><h3 className="ugf-card__title">Your Situation</h3></div>
          <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
            <div>You are taking over the <b>{selected.city} {selected.name}</b>.</div>
            <div>Owner pressure is <b>{selected.jobSecurity}</b>.</div>
            <div>{selected.expectation}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => ui.dispatch({ type: "BEGIN_CAREER" })}>Begin Career</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Back</button>
        </div>
      </div>
    </div>
  );
}
