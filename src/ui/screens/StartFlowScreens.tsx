import React from "react";
import personnelData from "@/data/generated/personnel.json";
import type { ScreenProps } from "@/ui/types";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";

type PersonnelRow = { DisplayName: string; Position: string; Scheme?: string };
const personnel = personnelData as PersonnelRow[];
const backgrounds = ["Former QB", "Defensive Architect", "Special Teams Ace", "CEO Program Builder"];

function rolePool(position: "OC" | "DC" | "ST Coordinator") {
  return personnel.filter((p) => p.Position === position).slice(0, 6);
}

export function StartScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const hasSave = !!state.save;

  return (
    <div className="ugf-card" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12, textAlign: "center", maxWidth: 640 }}>
        <h2 className="ugf-card__title" style={{ fontSize: 24 }}>Start Your Career</h2>
        {hasSave ? <div className="ugf-pill">Resume available: Week {state.save.gameState.time.week} • {state.save.gameState.phase}</div> : null}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {hasSave ? <button onClick={() => ui.dispatch({ type: "LOAD_GAME" })}>Resume Career</button> : null}
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Start New Career</button>
          <button className="danger" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset</button>
        </div>
      </div>
    </div>
  );
}

export function ChooseFranchiseScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Choose Franchise</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {FRANCHISES.map((f) => <button key={f.id} onClick={() => ui.dispatch({ type: "SET_DRAFT_FRANCHISE", franchiseId: f.id })}>{f.fullName}</button>)}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CareerContext" } })} disabled={!state.draftFranchiseId}>Confirm Franchise</button>
      </div>
    </div>
  );
}

export function CareerContextScreen({ ui }: ScreenProps) {
  const selected = getFranchise(ui.getState().draftFranchiseId ?? "");
  if (!selected) return null;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}><div>Interviewing for <b>{selected.fullName}</b>.</div><button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Continue</button></div></div>;
}

export function CreateCoachScreen({ ui }: ScreenProps) {
  const name = ui.getState().ui.opening.coachName;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}><input value={name} placeholder="Coach name" onChange={(e) => ui.dispatch({ type: "SET_COACH_NAME", coachName: e.target.value })} /><button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CoachBackground" } })} disabled={!name.trim()}>Next</button></div></div>;
}

export function CoachBackgroundScreen({ ui }: ScreenProps) {
  const selected = ui.getState().ui.opening.background;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>{backgrounds.map((b) => <button key={b} onClick={() => ui.dispatch({ type: "SET_BACKGROUND", background: b })}>{selected === b ? "✓ " : ""}{b}</button>)}<button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Next</button></div></div>;
}

export function InterviewsScreen({ ui }: ScreenProps) {
  return <div className="ugf-card"><div className="ugf-card__body"><button onClick={() => ui.dispatch({ type: "RUN_INTERVIEWS" })}>Run Interviews</button></div></div>;
}

export function OffersScreen({ ui }: ScreenProps) {
  const offers = ui.getState().ui.opening.offers;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>{offers.map((id) => <button key={id} onClick={() => ui.dispatch({ type: "ACCEPT_OFFER", franchiseId: id })}>Accept {getFranchise(id)?.fullName ?? id}</button>)}</div></div>;
}

export function HireCoordinatorsScreen({ ui }: ScreenProps) {
  const picks = ui.getState().ui.opening.coordinatorChoices;
  const roles: Array<["OC" | "DC" | "STC", "OC" | "DC" | "ST Coordinator"]> = [["OC", "OC"], ["DC", "DC"], ["STC", "ST Coordinator"]];

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {roles.map(([role, pos]) => (
          <div key={role}>
            <b>{role}</b>
            {rolePool(pos).map((c) => <button key={c.DisplayName} onClick={() => ui.dispatch({ type: "SET_COORDINATOR_CHOICE", role, candidateName: c.DisplayName })}>{picks[role] === c.DisplayName ? "✓ " : ""}{c.DisplayName}</button>)}
          </div>
        ))}
        <button disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize and Enter Hub</button>
      </div>
    </div>
  );
}

export function StaffMeetingScreen({ ui }: ScreenProps) {
  return <div className="ugf-card"><div className="ugf-card__body"><button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Enter Hub</button></div></div>;
}
