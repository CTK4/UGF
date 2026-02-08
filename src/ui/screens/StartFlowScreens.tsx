import React from "react";
import personnelData from "@/data/generated/personnel.json";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import type { ScreenProps } from "@/ui/types";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";

type PersonnelRow = { DisplayName: string; Position: string; Scheme?: string };
const personnel = personnelData as PersonnelRow[];

const backgrounds = ["Former QB", "Defensive Architect", "Special Teams Ace", "CEO Program Builder"];

const toPlaybook = (scheme = "Balanced") => (scheme.includes("(") ? scheme.slice(0, scheme.indexOf("(")).trim() : scheme);
const difficulty = (scheme = "Balanced") => {
  const s = scheme.toLowerCase();
  if (s.includes("rpo") || s.includes("pressure")) return "High";
  if (s.includes("spread") || s.includes("nickel")) return "Medium";
  return "Low";
};

function rolePool(position: "OC" | "DC" | "ST Coordinator") {
  return personnel.filter((p) => p.Position === position).slice(0, 6);
}

export function StartScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  return (
    <div className="ugf-card" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12, textAlign: "center", maxWidth: 640 }}>
        <h2 className="ugf-card__title" style={{ fontSize: 24 }}>Start Your Career</h2>
        <div style={{ opacity: 0.85 }}>Canonical opening sequence: Create Coach → Background → Interviews → Offers → Hire OC/DC/ST → January 2026 hub unlock.</div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TeamLogo ugfTeamKey={normalizeExcelTeamKey(f.fullName)} displayName={f.fullName} size={22} />
                <strong>{f.city} {f.name}</strong>
              </div>
            </button>
          ))}
        </div>
        {selected ? <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CareerContext" } })}>Confirm Franchise</button> : null}
      </div>
    </div>
  );
}

export function CareerContextScreen({ ui }: ScreenProps) {
  const selected = getFranchise(ui.getState().draftFranchiseId ?? "");
  if (!selected) return null;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Career Context</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div>You are interviewing for <b>{selected.city} {selected.name}</b>.</div>
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Continue</button>
      </div>
    </div>
  );
}

export function CreateCoachScreen({ ui }: ScreenProps) {
  const name = ui.getState().ui.opening.coachName;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Create Coach</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <input value={name} placeholder="Coach name" onChange={(e) => ui.dispatch({ type: "SET_COACH_NAME", coachName: e.target.value })} />
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CoachBackground" } })} disabled={!name.trim()}>Next: Background</button>
      </div>
    </div>
  );
}

export function CoachBackgroundScreen({ ui }: ScreenProps) {
  const selected = ui.getState().ui.opening.background;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Background</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {backgrounds.map((b) => (
          <button key={b} onClick={() => ui.dispatch({ type: "SET_BACKGROUND", background: b })} style={{ textAlign: "left" }}>
            {selected === b ? "✓ " : ""}{b}
          </button>
        ))}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Next: Interviews</button>
      </div>
    </div>
  );
}

export function InterviewsScreen({ ui }: ScreenProps) {
  const notes = ui.getState().ui.opening.interviewNotes;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interviews</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {notes.length ? notes.map((n) => <div key={n} className="ugf-pill">{n}</div>) : <div>Run your interview circuit to unlock offers.</div>}
        <button onClick={() => ui.dispatch({ type: "RUN_INTERVIEWS" })}>Run Interviews</button>
      </div>
    </div>
  );
}

export function OffersScreen({ ui }: ScreenProps) {
  const offers = ui.getState().ui.opening.offers;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Offers</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {offers.map((teamId) => {
          const f = getFranchise(teamId);
          if (!f) return null;
          return <button key={teamId} onClick={() => ui.dispatch({ type: "ACCEPT_OFFER", franchiseId: teamId })}>Accept {f.city} {f.name}</button>;
        })}
      </div>
    </div>
  );
}

export function HireCoordinatorsScreen({ ui }: ScreenProps) {
  const picks = ui.getState().ui.opening.coordinatorChoices;
  const roles: Array<["OC" | "DC" | "STC", "OC" | "DC" | "ST Coordinator"]> = [["OC", "OC"], ["DC", "DC"], ["STC", "ST Coordinator"]];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Hire OC / DC / ST</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        {roles.map(([role, pos]) => (
          <div key={role} className="ugf-card">
            <div className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
              <b>{pos}</b>
              {rolePool(pos).map((c) => (
                <button key={`${pos}-${c.DisplayName}`} onClick={() => ui.dispatch({ type: "SELECT_OPENING_COORDINATOR", role, candidateName: c.DisplayName })} style={{ textAlign: "left" }}>
                  {picks[role] === c.DisplayName ? "✓ " : ""}
                  {c.DisplayName} • Scheme: {c.Scheme ?? "Balanced"} • Playbook: {toPlaybook(c.Scheme)} • Install: {difficulty(c.Scheme)}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize and Enter January 2026</button>
      </div>
    </div>
  );
}

export function StaffMeetingScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Mandatory Staff Meeting • January 2026</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div>HC: {save.staff.HC}</div>
        <div>OC: {save.staff.OC ?? "Vacant"}</div>
        <div>DC: {save.staff.DC ?? "Vacant"}</div>
        <div>ST: {save.staff.STC ?? "Vacant"}</div>
        <button onClick={() => ui.dispatch({ type: "COMPLETE_STAFF_MEETING" })}>Complete Meeting and Unlock Hub</button>
      </div>
    </div>
  );
}
